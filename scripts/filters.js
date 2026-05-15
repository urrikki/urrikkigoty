// ===== FILTRES & TRI =====
function applyFiltersAndSort() {
    const search = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const year = document.getElementById('yearFilter')?.value || '';
    const tier = document.getElementById('tierFilter')?.value || '';
    const sort = document.getElementById('sortBy')?.value || 'default';
    const favs = loadFavorites();

    AppState.filteredGames = AppState.games.filter(g => {
        if (search && !g.name.toLowerCase().includes(search)) return false;
        if (year && g.year.toString() !== year) return false;
        if (tier && g.rank !== tier) return false;
        if (AppState.filters.favoritesOnly && !favs.includes(g.name)) return false;
        return true;
    });

    if (sort === 'name') AppState.filteredGames.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'year') AppState.filteredGames.sort((a, b) => b.year - a.year);
}

function populateYearFilter() {
    const select = document.getElementById('yearFilter');
    if (!select) return;
    const years = [...new Set(AppState.games.map(g => g.year))].sort((a, b) => b - a);
    select.innerHTML = '<option value="">Toutes</option>';
    years.forEach(y => select.innerHTML += `<option value="${y}">${y}</option>`);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('tierFilter').value = '';
    document.getElementById('sortBy').value = 'default';
    AppState.filters.favoritesOnly = false;
    document.getElementById('favoritesBtn').classList.remove('active');
    renderCurrentView();
}

function updateGameCount() {
    const el = document.getElementById('gameCount');
    if (el) el.textContent = `${AppState.filteredGames.length} jeu${AppState.filteredGames.length !== 1 ? 'x' : ''}`;
}
