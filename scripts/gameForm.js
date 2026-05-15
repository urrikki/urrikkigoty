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

function getAdminToken() {
    return localStorage.getItem('adminToken');
}

async function callGameAPI(endpoint, body) {
    const token = getAdminToken();
    const res = await fetch(`${AUTH_API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, token })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Erreur serveur');
    return data;
}

function applyGamesUpdate(games) {
    AppState.games = games;
    // Vider le localStorage — GitHub est maintenant la source de vérité
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    renderCurrentView();
    updateStats();
    populateYearFilter();
}

async function handleGameFormSubmit(e) {
    e.preventDefault();
    const game = {
        name:    document.getElementById('gameName').value.trim(),
        year:    parseInt(document.getElementById('gameYear').value),
        rank:    document.getElementById('gameRank').value,
        picture: document.getElementById('gamePicture').value.trim(),
        review:  document.getElementById('gameReview').value.trim()
    };

    if (!game.name || !game.year || !game.picture || !game.review) {
        showNotification('Remplissez tous les champs', 'error');
        return;
    }

    const btn = e.target.querySelector('.btn-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

    try {
        let data;
        if (AppState.currentEditingGame) {
            data = await callGameAPI('/api/games/update', {
                originalName: AppState.currentEditingGame.name,
                game
            });
        } else {
            data = await callGameAPI('/api/games/add', { game });
        }
        applyGamesUpdate(data.games);
        closeModal('addGameModal');
        showNotification('Jeu sauvegardé sur GitHub ✓', 'success');
    } catch (err) {
        showNotification(`Erreur : ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    }
}

async function handleDeleteGame() {
    if (!AppState.currentEditingGame) return;
    if (!confirm(`Supprimer "${AppState.currentEditingGame.name}" ?`)) return;

    try {
        const data = await callGameAPI('/api/games/delete', {
            name: AppState.currentEditingGame.name
        });
        applyGamesUpdate(data.games);
        closeModal('addGameModal');
        showNotification('Jeu supprimé de GitHub ✓', 'success');
    } catch (err) {
        showNotification(`Erreur : ${err.message}`, 'error');
    }
}