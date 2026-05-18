// ===== DRAG & DROP ADMIN (SortableJS) avec animations =====

let _sortableInstances = [];

// Active le drag & drop sur tous les tier-games containers
function enableDragDrop() {
    destroyDragDrop();

    const tierContainers = document.querySelectorAll('.tier-games');
    tierContainers.forEach(container => {
        const instance = Sortable.create(container, {
            group: 'games',
            animation: 300,               // augmenté pour la fluidité
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'drag-dragging',
            forceFallback: false,
            delay: 120,
            delayOnTouchOnly: false,
            swapThreshold: 0.65,
            emptyInsertThreshold: 20,

            onStart(evt) {
                document.body.classList.add('is-dragging');
                if (window.__lenis) window.__lenis.stop();
                // Optionnel : ajouter une classe pour l'élément en cours
                evt.item.style.transition = 'none';
            },

            onEnd(evt) {
                document.body.classList.remove('is-dragging');
                if (window.__lenis) window.__lenis.start();

                // 1. Animation sur l'élément déplacé (retombée élastique)
                gsap.fromTo(evt.item, 
                    { scale: 1.1, borderColor: '#C9A84C', boxShadow: '0 0 0 3px gold' },
                    { scale: 1, borderColor: 'var(--border)', boxShadow: 'none', duration: 0.4, ease: 'back.out(1.2)', clearProps: 'transform,boxShadow' }
                );

                // 2. Animation sur les voisins directs (effet de "poussée")
                const parent = evt.item.parentNode;
                if (parent) {
                    const siblings = Array.from(parent.children).filter(child => child !== evt.item);
                    siblings.forEach(sib => {
                        gsap.fromTo(sib, 
                            { scale: 1.02 },
                            { scale: 1, duration: 0.2, yoyo: true, repeat: 1, ease: 'power1.out' }
                        );
                    });
                }

                // 3. Si changement de tier, ajouter un effet lumineux sur l'ancien et nouveau conteneur
                const oldContainer = evt.from;
                const newContainer = evt.to;
                if (oldContainer !== newContainer) {
                    [oldContainer, newContainer].forEach(container => {
                        if (container) {
                            gsap.fromTo(container, 
                                { backgroundColor: 'rgba(201,168,76,0.2)' },
                                { backgroundColor: 'transparent', duration: 0.5, clearProps: 'backgroundColor' }
                            );
                        }
                    });
                }

                // 4. Reconstruire l'ordre complet depuis le DOM
                const newGames = buildGamesOrderFromDOM();
                AppState.games = newGames;

                // 5. Sauvegarder sur GitHub via Railway
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

// Reconstruire la liste des jeux dans le bon ordre depuis le DOM (avec position renumérotée)
function buildGamesOrderFromDOM() {
    const newGames = [];
    document.querySelectorAll('.tier-row').forEach(row => {
        const tier = row.querySelector('.tier-label span')?.textContent?.trim();
        if (!tier) return;
        let pos = 0;
        row.querySelectorAll('.game-item').forEach(el => {
            const name = el.dataset.name;
            const originalGame = AppState.games.find(g => g.name === name);
            if (originalGame) {
                const updated = { ...originalGame, rank: tier, position: pos++ };
                newGames.push(updated);
            }
        });
    });
    // Ajouter les jeux absents du DOM (sécurité)
    AppState.games.forEach(g => {
        if (!newGames.find(ng => ng.name === g.name)) {
            newGames.push(g);
        }
    });
    return newGames;
}

// Sauvegarder le nouvel ordre sur GitHub via Railway
async function saveOrderToGitHub(games) {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

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

// Indicateur visuel de sauvegarde en cours (déjà existant)
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