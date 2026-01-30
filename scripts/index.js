// ===== ÉTAT GLOBAL =====
const AppState = {
    games: [],
    filteredGames: [],
    isAdminMode: false,
    currentEditingGame: null,
    filters: { search: '', year: '', tier: '' }
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    createParticles();
    checkSavedAuth();
    setupTitleClickListener();
});

async function initializeApp() {
    try {
        const savedData = loadFromLocalStorage();
        
        if (savedData && savedData.games && savedData.games.length > 0) {
            AppState.games = savedData.games;
            AppState.filteredGames = [...savedData.games];
            console.log('✅ Données chargées depuis localStorage');
        } else {
            const response = await fetch('data/games.json');
            if (!response.ok) throw new Error('Erreur de chargement du fichier JSON');
            const data = await response.json();
            AppState.games = data.games;
            AppState.filteredGames = [...data.games];
            console.log('✅ Données chargées depuis games.json');
        }
        
        initializeTierList();
        updateStats();
        populateYearFilter();
        showNotification('Tier List chargée avec succès !', 'success');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        showNotification('Erreur de chargement des données', 'error');
    }
}

// ===== AUTHENTIFICATION SÉCURISÉE =====
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function checkSavedAuth() {
    const savedAuth = localStorage.getItem('adminAuth');
    if (savedAuth === 'true') {
        const expiryTime = parseInt(localStorage.getItem('adminAuthExpiry') || '0');
        if (Date.now() < expiryTime) {
            activateAdminMode();
            const remaining = Math.floor((expiryTime - Date.now()) / 1000 / 60);
            console.log(`🔓 Session admin active (${remaining} min restantes)`);
        } else {
            logout();
        }
    }
}

async function login(password) {
    const hash = await sha256(password);
    
    if (hash === CONFIG.ADMIN_PASSWORD_HASH) {
        const expiryTime = Date.now() + CONFIG.ADMIN_SESSION_DURATION;
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminAuthExpiry', expiryTime.toString());
        
        activateAdminMode();
        closeModal('loginModal');
        document.getElementById('loginPassword').value = '';
        showNotification('✅ Connexion réussie ! Mode admin activé 🔧', 'success');
        return true;
    } else {
        throw new Error('Mot de passe incorrect');
    }
}

function logout() {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminAuthExpiry');
    AppState.isAdminMode = false;
    updateAdminUI();
    showNotification('Déconnexion réussie', 'info');
}

function activateAdminMode() {
    AppState.isAdminMode = true;
    updateAdminUI();
}

function updateAdminUI() {
    const body = document.body;
    const adminBadge = document.getElementById('adminBadge');
    const adminControls = document.getElementById('adminControls');
    const modalEditBtn = document.getElementById('modalEditBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (AppState.isAdminMode) {
        body.classList.add('admin-mode');
        adminBadge.style.display = 'block';
        adminControls.style.display = 'flex';
        modalEditBtn.style.display = 'block';
        enableDragAndDrop();
    } else {
        body.classList.remove('admin-mode');
        adminBadge.style.display = 'none';
        adminControls.style.display = 'none';
        modalEditBtn.style.display = 'none';
        disableDragAndDrop();
    }
}

// ===== PARTICLES =====
function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

// ===== FILTRES ET RECHERCHE =====
function populateYearFilter() {
    const yearFilter = document.getElementById('yearFilter');
    const years = [...new Set(AppState.games.map(g => g.year))].sort((a, b) => b - a);
    yearFilter.innerHTML = '<option value="">Toutes les années</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

function applyFilters() {
    AppState.filters.search = document.getElementById('searchInput').value.toLowerCase();
    AppState.filters.year = document.getElementById('yearFilter').value;
    AppState.filters.tier = document.getElementById('tierFilter').value;
    
    AppState.filteredGames = AppState.games.filter(game => {
        const matchSearch = !AppState.filters.search || 
            game.name.toLowerCase().includes(AppState.filters.search);
        const matchYear = !AppState.filters.year || 
            game.year.toString() === AppState.filters.year;
        const matchTier = !AppState.filters.tier || 
            game.rank === AppState.filters.tier;
        return matchSearch && matchYear && matchTier;
    });
    
    refreshTierList();
    showNotification(`${AppState.filteredGames.length} jeu(x) trouvé(s)`, 'info');
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('tierFilter').value = '';
    AppState.filters = { search: '', year: '', tier: '' };
    AppState.filteredGames = [...AppState.games];
    refreshTierList();
    showNotification('Filtres réinitialisés', 'info');
}

// ===== STATISTIQUES =====
function updateStats() {
    const total = AppState.games.length;
    if (total === 0) return;
    
    const avgYear = Math.round(AppState.games.reduce((sum, g) => sum + g.year, 0) / total);
    
    const tierCount = {};
    AppState.games.forEach(g => {
        tierCount[g.rank] = (tierCount[g.rank] || 0) + 1;
    });
    
    const topTier = Object.entries(tierCount).sort((a, b) => b[1] - a[1])[0];
    
    document.getElementById('totalGames').textContent = total;
    document.getElementById('avgYear').textContent = avgYear;
    document.getElementById('topTier').textContent = topTier ? `${topTier[0]} (${topTier[1]})` : '-';
}

// ===== TIER LIST =====
function initializeTierList() {
    const tierList = document.getElementById('tierList');
    tierList.innerHTML = '';
    
    const tiers = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'NP'];
    
    tiers.forEach(tier => {
        const tierRow = document.createElement('div');
        tierRow.className = 'tier-row';
        
        const tierLabel = document.createElement('div');
        tierLabel.className = `tier-label tier-${tier.toLowerCase()}`;
        tierLabel.textContent = tier;
        
        const tierGames = document.createElement('div');
        tierGames.className = 'tier-games';
        tierGames.id = `tier-${tier.toLowerCase()}`;
        
        tierRow.appendChild(tierLabel);
        tierRow.appendChild(tierGames);
        tierList.appendChild(tierRow);
    });
    
    populateGames();
}

function populateGames() {
    const tierGamesContainers = document.querySelectorAll('.tier-games');
    tierGamesContainers.forEach(container => {
        container.innerHTML = '';
    });
    
    AppState.filteredGames.forEach(game => {
        const gameElement = createGameElement(game);
        const tierContainer = document.getElementById(`tier-${game.rank.toLowerCase()}`);
        
        if (tierContainer) {
            tierContainer.appendChild(gameElement);
        } else {
            console.warn(`Conteneur pour le tier ${game.rank} introuvable`);
        }
    });
    
    if (AppState.isAdminMode) {
        enableDragAndDrop();
    }
}

function refreshTierList() {
    populateGames();
}

function createGameElement(game) {
    const gameItem = document.createElement('div');
    gameItem.className = 'game-item';
    gameItem.dataset.game = JSON.stringify(game);
    
    const gameImage = document.createElement('img');
    gameImage.src = `pictures/${game.picture}`;
    gameImage.alt = game.name;
    gameImage.onerror = function() {
        this.src = 'pictures/placeholder.jpg';
        console.warn(`Image non trouvée pour ${game.name}`);
    };
    
    gameItem.appendChild(gameImage);
    
    gameItem.addEventListener('click', function(e) {
        if (!e.target.classList.contains('dragging')) {
            showGameModal(game);
        }
    });
    
    return gameItem;
}

// ===== DRAG AND DROP =====
function enableDragAndDrop() {
    const gameItems = document.querySelectorAll('.game-item');
    gameItems.forEach(item => {
        item.draggable = true;
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });
    
    const tierGamesContainers = document.querySelectorAll('.tier-games');
    tierGamesContainers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        container.addEventListener('dragleave', handleDragLeave);
    });
}

function disableDragAndDrop() {
    const gameItems = document.querySelectorAll('.game-item');
    gameItems.forEach(item => {
        item.draggable = false;
        item.removeEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);
    });
    
    const tierGamesContainers = document.querySelectorAll('.tier-games');
    tierGamesContainers.forEach(container => {
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('drop', handleDrop);
        container.removeEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('game-data', e.target.dataset.game);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const tierRow = e.currentTarget.closest('.tier-row');
    if (tierRow) tierRow.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    const tierRow = e.currentTarget.closest('.tier-row');
    if (tierRow) tierRow.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    e.preventDefault();
    
    const tierRow = e.currentTarget.closest('.tier-row');
    if (tierRow) tierRow.classList.remove('drag-over');
    
    const gameData = e.dataTransfer.getData('game-data');
    if (!gameData) return false;
    
    const game = JSON.parse(gameData);
    const newTier = e.currentTarget.id.replace('tier-', '').toUpperCase();
    
    updateGameRank(game.name, newTier);
    return false;
}

function updateGameRank(gameName, newRank) {
    const gameIndex = AppState.games.findIndex(g => g.name === gameName);
    if (gameIndex !== -1) {
        AppState.games[gameIndex].rank = newRank;
        AppState.filteredGames = [...AppState.games];
        saveToLocalStorage();
        refreshTierList();
        updateStats();
        showNotification(`${gameName} → Tier ${newRank}`, 'success');
    }
}

// ===== MODALS =====
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showGameModal(game) {
    const modal = document.getElementById('gameModal');
    modal.querySelector('.modal-image').src = `pictures/${game.picture}`;
    modal.querySelector('.modal-title').textContent = game.name;
    modal.querySelector('.modal-year').textContent = `📅 ${game.year}`;
    modal.querySelector('.modal-tier').textContent = `🏆 Tier ${game.rank}`;
    modal.querySelector('.modal-review').textContent = game.review;
    
    AppState.currentEditingGame = game;
    openModal('gameModal');
}

// ===== AJOUT / ÉDITION =====
function openAddGameModal() {
    const modal = document.getElementById('addGameModal');
    const title = document.getElementById('addGameModalTitle');
    const deleteBtn = document.getElementById('deleteGameBtn');
    
    title.textContent = 'Ajouter un jeu';
    deleteBtn.style.display = 'none';
    resetAddGameForm();
    
    AppState.currentEditingGame = null;
    openModal('addGameModal');
}

function openEditGameModal(game) {
    const modal = document.getElementById('addGameModal');
    const title = document.getElementById('addGameModalTitle');
    const deleteBtn = document.getElementById('deleteGameBtn');
    
    title.textContent = 'Modifier le jeu';
    deleteBtn.style.display = 'block';
    
    document.getElementById('gameName').value = game.name;
    document.getElementById('gameYear').value = game.year;
    document.getElementById('gameRank').value = game.rank;
    document.getElementById('gamePicture').value = game.picture;
    document.getElementById('gameReview').value = game.review;
    
    AppState.currentEditingGame = game;
    openModal('addGameModal');
}

function editCurrentGame() {
    if (AppState.currentEditingGame) {
        closeModal('gameModal');
        openEditGameModal(AppState.currentEditingGame);
    }
}

function resetAddGameForm() {
    document.getElementById('addGameForm').reset();
    AppState.currentEditingGame = null;
}

function handleGameFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('gameName').value.trim(),
        year: parseInt(document.getElementById('gameYear').value),
        rank: document.getElementById('gameRank').value,
        picture: document.getElementById('gamePicture').value.trim(),
        review: document.getElementById('gameReview').value.trim()
    };
    
    if (AppState.currentEditingGame) {
        const index = AppState.games.findIndex(g => g.name === AppState.currentEditingGame.name);
        if (index !== -1) {
            AppState.games[index] = formData;
            showNotification('✅ Jeu modifié avec succès !', 'success');
        }
    } else {
        const exists = AppState.games.some(g => g.name.toLowerCase() === formData.name.toLowerCase());
        if (exists) {
            showNotification('❌ Un jeu avec ce nom existe déjà !', 'error');
            return;
        }
        
        AppState.games.push(formData);
        showNotification('✅ Jeu ajouté avec succès !', 'success');
    }
    
    saveToLocalStorage();
    AppState.filteredGames = [...AppState.games];
    refreshTierList();
    updateStats();
    populateYearFilter();
    closeModal('addGameModal');
    resetAddGameForm();
}

function handleDeleteGame() {
    if (!AppState.currentEditingGame) return;
    
    const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer "${AppState.currentEditingGame.name}" ?`);
    
    if (confirmDelete) {
        const index = AppState.games.findIndex(g => g.name === AppState.currentEditingGame.name);
        if (index !== -1) {
            const deletedGame = AppState.games.splice(index, 1)[0];
            AppState.filteredGames = [...AppState.games];
            saveToLocalStorage();
            refreshTierList();
            updateStats();
            closeModal('addGameModal');
            resetAddGameForm();
            showNotification(`🗑️ ${deletedGame.name} supprimé avec succès`, 'success');
        }
    }
}

// ===== SAUVEGARDE LOCALE =====
function saveToLocalStorage() {
    try {
        const data = { games: AppState.games };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        console.log('💾 Données sauvegardées dans localStorage');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
        return false;
    }
}

function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('❌ Erreur lors du chargement depuis localStorage:', error);
        return null;
    }
}

// ===== EXPORT =====
function exportData() {
    const dataStr = JSON.stringify({ games: AppState.games }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `goty-games-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('💾 Données exportées avec succès !', 'success');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    document.getElementById('filterBtn').addEventListener('click', () => togglePanel('filterPanel'));
    document.getElementById('statsBtn').addEventListener('click', () => togglePanel('statsPanel'));
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    
    document.getElementById('addGameBtn').addEventListener('click', openAddGameModal);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('closeLogin').addEventListener('click', () => closeModal('loginModal'));
    
    setupModalListeners();
    
    document.getElementById('addGameForm').addEventListener('submit', handleGameFormSubmit);
    document.getElementById('cancelAddGame').addEventListener('click', () => {
        closeModal('addGameModal');
        resetAddGameForm();
    });
    document.getElementById('deleteGameBtn').addEventListener('click', handleDeleteGame);
    document.getElementById('modalEditBtn').addEventListener('click', editCurrentGame);
}

function setupModalListeners() {
    ['gameModal', 'addGameModal', 'loginModal'].forEach(modalId => {
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modalId));
        }
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modalId);
        });
    });
}

function setupTitleClickListener() {
    let clickCount = 0;
    let clickTimer = null;
    
    document.getElementById('mainTitle').addEventListener('click', () => {
        clickCount++;
        if (clickCount === 1) {
            clickTimer = setTimeout(() => clickCount = 0, 600);
        } else if (clickCount === 3) {
            clearTimeout(clickTimer);
            clickCount = 0;
            if (!AppState.isAdminMode) {
                openModal('loginModal');
            }
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        await login(password);
        errorDiv.classList.remove('show');
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('show');
    }
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    
    const otherPanelId = panelId === 'filterPanel' ? 'statsPanel' : 'filterPanel';
    const otherPanel = document.getElementById(otherPanelId);
    otherPanel.style.display = 'none';
}

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    showNotification(isDark ? 'Thème sombre activé' : 'Thème clair activé', 'info');
}

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    document.getElementById('themeToggle').textContent = '☀️';
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '18px 30px',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        zIndex: '10000',
        fontWeight: '600',
        fontSize: '1rem',
        animation: 'slideIn 0.4s ease',
        maxWidth: '400px',
        backdropFilter: 'blur(10px)',
        fontFamily: 'var(--font-body)'
    });
    
    const colors = {
        success: { bg: 'rgba(40, 167, 69, 0.95)', color: '#fff' },
        error: { bg: 'rgba(220, 53, 69, 0.95)', color: '#fff' },
        info: { bg: 'rgba(23, 162, 184, 0.95)', color: '#fff' },
        warning: { bg: 'rgba(255, 193, 7, 0.95)', color: '#333' }
    };
    
    notification.style.backgroundColor = colors[type]?.bg || colors.info.bg;
    notification.style.color = colors[type]?.color || colors.info.color;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.4s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 400);
    }, 3500);
}

// ===== UTILITAIRES =====
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(500px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(500px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Message de démarrage
console.log('%c🎮 GOTY Tier List - Enhanced Edition', 'font-size: 20px; font-weight: bold; color: #D4AF37;');
console.log('%c🔐 Sécurité: Authentification SHA-256', 'font-size: 14px; color: #28a745;');
console.log('%c⚙️ Triple-clic sur "GOTY" pour le mode admin', 'font-size: 12px; color: #8B7500;');