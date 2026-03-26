// ===== ÉTAT GLOBAL =====
const AppState = {
    games: [],
    filteredGames: [],
    isAdminMode: false,
    currentEditingGame: null,
    filters: { search: '', year: '', tier: '', favoritesOnly: false },
    sortBy: 'default',
    comparisonMode: false,
    selectedForComparison: [],
    currentView: 'tierlist'
};

const CONFIG = {
    TRISTAN: 'b53f3d5a331ac7ba157a9745e50ef88531f577d84ad1059ad287fdc26575161d62a154e1bc2a5143f24b4760846e49d6',
    ADMIN_SESSION_DURATION: 24 * 60 * 60 * 1000,
    STORAGE_KEY: 'gotyGamesData'
};

const DEFAULT_GAMES = [];

const DATA_PATH = 'data/games.json';

const TIERS = ['S','A','B','C','D','E','F','NP'];
const TIER_COLORS = { S:'#d97706', A:'#ef4444', B:'#10b981', C:'#3b82f6', D:'#8b5cf6', E:'#ec4899', F:'#6b7280', NP:'#94a3b8' };

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkSavedAuth();
    setupTitleClickListener();
    initTheme();
});

async function initializeApp() {
    try {
        const saved = loadFromLocalStorage();
        if (saved?.games?.length) {
            AppState.games = saved.games;
        } else {
            const response = await fetch(DATA_PATH);
            const data = await response.json();
            AppState.games = data.games || [];
        }
        AppState.filteredGames = [...AppState.games];
        renderCurrentView();
        updateStats();
        populateYearFilter();
        updateGameCount();
        showNotification('Tier List chargée', 'success');
    } catch (err) {
        console.error(err);
        showNotification('Erreur de chargement', 'error');
    }
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    const colors = { success: '#10b981', error: '#ef4444', info: '#6366f1', warning: '#f59e0b' };
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    notif.style.background = colors[type] || colors.info;
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
    else logout(true);
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

function logout(silent) {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminAuthExpiry');
    AppState.isAdminMode = false;
    updateAdminUI();
    if (!silent) showNotification('Déconnexion', 'info');
}

function activateAdminMode() {
    AppState.isAdminMode = true;
    updateAdminUI();
}

function updateAdminUI() {
    const badge = document.getElementById('adminBadge');
    const controls = document.getElementById('adminControls');
    const editBtn = document.getElementById('modalEditBtn');
    if (badge) badge.style.display = AppState.isAdminMode ? 'block' : 'none';
    if (controls) controls.style.display = AppState.isAdminMode ? 'flex' : 'none';
    if (editBtn) editBtn.style.display = AppState.isAdminMode ? 'inline-flex' : 'none';
}

// ===== THEME =====
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggle').innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// ===== VIEWS =====
function switchView(view) {
    AppState.currentView = view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    document.getElementById('tierListView').style.display = view === 'tierlist' ? '' : 'none';
    document.getElementById('timelineView').style.display = view === 'timeline' ? '' : 'none';
    document.getElementById('galleryView').style.display = view === 'gallery' ? '' : 'none';
    
    renderCurrentView();
}

function renderCurrentView() {
    applyFiltersAndSort();
    if (AppState.currentView === 'tierlist') renderTierList();
    else if (AppState.currentView === 'timeline') renderTimeline();
    else if (AppState.currentView === 'gallery') renderGallery();
    updateGameCount();
}

// ===== TIER LIST =====
function renderTierList() {
    const container = document.getElementById('tierList');
    container.innerHTML = '';
    TIERS.forEach(tier => {
        const row = document.createElement('div');
        row.className = 'tier-row';
        row.innerHTML = `<div class="tier-label" style="--tier-color: var(--tier-${tier.toLowerCase()})"><span>${tier}</span></div><div class="tier-games" id="tier-${tier.toLowerCase()}"></div>`;
        container.appendChild(row);
    });
    AppState.filteredGames.forEach((game, i) => {
        const el = createGameElement(game, i);
        const target = document.getElementById(`tier-${game.rank.toLowerCase()}`);
        if (target) target.appendChild(el);
    });
}

function createGameElement(game, index = 0) {
    const div = document.createElement('div');
    div.className = 'game-item';
    if (AppState.selectedForComparison.some(g => g.name === game.name)) div.classList.add('compare-selected');
    div.style.animationDelay = `${index * 0.03}s`;
    const img = document.createElement('img');
    img.src = game.picture.startsWith('http') ? game.picture : 'pictures/' + game.picture;
    img.alt = game.name;
    img.loading = 'lazy';
    img.onerror = () => img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23ddd"/></svg>';
    div.appendChild(img);
    div.addEventListener('click', () => {
        if (AppState.comparisonMode) selectForComparison(game, div);
        else showGameModal(game);
    });
    return div;
}

// ===== TIMELINE =====
function renderTimeline() {
    const container = document.getElementById('timelineView');
    container.innerHTML = '';
    const byYear = new Map();
    AppState.filteredGames.forEach(g => {
        if (!byYear.has(g.year)) byYear.set(g.year, []);
        byYear.get(g.year).push(g);
    });
    const sorted = [...byYear.entries()].sort((a, b) => b[0] - a[0]);
    sorted.forEach(([year, games], yi) => {
        const section = document.createElement('div');
        section.className = 'timeline-year';
        section.style.animationDelay = `${yi * 0.08}s`;
        games.sort((a, b) => TIERS.indexOf(a.rank) - TIERS.indexOf(b.rank));
        section.innerHTML = `
            <div class="timeline-marker">${year}</div>
            <div class="timeline-connector"></div>
            <div class="timeline-content">
                <div class="timeline-header"><span>${games.length} jeu${games.length > 1 ? 'x' : ''}</span></div>
                <div class="timeline-games" id="timeline-${year}"></div>
            </div>
        `;
        container.appendChild(section);
        const gamesContainer = section.querySelector('.timeline-games');
        games.forEach((game, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'timeline-game-wrapper';
            wrapper.appendChild(createGameElement(game, i));
            const tag = document.createElement('span');
            tag.className = 'tier-tag';
            tag.textContent = game.rank;
            wrapper.appendChild(tag);
            gamesContainer.appendChild(wrapper);
        });
    });
}

// ===== GALLERY =====
function renderGallery() {
    const container = document.getElementById('galleryView');
    container.innerHTML = '';
    AppState.filteredGames.forEach((game, i) => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.style.animationDelay = `${i * 0.02}s`;
        card.innerHTML = `
            <div class="gallery-card-img"><img src="${game.picture.startsWith('http') ? game.picture : 'pictures/' + game.picture}" alt="${game.name}" loading="lazy"></div>
            <div class="gallery-card-info">
                <h3>${game.name}</h3>
                <div class="gallery-card-meta">
                    <span><i class="far fa-calendar-alt"></i> ${game.year}</span>
                    <span><i class="fas fa-trophy"></i> ${game.rank}</span>
                </div>
            </div>
        `;
        card.addEventListener('click', () => showGameModal(game));
        container.appendChild(card);
    });
}

// ===== FILTERS & SORT =====
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

// ===== STATS =====
function updateStats() {
    const total = AppState.games.length;
    const latestYear = Math.max(...AppState.games.map(g => g.year), 0);
    const latestGame = AppState.games.find(g => g.year === latestYear);
    document.getElementById('totalGames').innerText = total;
    document.getElementById('latestYear').innerText = latestYear;
    document.getElementById('latestGame').innerText = latestGame ? latestGame.name : '—';
    renderCharts();
}

function renderCharts() {
    // Tier chart
    const tierContainer = document.getElementById('tierChart');
    if (!tierContainer) return;
    const counts = {};
    TIERS.forEach(t => counts[t] = 0);
    AppState.games.forEach(g => counts[g.rank]++);
    const total = AppState.games.length;
    tierContainer.innerHTML = '';
    TIERS.forEach(tier => {
        const pct = total ? Math.round((counts[tier] / total) * 100) : 0;
        tierContainer.innerHTML += `
            <div class="chart-bar-row">
                <span class="chart-bar-label" style="color:${TIER_COLORS[tier]}">${tier}</span>
                <div class="chart-bar-bg"><div class="chart-bar" style="width:${pct}%;background:${TIER_COLORS[tier]}"></div></div>
                <span class="chart-bar-value">${counts[tier]} (${pct}%)</span>
            </div>`;
    });

    // Year chart
    const yearContainer = document.getElementById('yearChart');
    if (!yearContainer) return;
    const yearCounts = {};
    AppState.games.forEach(g => { yearCounts[g.year] = (yearCounts[g.year] || 0) + 1; });
    const years = Object.keys(yearCounts).sort();
    const maxCount = Math.max(...Object.values(yearCounts));
    yearContainer.innerHTML = '';
    years.forEach(y => {
        const pct = maxCount ? Math.round((yearCounts[y] / maxCount) * 100) : 0;
        yearContainer.innerHTML += `
            <div class="chart-bar-row">
                <span class="chart-bar-label">${y}</span>
                <div class="chart-bar-bg"><div class="chart-bar" style="width:${pct}%;background:var(--text-primary)"></div></div>
                <span class="chart-bar-value">${yearCounts[y]}</span>
            </div>`;
    });
}

// ===== FAVORITES =====
function loadFavorites() {
    try { return JSON.parse(localStorage.getItem('gotyFavorites') || '[]'); } catch { return []; }
}
function saveFavorites(favs) { localStorage.setItem('gotyFavorites', JSON.stringify(favs)); }

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
        btn.innerHTML = isFav ? '<i class="fas fa-heart"></i> Retirer des favoris' : '<i class="far fa-heart"></i> Ajouter aux favoris';
        btn.classList.toggle('active', isFav);
    }
}

// ===== COMPARISON =====
function toggleComparisonMode() {
    AppState.comparisonMode = !AppState.comparisonMode;
    const btn = document.getElementById('compareBtn');
    btn.classList.toggle('active', AppState.comparisonMode);
    document.body.classList.toggle('compare-mode', AppState.comparisonMode);
    if (!AppState.comparisonMode) {
        AppState.selectedForComparison = [];
        closeModal('comparisonModal');
        renderCurrentView();
        showNotification('Comparaison désactivée', 'info');
    } else {
        AppState.selectedForComparison = [];
        showNotification('Sélectionnez 2 jeux', 'info');
    }
}

function selectForComparison(game, el) {
    const idx = AppState.selectedForComparison.findIndex(g => g.name === game.name);
    if (idx !== -1) {
        AppState.selectedForComparison.splice(idx, 1);
        el.classList.remove('compare-selected');
    } else {
        if (AppState.selectedForComparison.length >= 2) { showNotification('Maximum 2 jeux', 'warning'); return; }
        AppState.selectedForComparison.push(game);
        el.classList.add('compare-selected');
    }
    if (AppState.selectedForComparison.length === 2) showComparisonModal();
}

function showComparisonModal() {
    const container = document.getElementById('comparisonContainer');
    container.innerHTML = '';
    AppState.selectedForComparison.forEach(g => {
        container.innerHTML += `
            <div class="comparison-game">
                <img src="${g.picture.startsWith('http') ? g.picture : 'pictures/' + g.picture}" alt="${g.name}">
                <div class="comparison-game-info">
                    <h3>${g.name}</h3>
                    <p class="meta"><i class="far fa-calendar-alt"></i> ${g.year} &nbsp; <i class="fas fa-trophy"></i> Tier ${g.rank}</p>
                    <p class="review">${g.review}</p>
                </div>
            </div>`;
    });
    openModal('comparisonModal');
}

// ===== MODALS =====
function openModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'flex'; }
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }

function showGameModal(game) {
    document.getElementById('modalImage').src = game.picture.startsWith('http') ? game.picture : 'pictures/' + game.picture;
    document.getElementById('modalTitle').innerText = game.name;
    document.getElementById('modalYear').innerHTML = `<i class="far fa-calendar-alt"></i> ${game.year}`;
    document.getElementById('modalTier').innerHTML = `<i class="fas fa-trophy"></i> Tier ${game.rank}`;
    document.getElementById('modalReview').innerText = game.review;
    AppState.currentEditingGame = game;
    updateFavoriteButton(game);
    updateAdminUI();
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
    if (!data.name || !data.year || !data.picture || !data.review) { showNotification('Remplissez tous les champs', 'error'); return; }
    if (AppState.currentEditingGame) {
        const idx = AppState.games.findIndex(g => g.name === AppState.currentEditingGame.name);
        if (idx !== -1) AppState.games[idx] = data;
    } else {
        if (AppState.games.some(g => g.name.toLowerCase() === data.name.toLowerCase())) { showNotification('Ce jeu existe déjà', 'error'); return; }
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

// ===== STORAGE =====
function saveToLocalStorage() { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ games: AppState.games })); }
function loadFromLocalStorage() { try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)); } catch { return null; } }

// ===== RANDOM =====
function showRandomGame() {
    if (!AppState.games.length) return;
    showGameModal(AppState.games[Math.floor(Math.random() * AppState.games.length)]);
}

// ===== EXPORT =====
function exportData() {
    const blob = new Blob([JSON.stringify({ games: AppState.games }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `goty-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showNotification('Export réussi', 'success');
}

// ===== TITLE TRIPLE CLICK =====
function setupTitleClickListener() {
    let clicks = 0, timer;
    document.getElementById('siteTitle').addEventListener('click', () => {
        clicks++;
        if (clicks === 3) { clicks = 0; clearTimeout(timer); openModal('loginModal'); }
        else { clearTimeout(timer); timer = setTimeout(() => clicks = 0, 500); }
    });
}

// ===== PANELS =====
function togglePanel(id) {
    const panel = document.getElementById(id);
    const isVisible = panel.style.display !== 'none';
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    panel.style.display = isVisible ? 'none' : 'block';
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.getElementById('filterBtn').addEventListener('click', () => togglePanel('filterPanel'));
    document.getElementById('statsBtn').addEventListener('click', () => togglePanel('statsPanel'));
    document.getElementById('closeFilterPanel')?.addEventListener('click', () => document.getElementById('filterPanel').style.display = 'none');
    document.getElementById('closeStatsPanel')?.addEventListener('click', () => document.getElementById('statsPanel').style.display = 'none');
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('randomGameBtn').addEventListener('click', showRandomGame);
    document.getElementById('compareBtn').addEventListener('click', toggleComparisonMode);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('favoritesBtn').addEventListener('click', toggleFavoritesFilter);
    document.getElementById('addGameBtn')?.addEventListener('click', openAddGameModal);
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    document.getElementById('logoutBtn')?.addEventListener('click', () => logout(false));

    // Instant search
    document.getElementById('searchInput')?.addEventListener('input', () => renderCurrentView());
    document.getElementById('yearFilter')?.addEventListener('change', () => renderCurrentView());
    document.getElementById('tierFilter')?.addEventListener('change', () => renderCurrentView());
    document.getElementById('sortBy')?.addEventListener('change', () => renderCurrentView());

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));

    // Modal closes
    document.getElementById('closeGameModal')?.addEventListener('click', () => closeModal('gameModal'));
    document.getElementById('closeComparison')?.addEventListener('click', () => { closeModal('comparisonModal'); AppState.selectedForComparison = []; renderCurrentView(); });
    document.getElementById('closeAddModal')?.addEventListener('click', () => closeModal('addGameModal'));
    document.getElementById('cancelAddGame')?.addEventListener('click', () => closeModal('addGameModal'));
    document.getElementById('closeLogin')?.addEventListener('click', () => closeModal('loginModal'));
    document.getElementById('toggleFavorite')?.addEventListener('click', toggleFavorite);
    document.getElementById('modalEditBtn')?.addEventListener('click', () => { closeModal('gameModal'); openEditGameModal(AppState.currentEditingGame); });
    document.getElementById('addGameForm')?.addEventListener('submit', handleGameFormSubmit);
    document.getElementById('deleteGameBtn')?.addEventListener('click', handleDeleteGame);
    document.getElementById('loginForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        try { await login(document.getElementById('loginPassword').value); }
        catch(err) { document.getElementById('loginError').innerText = err.message; }
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal.id); });
    });
}
