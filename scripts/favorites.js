// ===== FAVORIS =====
function loadFavorites() {
    try {
        return JSON.parse(localStorage.getItem('gotyFavorites') || '[]');
    } catch {
        return [];
    }
}

function saveFavorites(favs) {
    localStorage.setItem('gotyFavorites', JSON.stringify(favs));
}

function toggleFavoritesFilter() {
    AppState.filters.favoritesOnly = !AppState.filters.favoritesOnly;
    document.getElementById('favoritesBtn').classList.toggle('active', AppState.filters.favoritesOnly);
    renderCurrentView();
}

function toggleFavorite() {
    if (!AppState.currentEditingGame) return;
    const name = AppState.currentEditingGame.name;
    let favs = loadFavorites();
    const exists = favs.includes(name);
    if (exists) favs = favs.filter(n => n !== name);
    else favs.push(name);
    saveFavorites(favs);
    updateFavoriteButton(AppState.currentEditingGame);
    showNotification(exists ? 'Retiré des favoris' : 'Ajouté aux favoris', 'info');
}

function updateFavoriteButton(game) {
    const favs = loadFavorites();
    const isFav = favs.includes(game.name);
    const btn = document.getElementById('toggleFavorite');
    if (btn) {
        btn.innerHTML = isFav
            ? '<i class="fas fa-heart"></i> Retirer des favoris'
            : '<i class="far fa-heart"></i> Ajouter aux favoris';
        btn.classList.toggle('active', isFav);
    }
}
