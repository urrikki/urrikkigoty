const AppState = {
    games: [],
    isAdminMode: false,
    currentEditingGame: null
};

const CONFIG = {
    ADMIN_KEY_SEQUENCE: ['a', 'd', 'm', 'i', 'n'], 
    keySequence: [],
    STORAGE_KEY: 'gotyGamesData'
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupAdminKeyListener();
});

async function initializeApp() {
    try {
        const savedData = loadFromLocalStorage();
        
        if (savedData && savedData.games && savedData.games.length > 0) {
            AppState.games = savedData.games;
            console.log('Données chargées depuis localStorage');
        } else {
            const response = await fetch('data/games.json');
            if (!response.ok) throw new Error('Erreur de chargement du fichier JSON');
            const data = await response.json();
            AppState.games = data.games;
            console.log('Données chargées depuis games.json');
        }
        
        initializeTierList();
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showNotification('Erreur de chargement des données', 'error');
    }
}

function saveToLocalStorage() {
    try {
        const data = { games: AppState.games };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        console.log('Données sauvegardées dans localStorage');
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
        return false;
    }
}

function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Erreur lors du chargement depuis localStorage:', error);
        return null;
    }
}

function setupEventListeners() {
    const gameModal = document.getElementById('gameModal');
    const closeModal = gameModal.querySelector('.close-modal');
    
    closeModal.addEventListener('click', () => {
        gameModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === gameModal) {
            gameModal.style.display = 'none';
        }
    });
    
    document.getElementById('modalEditBtn').addEventListener('click', () => {
        editCurrentGame();
    });
    
    const addGameModal = document.getElementById('addGameModal');
    const closeAddModal = document.getElementById('closeAddModal');
    
    closeAddModal.addEventListener('click', () => {
        addGameModal.style.display = 'none';
        resetAddGameForm();
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === addGameModal) {
            addGameModal.style.display = 'none';
            resetAddGameForm();
        }
    });
    
    document.getElementById('addGameForm').addEventListener('submit', handleGameFormSubmit);
    document.getElementById('cancelAddGame').addEventListener('click', () => {
        addGameModal.style.display = 'none';
        resetAddGameForm();
    });
    
    document.getElementById('deleteGameBtn').addEventListener('click', handleDeleteGame);
    
    document.getElementById('addGameBtn').addEventListener('click', openAddGameModal);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('exitAdminBtn').addEventListener('click', exitAdminMode);
}

function setupAdminKeyListener() {
    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        CONFIG.keySequence.push(key);
        
        if (CONFIG.keySequence.length > CONFIG.ADMIN_KEY_SEQUENCE.length) {
            CONFIG.keySequence.shift();
        }
        
        if (CONFIG.keySequence.join('') === CONFIG.ADMIN_KEY_SEQUENCE.join('')) {
            toggleAdminMode();
            CONFIG.keySequence = []; 
        }
    });
}

function toggleAdminMode() {
    AppState.isAdminMode = !AppState.isAdminMode;
    updateAdminUI();
}

function exitAdminMode() {
    AppState.isAdminMode = false;
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
        modalEditBtn.style.display = 'block';
        showNotification('Mode Admin activé ! 🔧', 'success');
        enableDragAndDrop();
    } else {
        body.classList.remove('admin-mode');
        adminBadge.style.display = 'none';
        adminControls.style.display = 'none';
        modalEditBtn.style.display = 'none';
        showNotification('Mode Admin désactivé', 'info');
        disableDragAndDrop();
    }
}

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
    e.dataTransfer.setData('text/html', e.target.innerHTML);
    e.dataTransfer.setData('game-data', e.target.dataset.game);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const tierRow = e.currentTarget.closest('.tier-row');
    if (tierRow) {
        tierRow.classList.add('drag-over');
    }
    
    return false;
}

function handleDragLeave(e) {
    const tierRow = e.currentTarget.closest('.tier-row');
    if (tierRow) {
        tierRow.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();
    
    const tierRow = e.currentTarget.closest('.tier-row');
    if (tierRow) {
        tierRow.classList.remove('drag-over');
    }
    
    const gameData = e.dataTransfer.getData('game-data');
    if (!gameData) return false;
    
    const game = JSON.parse(gameData);
    const newTier = e.currentTarget.id.replace('tier-', '').toUpperCase().replace('-', ' ');
    
    updateGameRank(game.name, newTier);
    
    return false;
}

function updateGameRank(gameName, newRank) {
    const gameIndex = AppState.games.findIndex(g => g.name === gameName);
    if (gameIndex !== -1) {
        AppState.games[gameIndex].rank = newRank;
        saveToLocalStorage();
        refreshTierList();
        showNotification(`${gameName} déplacé vers le tier ${newRank}`, 'success');
    }
}

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
    
    AppState.games.forEach(game => {
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

function showGameModal(game) {
    const modal = document.getElementById('gameModal');
    const modalImage = modal.querySelector('.modal-image');
    const modalTitle = modal.querySelector('.modal-title');
    const modalYear = modal.querySelector('.modal-year');
    const modalReview = modal.querySelector('.modal-review');
    
    modalImage.src = `pictures/${game.picture}`;
    modalImage.alt = game.name;
    modalTitle.textContent = game.name;
    modalYear.textContent = `Année de sortie : ${game.year}`;
    modalReview.textContent = game.review;
    
    AppState.currentEditingGame = game;
    
    modal.style.display = 'block';
}

function editCurrentGame() {
    if (AppState.currentEditingGame) {
        document.getElementById('gameModal').style.display = 'none';
        openEditGameModal(AppState.currentEditingGame);
    }
}

function openAddGameModal() {
    const modal = document.getElementById('addGameModal');
    const title = document.getElementById('addGameModalTitle');
    const deleteBtn = document.getElementById('deleteGameBtn');
    
    title.textContent = 'Ajouter un jeu';
    deleteBtn.style.display = 'none';
    resetAddGameForm();
    
    AppState.currentEditingGame = null;
    modal.style.display = 'block';
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
    modal.style.display = 'block';
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
            showNotification('Jeu modifié avec succès !', 'success');
        }
    } else {
        const exists = AppState.games.some(g => g.name.toLowerCase() === formData.name.toLowerCase());
        if (exists) {
            showNotification('Un jeu avec ce nom existe déjà !', 'error');
            return;
        }
        
        AppState.games.push(formData);
        showNotification('Jeu ajouté avec succès !', 'success');
    }
    
    saveToLocalStorage();
    refreshTierList();
    document.getElementById('addGameModal').style.display = 'none';
    resetAddGameForm();
}

function handleDeleteGame() {
    if (!AppState.currentEditingGame) return;
    
    const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer "${AppState.currentEditingGame.name}" ?`);
    
    if (confirmDelete) {
        const index = AppState.games.findIndex(g => g.name === AppState.currentEditingGame.name);
        if (index !== -1) {
            const deletedGame = AppState.games.splice(index, 1)[0];
            saveToLocalStorage();
            refreshTierList();
            document.getElementById('addGameModal').style.display = 'none';
            resetAddGameForm();
            showNotification(`${deletedGame.name} supprimé avec succès`, 'success');
        }
    }
}

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
    
    showNotification('Données exportées avec succès !', 'success');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        zIndex: '10000',
        fontWeight: 'bold',
        fontSize: '1rem',
        animation: 'slideIn 0.3s ease',
        maxWidth: '400px'
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
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
