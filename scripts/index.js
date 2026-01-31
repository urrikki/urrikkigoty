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
    ADMIN_SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    STORAGE_KEY: 'gotyGamesData',
    DATA_PATH: 'data/games.json'
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    createParticles();
    setupTitleClickListener();
    checkSavedAuth();
    setupFocusMode();
    setupFavoritesButton();
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
            AppState.games = data.games || [];
            AppState.filteredGames = [...AppState.games];
            console.log('✅ Données chargées depuis games.json');
        }
        
        initializeTierList();
        updateStats();
        populateYearFilter();
        showNotification('Tier List chargée avec succès !', 'success');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        showNotification('Erreur de chargement des données', 'error');
        
        // Load empty state if no data
        AppState.games = [];
        AppState.filteredGames = [];
        initializeTierList();
    }
}

// ===== AUTHENTIFICATION SÉCURISÉE =====
async function sha384(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-384', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    const hash = await sha384(password);
    
    if (hash === CONFIG.TRISTAN) {
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
    
    if (AppState.isAdminMode) {
        body.classList.add('admin-mode');
        adminBadge.style.display = 'block';
        adminControls.style.display = 'flex';
        if (modalEditBtn) modalEditBtn.style.display = 'block';
        enableDragAndDrop();
    } else {
        body.classList.remove('admin-mode');
        adminBadge.style.display = 'none';
        adminControls.style.display = 'none';
        if (modalEditBtn) modalEditBtn.style.display = 'none';
        disableDragAndDrop();
    }
}

// ===== PARTICLES =====
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    container.innerHTML = '';
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
    if (!yearFilter) return;
    
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
    const searchInput = document.getElementById('searchInput');
    const yearFilter = document.getElementById('yearFilter');
    const tierFilter = document.getElementById('tierFilter');
    
    if (!searchInput || !yearFilter || !tierFilter) return;
    
    AppState.filters.search = searchInput.value.toLowerCase();
    AppState.filters.year = yearFilter.value;
    AppState.filters.tier = tierFilter.value;
    
    // Get favorites
    const favorites = JSON.parse(localStorage.getItem('gotyFavorites') || '[]');
    const favoriteNames = favorites.map(f => f.name);
    
    AppState.filteredGames = AppState.games.filter(game => {
        const matchSearch = !AppState.filters.search || 
            game.name.toLowerCase().includes(AppState.filters.search);
        const matchYear = !AppState.filters.year || 
            game.year.toString() === AppState.filters.year;
        const matchTier = !AppState.filters.tier || 
            game.rank === AppState.filters.tier;
        const matchFavorites = !AppState.filters.favoritesOnly || 
            favoriteNames.includes(game.name);
        
        return matchSearch && matchYear && matchTier && matchFavorites;
    });
    
    refreshTierList();
    const count = AppState.filteredGames.length;
    showNotification(`${count} jeu${count !== 1 ? 'x' : ''} trouvé${count !== 1 ? 's' : ''}`, 'info');
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const yearFilter = document.getElementById('yearFilter');
    const tierFilter = document.getElementById('tierFilter');
    
    if (searchInput) searchInput.value = '';
    if (yearFilter) yearFilter.value = '';
    if (tierFilter) tierFilter.value = '';
    
    AppState.filters = { 
        search: '', 
        year: '', 
        tier: '', 
        favoritesOnly: false
    };
    
    // Reset favorites button
    const favoritesBtn = document.getElementById('favoritesBtn');
    if (favoritesBtn) {
        favoritesBtn.textContent = '🤍';
        favoritesBtn.style.background = '';
    }
    
    AppState.filteredGames = [...AppState.games];
    refreshTierList();
    showNotification('Filtres réinitialisés', 'info');
}

// ===== STATISTIQUES SIMPLIFIÉES =====
function updateStats() {
    if (AppState.games.length === 0) return;
    
    // 1. Total des jeux
    const total = AppState.games.length;
    document.getElementById('totalGames').textContent = total;
    
    // 2. Année la plus récente
    const latestYear = Math.max(...AppState.games.map(g => g.year));
    document.getElementById('latestYear').textContent = latestYear;
    
    // 3. Dernier jeu ajouté (le plus récent par année)
    const latestGames = AppState.games.filter(g => g.year === latestYear);
    const latestGameName = latestGames.length > 0 ? 
        `${latestGames[0].name} (${latestGames[0].year})` : '-';
    document.getElementById('latestGame').textContent = latestGameName;
    
    // 4. Distribution des tiers avec visualisation
    const tierCounts = {};
    AppState.games.forEach(g => {
        tierCounts[g.rank] = (tierCounts[g.rank] || 0) + 1;
    });
    
    // Créer un graphique visuel pour la distribution
    renderTierDistributionChart(tierCounts, total);
}

function renderTierDistributionChart(tierCounts, total) {
    const chartContainer = document.getElementById('tierDistributionChart');
    if (!chartContainer) return;
    
    chartContainer.innerHTML = '';
    
    const tierOrder = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'NP'];
    const colors = {
        'S': '#FFD700',
        'A': '#FF6B6B',
        'B': '#4ECDC4',
        'C': '#45B7D1',
        'D': '#96CEB4',
        'E': '#FFEAA7',
        'F': '#DDA0DD',
        'NP': '#778899'
    };
    
    tierOrder.forEach(tier => {
        const count = tierCounts[tier] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'tier-distribution-bar-container';
        barContainer.style.margin = '8px 0';
        
        const tierInfo = document.createElement('div');
        tierInfo.className = 'tier-info';
        tierInfo.style.display = 'flex';
        tierInfo.style.justifyContent = 'space-between';
        tierInfo.style.marginBottom = '4px';
        
        const tierLabel = document.createElement('span');
        tierLabel.className = 'tier-label-small';
        tierLabel.textContent = `Tier ${tier}`;
        tierLabel.style.fontWeight = 'bold';
        tierLabel.style.color = colors[tier];
        
        const tierStats = document.createElement('span');
        tierStats.className = 'tier-stats';
        tierStats.textContent = `${count} jeu${count !== 1 ? 'x' : ''} (${percentage}%)`;
        tierStats.style.color = 'var(--text-secondary)';
        
        tierInfo.appendChild(tierLabel);
        tierInfo.appendChild(tierStats);
        
        const barBackground = document.createElement('div');
        barBackground.className = 'tier-bar-background';
        barBackground.style.height = '20px';
        barBackground.style.background = 'var(--bg-tier)';
        barBackground.style.borderRadius = '10px';
        barBackground.style.overflow = 'hidden';
        
        const bar = document.createElement('div');
        bar.className = 'tier-bar';
        bar.style.width = `${percentage}%`;
        bar.style.height = '100%';
        bar.style.background = colors[tier];
        bar.style.borderRadius = '10px';
        bar.style.transition = 'width 1s ease-in-out';
        bar.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        barBackground.appendChild(bar);
        
        barContainer.appendChild(tierInfo);
        barContainer.appendChild(barBackground);
        chartContainer.appendChild(barContainer);
    });
}

// ===== TIER LIST =====
function initializeTierList() {
    const tierList = document.getElementById('tierList');
    if (!tierList) return;
    
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
            if (AppState.comparisonMode) {
                selectForComparison(game, this);
            } else {
                showGameModal(game);
            }
        }
    });
    
    return gameItem;
}

// ===== MODE FOCUS =====
function setupFocusMode() {
    const tierLabels = document.querySelectorAll('.tier-label');
    
    tierLabels.forEach(label => {
        label.style.cursor = 'pointer';
        label.title = 'Cliquer pour isoler ce tier';
        
        label.addEventListener('click', function() {
            const tier = this.textContent;
            toggleFocusMode(tier);
        });
    });
}

function toggleFocusMode(tier) {
    const tierRows = document.querySelectorAll('.tier-row');
    const isFocusing = tierRows[0].classList.contains('focus-mode');
    
    if (isFocusing) {
        // Quitter le mode focus
        tierRows.forEach(row => {
            row.style.display = 'flex';
            row.style.opacity = '1';
            row.style.animation = '';
        });
        showNotification('Mode focus désactivé', 'info');
    } else {
        // Activer le mode focus
        tierRows.forEach(row => {
            const rowTier = row.querySelector('.tier-label').textContent;
            if (rowTier === tier) {
                row.style.display = 'flex';
                row.style.opacity = '1';
                row.style.animation = 'pulse 2s infinite';
            } else {
                row.style.display = 'none';
            }
        });
        showNotification(`Focus sur le tier ${tier}`, 'success');
    }
    
    // Basculer la classe
    tierRows.forEach(row => row.classList.toggle('focus-mode'));
}

// ===== DÉCOUVERTE ALÉATOIRE =====
function showRandomGame() {
    if (AppState.games.length === 0) {
        showNotification('Aucun jeu à afficher', 'warning');
        return;
    }
    
    // Use ALL games, not filtered games
    const randomIndex = Math.floor(Math.random() * AppState.games.length);
    const randomGame = AppState.games[randomIndex];
    
    // Animation du bouton
    const randomBtn = document.getElementById('randomGameBtn');
    randomBtn.style.animation = 'spin 1s ease';
    
    setTimeout(() => {
        randomBtn.style.animation = '';
        showGameModal(randomGame);
        showNotification(`🎲 Découverte aléatoire : ${randomGame.name}`, 'info');
    }, 1000);
}

// ===== SYSTÈME DE FAVORIS =====
function setupFavoritesButton() {
    const favoritesBtn = document.createElement('button');
    favoritesBtn.className = 'icon-btn';
    favoritesBtn.id = 'favoritesBtn';
    favoritesBtn.title = 'Afficher les favoris';
    favoritesBtn.textContent = '🤍';
    
    document.querySelector('.header-controls').appendChild(favoritesBtn);
    
    favoritesBtn.addEventListener('click', () => {
        toggleFavoritesFilter();
    });
    
    // Update button state on load
    updateFavoritesButton();
}

function toggleFavoritesFilter() {
    AppState.filters.favoritesOnly = !AppState.filters.favoritesOnly;
    applyFilters();
    updateFavoritesButton();
}

function updateFavoritesButton() {
    const favoritesBtn = document.getElementById('favoritesBtn');
    if (!favoritesBtn) return;
    
    if (AppState.filters.favoritesOnly) {
        favoritesBtn.textContent = '❤️';
        favoritesBtn.style.background = 'var(--accent-gold)';
        showNotification('Filtre favoris activé', 'success');
    } else {
        favoritesBtn.textContent = '🤍';
        favoritesBtn.style.background = '';
        showNotification('Filtre favoris désactivé', 'info');
    }
}

function toggleFavorite() {
    if (!AppState.currentEditingGame) return;
    
    const game = AppState.currentEditingGame;
    const favorites = JSON.parse(localStorage.getItem('gotyFavorites') || '[]');
    
    const index = favorites.findIndex(fav => fav.name === game.name);
    const favBtn = document.getElementById('toggleFavorite');
    
    if (index === -1) {
        favorites.push({ 
            name: game.name, 
            year: game.year,
            rank: game.rank,
            picture: game.picture
        });
        if (favBtn) favBtn.innerHTML = '❤️ Retirer des favoris';
        showNotification(`${game.name} ajouté aux favoris`, 'success');
    } else {
        favorites.splice(index, 1);
        if (favBtn) favBtn.innerHTML = '🤍 Ajouter aux favoris';
        showNotification(`${game.name} retiré des favoris`, 'info');
    }
    
    localStorage.setItem('gotyFavorites', JSON.stringify(favorites));
    
    // If favorites filter is active, refresh the tier list
    if (AppState.filters.favoritesOnly) {
        applyFilters();
    }
}

function updateFavoriteButton(game) {
    const favBtn = document.getElementById('toggleFavorite');
    if (!favBtn) return;
    
    const favorites = JSON.parse(localStorage.getItem('gotyFavorites') || '[]');
    const isFavorite = favorites.some(fav => fav.name === game.name);
    
    favBtn.innerHTML = isFavorite ? '❤️ Retirer des favoris' : '🤍 Ajouter aux favoris';
    favBtn.style.display = 'block';
}

// ===== COMPARAISON DE JEUX =====
function toggleComparisonMode() {
    AppState.comparisonMode = !AppState.comparisonMode;
    const compareBtn = document.getElementById('compareBtn');
    const body = document.body;
    
    if (AppState.comparisonMode) {
        compareBtn.style.background = 'var(--accent-gold)';
        compareBtn.style.animation = 'pulse 1s infinite';
        body.classList.add('comparison-mode');
        AppState.selectedForComparison = [];
        showNotification('⚖️ Mode comparaison activé - Sélectionnez 2 jeux', 'info');
        
        // Add selection indicator to all games
        document.querySelectorAll('.game-item').forEach(item => {
            item.style.boxShadow = '0 0 0 2px var(--accent-gold)';
        });
    } else {
        compareBtn.style.background = '';
        compareBtn.style.animation = '';
        body.classList.remove('comparison-mode');
        clearComparisonSelection();
        showNotification('Mode comparaison désactivé', 'info');
        closeModal('comparisonModal');
        
        // Remove selection indicator
        document.querySelectorAll('.game-item').forEach(item => {
            item.style.boxShadow = '';
        });
    }
}

function selectForComparison(game, element) {
    if (AppState.selectedForComparison.some(g => g.name === game.name)) {
        // Déselectionner
        AppState.selectedForComparison = AppState.selectedForComparison.filter(g => g.name !== game.name);
        element.classList.remove('comparison-selected');
        element.style.boxShadow = '0 0 0 2px var(--accent-gold)';
    } else {
        // Sélectionner (max 2)
        if (AppState.selectedForComparison.length < 2) {
            AppState.selectedForComparison.push(game);
            element.classList.add('comparison-selected');
            element.style.boxShadow = '0 0 0 4px var(--accent-red)';
        } else {
            showNotification('Maximum 2 jeux pour la comparaison', 'warning');
            return;
        }
    }
    
    // Si 2 jeux sélectionnés, afficher la comparaison
    if (AppState.selectedForComparison.length === 2) {
        setTimeout(() => {
            showComparisonModal();
        }, 500);
    }
}

function clearComparisonSelection() {
    document.querySelectorAll('.game-item.comparison-selected').forEach(item => {
        item.classList.remove('comparison-selected');
        item.style.boxShadow = '0 0 0 2px var(--accent-gold)';
    });
    AppState.selectedForComparison = [];
}

function showComparisonModal() {
    const comparisonContainer = document.getElementById('comparisonContainer');
    if (!comparisonContainer) return;
    
    comparisonContainer.innerHTML = '';
    
    AppState.selectedForComparison.forEach(game => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'comparison-game';
        
        gameDiv.innerHTML = `
            <img src="pictures/${game.picture}" alt="${game.name}">
            <h3>${game.name}</h3>
            <p>📅 ${game.year}</p>
            <p>🏆 Tier ${game.rank}</p>
            <div class="comparison-review">${game.review}</div>
        `;
        
        comparisonContainer.appendChild(gameDiv);
    });
    
    openModal('comparisonModal');
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
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const tierRow = e.currentTarget.closest('.tier-row');
    if (tierRow) tierRow.classList.add('drag-over');
}

function handleDragLeave(e) {
    const tierRow = e.currentTarget.closest('.tier-row');
    if (tierRow) tierRow.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
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
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showGameModal(game) {
    const modal = document.getElementById('gameModal');
    if (!modal) return;
    
    const modalImage = modal.querySelector('.modal-image');
    const modalTitle = modal.querySelector('.modal-title');
    const modalYear = modal.querySelector('.modal-year');
    const modalTier = modal.querySelector('.modal-tier');
    const modalReview = modal.querySelector('.modal-review');
    
    if (modalImage) modalImage.src = `pictures/${game.picture}`;
    if (modalTitle) modalTitle.textContent = game.name;
    if (modalYear) modalYear.textContent = `📅 ${game.year}`;
    if (modalTier) modalTier.textContent = `🏆 Tier ${game.rank}`;
    if (modalReview) modalReview.textContent = game.review;
    
    AppState.currentEditingGame = game;
    updateFavoriteButton(game);
    openModal('gameModal');
}

// ===== AJOUT / ÉDITION =====
function openAddGameModal() {
    const modal = document.getElementById('addGameModal');
    if (!modal) return;
    
    const title = document.getElementById('addGameModalTitle');
    const deleteBtn = document.getElementById('deleteGameBtn');
    
    if (title) title.textContent = 'Ajouter un jeu';
    if (deleteBtn) deleteBtn.style.display = 'none';
    
    resetAddGameForm();
    AppState.currentEditingGame = null;
    openModal('addGameModal');
}

function openEditGameModal(game) {
    const modal = document.getElementById('addGameModal');
    if (!modal) return;
    
    const title = document.getElementById('addGameModalTitle');
    const deleteBtn = document.getElementById('deleteGameBtn');
    
    if (title) title.textContent = 'Modifier le jeu';
    if (deleteBtn) deleteBtn.style.display = 'block';
    
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
    const form = document.getElementById('addGameForm');
    if (form) form.reset();
    AppState.currentEditingGame = null;
}

function handleGameFormSubmit(e) {
    e.preventDefault();
    
    const gameName = document.getElementById('gameName');
    const gameYear = document.getElementById('gameYear');
    const gameRank = document.getElementById('gameRank');
    const gamePicture = document.getElementById('gamePicture');
    const gameReview = document.getElementById('gameReview');
    
    if (!gameName || !gameYear || !gameRank || !gamePicture || !gameReview) return;
    
    const formData = {
        name: gameName.value.trim(),
        year: parseInt(gameYear.value),
        rank: gameRank.value,
        picture: gamePicture.value.trim(),
        review: gameReview.value.trim()
    };
    
    if (AppState.currentEditingGame) {
        // Mode édition
        const index = AppState.games.findIndex(g => g.name === AppState.currentEditingGame.name);
        if (index !== -1) {
            AppState.games[index] = formData;
            showNotification('✅ Jeu modifié avec succès !', 'success');
        }
    } else {
        // Mode ajout
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
            AppState.games.splice(index, 1);
            AppState.filteredGames = [...AppState.games];
            saveToLocalStorage();
            refreshTierList();
            updateStats();
            closeModal('addGameModal');
            resetAddGameForm();
            showNotification(`🗑️ Jeu supprimé avec succès`, 'success');
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
    console.log('Setting up event listeners...');
    
    // Thème
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Filtres
    const filterBtn = document.getElementById('filterBtn');
    const statsBtn = document.getElementById('statsBtn');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const searchInput = document.getElementById('searchInput');
    
    if (filterBtn) filterBtn.addEventListener('click', () => togglePanel('filterPanel'));
    if (statsBtn) statsBtn.addEventListener('click', () => togglePanel('statsPanel'));
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilters);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
    if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 300));
    
    // Jeu aléatoire
    const randomGameBtn = document.getElementById('randomGameBtn');
    if (randomGameBtn) randomGameBtn.addEventListener('click', showRandomGame);
    
    // Comparaison
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) compareBtn.addEventListener('click', toggleComparisonMode);
    
    // Admin
    const addGameBtn = document.getElementById('addGameBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (addGameBtn) addGameBtn.addEventListener('click', openAddGameModal);
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportData);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // Login
    const loginForm = document.getElementById('loginForm');
    const closeLogin = document.getElementById('closeLogin');
    const cancelLogin = document.getElementById('cancelLogin');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (closeLogin) closeLogin.addEventListener('click', () => closeModal('loginModal'));
    if (cancelLogin) cancelLogin.addEventListener('click', () => closeModal('loginModal'));
    
    // Comparaison modal
    const closeComparison = document.getElementById('closeComparison');
    if (closeComparison) closeComparison.addEventListener('click', () => closeModal('comparisonModal'));
    
    // Modals existants
    setupModalListeners();
    
    // Formulaire
    const addGameForm = document.getElementById('addGameForm');
    const cancelAddGame = document.getElementById('cancelAddGame');
    const deleteGameBtn = document.getElementById('deleteGameBtn');
    const modalEditBtn = document.getElementById('modalEditBtn');
    
    if (addGameForm) addGameForm.addEventListener('submit', handleGameFormSubmit);
    if (cancelAddGame) cancelAddGame.addEventListener('click', () => {
        closeModal('addGameModal');
        resetAddGameForm();
    });
    if (deleteGameBtn) deleteGameBtn.addEventListener('click', handleDeleteGame);
    if (modalEditBtn) modalEditBtn.addEventListener('click', editCurrentGame);
    
    // Favoris
    const toggleFavoriteBtn = document.getElementById('toggleFavorite');
    if (toggleFavoriteBtn) toggleFavoriteBtn.addEventListener('click', toggleFavorite);
    
    console.log('Event listeners setup complete');
}

function setupModalListeners() {
    ['gameModal', 'addGameModal', 'loginModal', 'comparisonModal'].forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => closeModal(modalId));
            }
            window.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modalId);
            });
        }
    });
}

function setupTitleClickListener() {
    const mainTitle = document.getElementById('mainTitle');
    if (!mainTitle) return;
    
    let clickCount = 0;
    let clickTimer = null;
    
    mainTitle.addEventListener('click', () => {
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
    const passwordInput = document.getElementById('loginPassword');
    const errorDiv = document.getElementById('loginError');
    
    if (!passwordInput || !errorDiv) return;
    
    const password = passwordInput.value;
    
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
    if (!panel) return;
    
    // Fermer les autres panels
    const panels = ['filterPanel', 'statsPanel'];
    panels.forEach(id => {
        if (id !== panelId) {
            const otherPanel = document.getElementById(id);
            if (otherPanel) otherPanel.style.display = 'none';
        }
    });
    
    // Basculer l'affichage du panel actuel
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    
    if (themeToggle) {
        themeToggle.textContent = isDark ? '☀️' : '🌙';
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    showNotification(isDark ? 'Thème sombre activé' : 'Thème clair activé', 'info');
}

// Vérifier le thème sauvegardé au démarrage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.textContent = '☀️';
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '10px',
        boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
        zIndex: '10000',
        fontWeight: '600',
        fontSize: '1rem',
        animation: 'slideIn 0.3s ease',
        maxWidth: '400px',
        fontFamily: 'var(--font-body)'
    });
    
    const colors = {
        success: { bg: '#28a745', color: '#fff' },
        error: { bg: '#dc3545', color: '#fff' },
        info: { bg: '#17a2b8', color: '#fff' },
        warning: { bg: '#ffc107', color: '#333' }
    };
    
    notification.style.backgroundColor = colors[type]?.bg || colors.info.bg;
    notification.style.color = colors[type]?.color || colors.info.color;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Ajouter les styles d'animation pour les notifications
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ===== UTILITAIRES =====
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
