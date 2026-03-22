// ===== ÉTAT GLOBAL =====
const AppState = {
    games: [],
    filteredGames: [],
    isAdminMode: false,
    currentEditingGame: null,
    filters: { 
        search: '', 
        year: '', 
        tier: '', 
        favoritesOnly: false 
    },
    comparisonMode: false,
    selectedForComparison: []
};

const CONFIG = {
    TRISTAN: 'b53f3d5a331ac7ba157a9745e50ef88531f577d84ad1059ad287fdc26575161d62a154e1bc2a5143f24b4760846e49d6',
    ADMIN_SESSION_DURATION: 24 * 60 * 60 * 1000,
    STORAGE_KEY: 'gotyGamesData',
    DATA_PATH: 'data/games.json'
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkSavedAuth();
    setupTitleClickListener();
});

async function initializeApp() {
    try {
        const savedData = loadFromLocalStorage();
        if (savedData?.games?.length) {
            AppState.games = savedData.games;
        } else {
            const response = await fetch(CONFIG.DATA_PATH);
            const data = await response.json();
            AppState.games = data.games || [];
        }
        AppState.filteredGames = [...AppState.games];
        initializeTierList();
        updateStats();
        populateYearFilter();
        showNotification('Tier List chargée', 'success');
    } catch (err) {
        console.error(err);
        showNotification('Erreur de chargement', 'error');
    }
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification-${type}`;
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 2rem;
        font-size: 0.9rem;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideInRight 0.2s ease;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2500);
}

// ===== AUTH =====
async function sha384(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-384', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function checkSavedAuth() {
    const auth = localStorage.getItem('adminAuth');
    const expiry = parseInt(localStorage.getItem('adminAuthExpiry') || '0');
    if (auth === 'true' && Date.now() < expiry) activateAdminMode();
    else logout();
}

async function login(pwd) {
    const hash = await sha384(pwd);
    if (hash === CONFIG.TRISTAN) {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminAuthExpiry', (Date.now() + CONFIG.ADMIN_SESSION_DURATION).toString());
        activateAdminMode();
        closeModal('loginModal');
        showNotification('Mode admin activé', 'success');
        return true;
    }
    throw new Error('Mot de passe incorrect');
}

function logout() {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminAuthExpiry');
    AppState.isAdminMode = false;
    updateAdminUI();
    showNotification('Déconnexion', 'info');
}

function activateAdminMode() {
    AppState.isAdminMode = true;
    updateAdminUI();
}

function updateAdminUI() {
    const badge = document.getElementById('adminBadge');
    const controls = document.getElementById('adminControls');
    const editBtn = document.getElementById('modalEditBtn');
    document.body.classList.toggle('admin-mode', AppState.isAdminMode);
    if (badge) badge.style.display = AppState.isAdminMode ? 'block' : 'none';
    if (controls) controls.style.display = AppState.isAdminMode ? 'flex' : 'none';
    if (editBtn) editBtn.style.display = AppState.isAdminMode ? 'inline-flex' : 'none';
    if (AppState.isAdminMode) enableDragAndDrop();
    else disableDragAndDrop();
}

// ===== TIER LIST RENDERING =====
function initializeTierList() {
    const container = document.getElementById('tierList');
    if (!container) return;
    container.innerHTML = '';
    ['S','A','B','C','D','E','F','NP'].forEach(tier => {
        const row = document.createElement('div');
        row.className = 'tier-row';
        row.innerHTML = `<div class="tier-label">${tier}</div><div class="tier-games" id="tier-${tier.toLowerCase()}"></div>`;
        container.appendChild(row);
    });
    populateGames();
}

function populateGames() {
    const containers = document.querySelectorAll('.tier-games');
    containers.forEach(c => c.innerHTML = '');
    AppState.filteredGames.forEach(game => {
        const el = createGameElement(game);
        const target = document.getElementById(`tier-${game.rank.toLowerCase()}`);
        if (target) target.appendChild(el);
    });
    if (AppState.isAdminMode) enableDragAndDrop();
}

function createGameElement(game) {
    const div = document.createElement('div');
    div.className = 'game-item';
    div.dataset.game = JSON.stringify(game);
    const img = document.createElement('img');
    img.src = `pictures/${game.picture}`;
    img.alt = game.name;
    img.onerror = () => img.src = 'pictures/placeholder.jpg';
    div.appendChild(img);
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.game-item')) return;
        if (AppState.comparisonMode) selectForComparison(game, div);
        else showGameModal(game);
    });
    return div;
}

// ===== FILTERS =====
function populateYearFilter() {
    const select = document.getElementById('yearFilter');
    if (!select) return;
    const years = [...new Set(AppState.games.map(g => g.year))].sort((a,b)=>b-a);
    select.innerHTML = '<option value="">Toutes les années</option>';
    years.forEach(y => select.innerHTML += `<option value="${y}">${y}</option>`);
}

function applyFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const year = document.getElementById('yearFilter')?.value || '';
    const tier = document.getElementById('tierFilter')?.value || '';
    const favs = JSON.parse(localStorage.getItem('gotyFavorites') || '[]').map(f => f.name);
    AppState.filteredGames = AppState.games.filter(g => {
        return (!search || g.name.toLowerCase().includes(search)) &&
               (!year || g.year.toString() === year) &&
               (!tier || g.rank === tier) &&
               (!AppState.filters.favoritesOnly || favs.includes(g.name));
    });
    refreshTierList();
    showNotification(`${AppState.filteredGames.length} jeu(x)`, 'info');
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('tierFilter').value = '';
    AppState.filters.favoritesOnly = false;
    document.getElementById('favoritesBtn').innerHTML = '<i class="far fa-heart"></i>';
    AppState.filteredGames = [...AppState.games];
    refreshTierList();
}

function refreshTierList() { populateGames(); }

// ===== STATS =====
function updateStats() {
    const total = AppState.games.length;
    const latestYear = Math.max(...AppState.games.map(g => g.year), 0);
    const latestGame = AppState.games.filter(g => g.year === latestYear)[0];
    document.getElementById('totalGames').innerText = total;
    document.getElementById('latestYear').innerText = latestYear;
    document.getElementById('latestGame').innerText = latestGame ? `${latestGame.name} (${latestGame.year})` : '—';
    renderTierChart();
}

function renderTierChart() {
    const container = document.getElementById('tierDistributionChart');
    if (!container) return;
    const counts = {S:0,A:0,B:0,C:0,D:0,E:0,F:0,NP:0};
    AppState.games.forEach(g => counts[g.rank]++);
    const total = AppState.games.length;
    const colors = {S:'#f59e0b', A:'#ef4444', B:'#10b981', C:'#3b82f6', D:'#8b5cf6', E:'#ec489a', F:'#6b7280', NP:'#94a3b8'};
    container.innerHTML = '';
    for (let tier of Object.keys(counts)) {
        const percent = total ? Math.round((counts[tier]/total)*100) : 0;
        const row = document.createElement('div');
        row.className = 'tier-bar-container';
        row.innerHTML = `
            <span class="tier-label-small" style="color:${colors[tier]}">${tier}</span>
            <div class="tier-bar-bg"><div class="tier-bar" style="width:${percent}%; background:${colors[tier]}"></div></div>
            <span class="tier-stats">${counts[tier]} (${percent}%)</span>
        `;
        container.appendChild(row);
    }
}

// ===== FAVORITES =====
function toggleFavoritesFilter() {
    AppState.filters.favoritesOnly = !AppState.filters.favoritesOnly;
    const btn = document.getElementById('favoritesBtn');
    if (AppState.filters.favoritesOnly) btn.innerHTML = '<i class="fas fa-heart"></i>';
    else btn.innerHTML = '<i class="far fa-heart"></i>';
    applyFilters();
}

function toggleFavorite() {
    if (!AppState.currentEditingGame) return;
    const game = AppState.currentEditingGame;
    let favs = JSON.parse(localStorage.getItem('gotyFavorites') || '[]');
    const exists = favs.some(f => f.name === game.name);
    if (exists) favs = favs.filter(f => f.name !== game.name);
    else favs.push({ name: game.name, year: game.year, rank: game.rank, picture: game.picture });
    localStorage.setItem('gotyFavorites', JSON.stringify(favs));
    const favBtn = document.getElementById('toggleFavorite');
    favBtn.innerHTML = exists ? '<i class="far fa-heart"></i> Ajouter aux favoris' : '<i class="fas fa-heart"></i> Retirer des favoris';
    if (AppState.filters.favoritesOnly) applyFilters();
    showNotification(exists ? 'Retiré des favoris' : 'Ajouté aux favoris', 'info');
}

function updateFavoriteButton(game) {
    const favs = JSON.parse(localStorage.getItem('gotyFavorites') || '[]');
    const isFav = favs.some(f => f.name === game.name);
    const btn = document.getElementById('toggleFavorite');
    if (btn) btn.innerHTML = isFav ? '<i class="fas fa-heart"></i> Retirer des favoris' : '<i class="far fa-heart"></i> Ajouter aux favoris';
}

// ===== COMPARAISON =====
function toggleComparisonMode() {
    AppState.comparisonMode = !AppState.comparisonMode;
    const btn = document.getElementById('compareBtn');
    document.body.classList.toggle('comparison-mode', AppState.comparisonMode);
    if (AppState.comparisonMode) {
        btn.style.background = 'var(--accent-primary)';
        btn.style.color = 'white';
        AppState.selectedForComparison = [];
        showNotification('Mode comparaison actif – choisissez 2 jeux', 'info');
    } else {
        btn.style.background = '';
        btn.style.color = '';
        clearComparisonSelection();
        closeModal('comparisonModal');
    }
}

function selectForComparison(game, element) {
    if (AppState.selectedForComparison.some(g => g.name === game.name)) {
        AppState.selectedForComparison = AppState.selectedForComparison.filter(g => g.name !== game.name);
        element.classList.remove('comparison-selected');
    } else {
        if (AppState.selectedForComparison.length >= 2) {
            showNotification('Maximum 2 jeux', 'warning');
            return;
        }
        AppState.selectedForComparison.push(game);
        element.classList.add('comparison-selected');
    }
    if (AppState.selectedForComparison.length === 2) showComparisonModal();
}

function clearComparisonSelection() {
    document.querySelectorAll('.game-item.comparison-selected').forEach(el => el.classList.remove('comparison-selected'));
    AppState.selectedForComparison = [];
}

function showComparisonModal() {
    const container = document.getElementById('comparisonContainer');
    container.innerHTML = '';
    AppState.selectedForComparison.forEach(g => {
        container.innerHTML += `
            <div class="comparison-game">
                <img src="pictures/${g.picture}" alt="${g.name}">
                <h3>${g.name}</h3>
                <p>📅 ${g.year} | 🏆 ${g.rank}</p>
                <div class="comparison-review">${g.review}</div>
            </div>
        `;
    });
    openModal('comparisonModal');
}

// ===== DRAG & DROP (admin) =====
function enableDragAndDrop() {
    document.querySelectorAll('.game-item').forEach(el => {
        el.draggable = true;
        el.addEventListener('dragstart', e => { e.dataTransfer.setData('game-data', e.target.closest('.game-item').dataset.game); e.target.classList.add('dragging'); });
        el.addEventListener('dragend', e => e.target.classList.remove('dragging'));
    });
    document.querySelectorAll('.tier-games').forEach(zone => {
        zone.addEventListener('dragover', e => e.preventDefault());
        zone.addEventListener('drop', e => {
            e.preventDefault();
            const data = e.dataTransfer.getData('game-data');
            if (!data) return;
            const game = JSON.parse(data);
            const newTier = zone.id.replace('tier-', '').toUpperCase();
            const idx = AppState.games.findIndex(g => g.name === game.name);
            if (idx !== -1) {
                AppState.games[idx].rank = newTier;
                saveToLocalStorage();
                AppState.filteredGames = [...AppState.games];
                refreshTierList();
                updateStats();
                showNotification(`${game.name} → Tier ${newTier}`, 'success');
            }
        });
    });
}

function disableDragAndDrop() {
    document.querySelectorAll('.game-item').forEach(el => el.draggable = false);
}

// ===== MODALS =====
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function showGameModal(game) {
    const modal = document.getElementById('gameModal');
    modal.querySelector('.modal-image').src = `pictures/${game.picture}`;
    modal.querySelector('.modal-title').innerText = game.name;
    modal.querySelector('.modal-year').innerHTML = `<i class="far fa-calendar-alt"></i> ${game.year}`;
    modal.querySelector('.modal-tier').innerHTML = `<i class="fas fa-trophy"></i> Tier ${game.rank}`;
    modal.querySelector('.modal-review').innerText = game.review;
    AppState.currentEditingGame = game;
    updateFavoriteButton(game);
    openModal('gameModal');
}

function openAddGameModal() {
    document.getElementById('addGameModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un jeu';
    document.getElementById('deleteGameBtn').style.display = 'none';
    document.getElementById('addGameForm').reset();
    AppState.currentEditingGame = null;
    openModal('addGameModal');
}

function openEditGameModal(game) {
    document.getElementById('addGameModalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier le jeu';
    document.getElementById('deleteGameBtn').style.display = 'block';
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

function handleGameFormSubmit(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('gameName').value.trim(),
        year: parseInt(document.getElementById('gameYear').value),
        rank: document.getElementById('gameRank').value,
        picture: document.getElementById('gamePicture').value.trim(),
        review: document.getElementById('gameReview').value.trim()
    };
    if (!formData.name || !formData.year || !formData.picture || !formData.review) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    if (AppState.currentEditingGame) {
        const idx = AppState.games.findIndex(g => g.name === AppState.currentEditingGame.name);
        if (idx !== -1) AppState.games[idx] = formData;
    } else {
        if (AppState.games.some(g => g.name.toLowerCase() === formData.name.toLowerCase())) {
            showNotification('Ce jeu existe déjà', 'error');
            return;
        }
        AppState.games.push(formData);
    }
    saveToLocalStorage();
    AppState.filteredGames = [...AppState.games];
    refreshTierList();
    updateStats();
    populateYearFilter();
    closeModal('addGameModal');
    showNotification('Jeu sauvegardé', 'success');
}

function handleDeleteGame() {
    if (!AppState.currentEditingGame) return;
    if (confirm(`Supprimer "${AppState.currentEditingGame.name}" ?`)) {
        AppState.games = AppState.games.filter(g => g.name !== AppState.currentEditingGame.name);
        AppState.filteredGames = [...AppState.games];
        saveToLocalStorage();
        refreshTierList();
        updateStats();
        populateYearFilter();
        closeModal('addGameModal');
        showNotification('Jeu supprimé', 'success');
    }
}

// ===== STORAGE =====
function saveToLocalStorage() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ games: AppState.games }));
}
function loadFromLocalStorage() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

// ===== RANDOM =====
function showRandomGame() {
    if (!AppState.games.length) return;
    const random = AppState.games[Math.floor(Math.random() * AppState.games.length)];
    showGameModal(random);
}

// ===== EXPORT =====
function exportData() {
    const blob = new Blob([JSON.stringify({ games: AppState.games }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `goty-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showNotification('Export JSON réussi', 'success');
}

// ===== THEME =====
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('themeToggle');
    btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.getElementById('filterBtn').addEventListener('click', () => togglePanel('filterPanel'));
    document.getElementById('statsBtn').addEventListener('click', () => togglePanel('statsPanel'));
    document.getElementById('closeFilterPanel')?.addEventListener('click', () => closePanel('filterPanel'));
    document.getElementById('closeStatsPanel')?.addEventListener('click', () => closePanel('statsPanel'));
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('randomGameBtn').addEventListener('click', showRandomGame);
    document.getElementById('compareBtn').addEventListener('click', toggleComparisonMode);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('favoritesBtn').addEventListener('click', toggleFavoritesFilter);
    document.getElementById('addGameBtn')?.addEventListener('click', openAddGameModal);
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('loginForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        const pwd = document.getElementById('loginPassword').value;
        try { await login(pwd); } catch(err) { document.getElementById('loginError').innerText = err.message; document.getElementById('loginError').classList.add('show'); }
    });
    document.getElementById('cancelLogin')?.addEventListener('click', () => closeModal('loginModal'));
    document.getElementById('closeLogin')?.addEventListener('click', () => closeModal('loginModal'));
    document.getElementById('closeComparison')?.addEventListener('click', () => closeModal('comparisonModal'));
    document.getElementById('addGameForm').addEventListener('submit', handleGameFormSubmit);
    document.getElementById('cancelAddGame').addEventListener('click', () => closeModal('addGameModal'));
    document.getElementById('deleteGameBtn').addEventListener('click', handleDeleteGame);
    document.getElementById('modalEditBtn').addEventListener('click', editCurrentGame);
    document.getElementById('toggleFavorite').addEventListener('click', toggleFavorite);
    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; }));
    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none'));
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel.style.display === 'none') { closeAllPanels(); panel.style.display = 'block'; }
    else panel.style.display = 'none';
}
function closePanel(panelId) { document.getElementById(panelId).style.display = 'none'; }
function closeAllPanels() { ['filterPanel','statsPanel'].forEach(id => document.getElementById(id).style.display = 'none'); }

function setupTitleClickListener() {
    let clickCount = 0;
    const title = document.querySelector('.site-title');
    title.addEventListener('click', () => {
        clickCount++;
        if (clickCount === 3) { openModal('loginModal'); clickCount = 0; }
        setTimeout(() => clickCount = 0, 600);
    });
}

function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
}