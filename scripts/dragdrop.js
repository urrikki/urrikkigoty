// ===== DRAG & DROP ADMIN (SortableJS) avec animations =====

let _sortableInstances = [];

// Active le drag & drop sur tous les tier-games containers
function enableDragDrop() {
    if (typeof Sortable === 'undefined') {
        console.error('❌ SortableJS non chargé');
        return;
    }
    destroyDragDrop();

    const tierContainers = document.querySelectorAll('.tier-games');
    if (!tierContainers.length) {
        console.warn('⚠️ Aucun conteneur .tier-games trouvé');
        return;
    }

    console.log('✅ Drag & drop activé sur', tierContainers.length, 'conteneurs');

    tierContainers.forEach(container => {
        const instance = Sortable.create(container, {
            group: 'games',
            animation: 200,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'drag-dragging',
            forceFallback: true,      // essentiel pour éviter les conflits avec les transformations
            delay: 0,
            touchStartThreshold: 2,
            swapThreshold: 0.5,
            invertSwap: true,
            direction: 'horizontal',
            
            onStart(evt) {
                document.body.classList.add('is-dragging');
                if (window.__lenis) window.__lenis.stop();
                // Supprimer toutes les transformations GSAP en cours
                gsap.set(evt.item, { clearProps: "transform,transition" });
                evt.item.style.transition = 'none';
            },

            onEnd(evt) {
                document.body.classList.remove('is-dragging');
                if (window.__lenis) window.__lenis.start();

                // Animation de retour (optionnelle)
                gsap.fromTo(evt.item, 
                    { scale: 1.1, borderColor: '#C9A84C', boxShadow: '0 0 0 3px gold' },
                    { scale: 1, borderColor: 'var(--border)', boxShadow: 'none', duration: 0.4, ease: 'back.out(1.2)', clearProps: 'transform,boxShadow' }
                );

                // Animation des voisins
                const parent = evt.item.parentNode;
                if (parent) {
                    Array.from(parent.children).filter(child => child !== evt.item).forEach(sib => {
                        gsap.fromTo(sib, { scale: 1.02 }, { scale: 1, duration: 0.2, yoyo: true, repeat: 1, ease: 'power1.out' });
                    });
                }

                // Animation changement de tier
                if (evt.from !== evt.to) {
                    [evt.from, evt.to].forEach(container => {
                        if (container) {
                            gsap.fromTo(container, 
                                { backgroundColor: 'rgba(201,168,76,0.2)' },
                                { backgroundColor: 'transparent', duration: 0.5, clearProps: 'backgroundColor' }
                            );
                        }
                    });
                }

                const newGames = buildGamesOrderFromDOM();
                AppState.games = newGames;
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