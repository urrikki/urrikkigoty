// ===== POINT D'ENTRÉE =====
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initPremium === 'function') initPremium();
    if (typeof initAnimations === 'function') initAnimations();
    initializeApp();
    setupEventListeners();
    checkSavedAuth();
    setupTitleClickListener();
    initTheme();
    initScrollToTop();
});

async function initializeApp() {
    try {
        showSkeletonLoader();

        // ── Signaler la progression au loader ──
        if (window.LoaderAPI) window.LoaderAPI.setProgress(30);

        await loadGames();

        if (window.LoaderAPI) window.LoaderAPI.setProgress(80);

        if (AppState.games.length === 0) {
            showNotification('Aucun jeu chargé – vérifiez la console', 'error');
        }

        AppState.filteredGames = [...AppState.games];
        renderCurrentView();
        updateStats();
        populateYearFilter();
        updateGameCount();

        if (window.LoaderAPI) window.LoaderAPI.setProgress(100);

        // ── Fermer le loader proprement, puis lancer les animations d'entrée ──
        if (window.LoaderAPI) {
            window.LoaderAPI.finish(() => {
                // Callback après disparition du rideau
                showNotification('Tier List chargée', 'success');
                if (typeof initEditorialTitle === 'function') initEditorialTitle();
            });
        } else {
            // Fallback si le loader n'est pas présent
            document.querySelector('.app-wrapper').style.opacity = '1';
            showNotification('Tier List chargée', 'success');
            if (typeof initEditorialTitle === 'function') initEditorialTitle();
        }

    } catch (err) {
        console.error(err);
        // En cas d'erreur, on ferme quand même le loader
        if (window.LoaderAPI) {
            window.LoaderAPI.finish();
        } else {
            const app = document.querySelector('.app-wrapper');
            if (app) app.style.opacity = '1';
        }
        showNotification('Erreur de chargement', 'error');
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Header
    document.getElementById('filterBtn').addEventListener('click', () => togglePanel('filterPanel'));
    document.getElementById('statsBtn').addEventListener('click', () => togglePanel('statsPanel'));
    document.getElementById('closeFilterPanel')?.addEventListener('click', () => document.getElementById('filterPanel').style.display = 'none');
    document.getElementById('closeStatsPanel')?.addEventListener('click', () => document.getElementById('statsPanel').style.display = 'none');
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('randomGameBtn').addEventListener('click', showRandomGame);
    document.getElementById('compareBtn').addEventListener('click', toggleComparisonMode);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('favoritesBtn').addEventListener('click', toggleFavoritesFilter);

    // Admin
    document.getElementById('addGameBtn')?.addEventListener('click', openAddGameModal);
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    document.getElementById('logoutBtn')?.addEventListener('click', () => logout(false));

    // Filtres (temps réel)
    document.getElementById('searchInput')?.addEventListener('input', () => renderCurrentView());
    document.getElementById('yearFilter')?.addEventListener('change', () => renderCurrentView());
    document.getElementById('tierFilter')?.addEventListener('change', () => renderCurrentView());
    document.getElementById('sortBy')?.addEventListener('change', () => renderCurrentView());

    // Vues
    document.querySelectorAll('.view-btn').forEach(btn =>
        btn.addEventListener('click', () => switchView(btn.dataset.view))
    );

    // Modales
    document.getElementById('closeGameModal')?.addEventListener('click', () => closeModal('gameModal'));
    document.getElementById('closeComparison')?.addEventListener('click', () => {
        closeModal('comparisonModal');
        AppState.selectedForComparison = [];
        renderCurrentView();
    });
    document.getElementById('closeAddModal')?.addEventListener('click', () => closeModal('addGameModal'));
    document.getElementById('cancelAddGame')?.addEventListener('click', () => closeModal('addGameModal'));
    document.getElementById('closeLogin')?.addEventListener('click', () => closeModal('loginModal'));
    document.getElementById('toggleFavorite')?.addEventListener('click', toggleFavorite);
    document.getElementById('modalEditBtn')?.addEventListener('click', () => {
        closeModal('gameModal');
        openEditGameModal(AppState.currentEditingGame);
    });

    // Formulaire admin
    document.getElementById('addGameForm')?.addEventListener('submit', handleGameFormSubmit);
    document.getElementById('deleteGameBtn')?.addEventListener('click', handleDeleteGame);
    document.getElementById('loginForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        try {
            await login(document.getElementById('loginPassword').value);
        } catch (err) {
            document.getElementById('loginError').innerText = err.message;
        }
    });

    // Upload image
    document.getElementById('gamePictureFile')?.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            document.getElementById('gamePicture').value = ev.target.result;
            showNotification('Image chargée (Base64)', 'success');
        };
        reader.readAsDataURL(file);
    });

    // Fermer modales au clic fond
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal.id); });
    });

    // Raccourcis clavier
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'flex') closeModal(modal.id);
            });
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            const filterPanel = document.getElementById('filterPanel');
            const isOpen = filterPanel.style.display !== 'none';
            if (!isOpen) togglePanel('filterPanel');
            e.preventDefault();
            setTimeout(() => document.getElementById('searchInput')?.focus(), 50);
        }
    });
}

// ===== JEU ALÉATOIRE =====
function showRandomGame() {
    if (!AppState.games.length) return;
    showGameModal(AppState.games[Math.floor(Math.random() * AppState.games.length)]);
}