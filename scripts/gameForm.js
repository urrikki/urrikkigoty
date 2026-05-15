// ===== FORMULAIRE JEU (ADMIN) =====
function openAddGameModal() {
    document.getElementById('addGameModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un jeu';
    document.getElementById('deleteGameBtn').style.display = 'none';
    document.getElementById('addGameForm').reset();
    AppState.currentEditingGame = null;
    openModal('addGameModal');
}

function openEditGameModal(game) {
    document.getElementById('addGameModalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier le jeu';
    document.getElementById('deleteGameBtn').style.display = 'inline-flex';
    document.getElementById('gameName').value = game.name;
    document.getElementById('gameYear').value = game.year;
    document.getElementById('gameRank').value = game.rank;
    document.getElementById('gamePicture').value = game.picture;
    document.getElementById('gameReview').value = game.review;
    AppState.currentEditingGame = game;
    openModal('addGameModal');
}

function handleGameFormSubmit(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('gameName').value.trim(),
        year: parseInt(document.getElementById('gameYear').value),
        rank: document.getElementById('gameRank').value,
        picture: document.getElementById('gamePicture').value.trim(),
        review: document.getElementById('gameReview').value.trim()
    };
    if (!data.name || !data.year || !data.picture || !data.review) {
        showNotification('Remplissez tous les champs', 'error');
        return;
    }
    if (AppState.currentEditingGame) {
        const idx = AppState.games.findIndex(g => g.name === AppState.currentEditingGame.name);
        if (idx !== -1) AppState.games[idx] = data;
    } else {
        if (AppState.games.some(g => g.name.toLowerCase() === data.name.toLowerCase())) {
            showNotification('Ce jeu existe déjà', 'error');
            return;
        }
        AppState.games.push(data);
    }
    saveToLocalStorage();
    renderCurrentView();
    updateStats();
    populateYearFilter();
    closeModal('addGameModal');
    showNotification('Jeu sauvegardé', 'success');
}

function handleDeleteGame() {
    if (!AppState.currentEditingGame) return;
    if (confirm(`Supprimer "${AppState.currentEditingGame.name}" ?`)) {
        AppState.games = AppState.games.filter(g => g.name !== AppState.currentEditingGame.name);
        saveToLocalStorage();
        renderCurrentView();
        updateStats();
        populateYearFilter();
        closeModal('addGameModal');
        showNotification('Jeu supprimé', 'success');
    }
}
