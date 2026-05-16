// ===== DRAG & DROP ADMIN (SortableJS) =====

let _sortableInstances = [];

// Active le drag & drop sur tous les tier-games containers
function enableDragDrop() {
    destroyDragDrop();

    const tierContainers = document.querySelectorAll('.tier-games');
    tierContainers.forEach(container => {
        const instance = Sortable.create(container, {
            group: 'games',          // même groupe = drag entre tiers possible
            animation: 200,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'drag-dragging',
            forceFallback: false,
            delay: 120,              // délai pour distinguer clic et drag
            delayOnTouchOnly: false,
            // Indicateur de position précis
            invertSwap: false,
            swapThreshold: 0.65,     // zone de swap plus large = plus intuitif
            emptyInsertThreshold: 20, // zone pour insérer dans un tier vide

            onStart() {
                document.body.classList.add('is-dragging');
                // Suspendre Lenis pendant le drag
                if (window.__lenis) window.__lenis.stop();
            },

            onEnd(evt) {
                document.body.classList.remove('is-dragging');
                if (window.__lenis) window.__lenis.start();

                // Reconstruire l'ordre complet depuis le DOM
                const newGames = buildGamesOrderFromDOM();
                AppState.games = newGames;

                // Sauvegarder sur GitHub via Railway
                saveOrderToGitHub(newGames);
            }
        });
        _sortableInstances.push(instance);
    });
}

// Désactiver et nettoyer les instances Sortable
function destroyDragDrop() {
    _sortableInstances.forEach(inst => inst.destroy());
    _sortableInstances = [];
}

// Reconstruire la liste des jeux dans le bon ordre depuis le DOM
function buildGamesOrderFromDOM() {
    const newGames = [];
    document.querySelectorAll('.tier-row').forEach(row => {
        const tier = row.querySelector('.tier-label span')?.textContent?.trim();
        if (!tier) return;
        row.querySelectorAll('.game-item').forEach((el, position) => {
            const name = el.dataset.name;
            const game = AppState.games.find(g => g.name === name);
            if (game) newGames.push({ ...game, rank: tier, position });
        });
    });
    // Ajouter les jeux absents du DOM (tiers vides)
    AppState.games.forEach(g => {
        if (!newGames.find(ng => ng.name === g.name)) newGames.push(g);
    });
    return newGames;
}

// Sauvegarder le nouvel ordre sur GitHub via Railway
async function saveOrderToGitHub(games) {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    // Indicateur visuel de sauvegarde
    showSaveIndicator('saving');

    try {
        const res = await fetch(`${AUTH_API}/api/games/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ games, token })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        AppState.games = data.games;
        showSaveIndicator('saved');
    } catch (err) {
        console.error('[DRAGDROP] Erreur sauvegarde:', err);
        showSaveIndicator('error');
        showNotification('Erreur sauvegarde ordre', 'error');
    }
}

// Indicateur visuel de sauvegarde en cours
function showSaveIndicator(state) {
    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        document.body.appendChild(indicator);
    }

    const states = {
        saving: { icon: 'fa-spinner fa-spin', text: 'Sauvegarde...', color: '#f59e0b' },
        saved:  { icon: 'fa-check-circle',    text: 'Sauvegardé',   color: '#10b981' },
        error:  { icon: 'fa-times-circle',    text: 'Erreur',       color: '#ef4444' }
    };

    const s = states[state];
    indicator.innerHTML = `<i class="fas ${s.icon}"></i> ${s.text}`;
    indicator.style.background = s.color;
    indicator.classList.add('visible');

    if (state !== 'saving') {
        setTimeout(() => indicator.classList.remove('visible'), 2500);
    }
}