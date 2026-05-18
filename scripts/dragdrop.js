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
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'drag-dragging',
            // forceFallback retiré : le drag natif est bien plus précis pour insérer entre deux éléments
            delay: 80,                  // légère attente pour ne pas déclencher par accident
            delayOnTouchOnly: true,     // délai uniquement sur mobile
            touchStartThreshold: 4,
            swapThreshold: 0.35,        // zone de swap plus petite → plus précis
            invertSwap: false,          // désactivé : sinon on ne peut pas insérer à gauche
            direction: 'horizontal',
            emptyInsertThreshold: 10,   // facilite le drop dans un tier vide

            onChoose(evt) {
                // Killer les transformations GSAP avant que SortableJS prenne la main
                gsap.killTweensOf(evt.item);
                gsap.set(evt.item, { clearProps: 'all' });
            },

            onStart(evt) {
                document.body.classList.add('is-dragging');
                if (window.__lenis) window.__lenis.stop();
                // Indiquer visuellement que le tier source est actif
                evt.from.classList.add('drag-source');
            },

            onMove(evt) {
                // Highlight du conteneur cible
                document.querySelectorAll('.tier-games').forEach(c => c.classList.remove('drag-over'));
                if (evt.to) evt.to.classList.add('drag-over');
            },

            onEnd(evt) {
                document.body.classList.remove('is-dragging');
                if (window.__lenis) window.__lenis.start();

                // Nettoyage des classes visuelles
                document.querySelectorAll('.tier-games').forEach(c => {
                    c.classList.remove('drag-over', 'drag-source');
                });

                // Petit flash de confirmation sur l'élément déposé
                gsap.fromTo(evt.item,
                    { outlineColor: 'rgba(201,168,76,0.9)', outlineWidth: '2px', outlineStyle: 'solid', outlineOffset: '2px' },
                    { outlineColor: 'rgba(201,168,76,0)', duration: 0.6, ease: 'power2.out', clearProps: 'outline,outlineColor,outlineWidth,outlineStyle,outlineOffset' }
                );

                // Flash du container de destination si changement de tier
                if (evt.from !== evt.to) {
                    gsap.fromTo(evt.to,
                        { backgroundColor: 'rgba(201,168,76,0.15)' },
                        { backgroundColor: 'transparent', duration: 0.5, clearProps: 'backgroundColor' }
                    );
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
// Retry automatique x2 en cas d'échec réseau (Railway en veille)
async function saveOrderToGitHub(games) {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    showSaveIndicator('saving');

    const MAX_RETRIES = 2;
    let lastErr;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(`${AUTH_API}/api/games/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ games, token })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'Erreur serveur');

            AppState.games = data.games;
            showSaveIndicator('saved');
            return; // succès

        } catch (err) {
            lastErr = err;
            const isNetworkError = err instanceof TypeError; // Failed to fetch
            if (isNetworkError && attempt < MAX_RETRIES) {
                // Railway peut être en train de démarrer (cold start ~3s) → on attend et on retente
                showSaveIndicator('saving');
                await new Promise(r => setTimeout(r, 3000));
                continue;
            }
            break;
        }
    }

    // Échec définitif
    console.error('[DRAGDROP] Erreur sauvegarde après retries:', lastErr);
    const isNetwork = lastErr instanceof TypeError;
    showSaveIndicator('error');
    showNotification(
        isNetwork
            ? 'Railway injoignable — ordre sauvegardé localement, relance dans 30s'
            : `Erreur: ${lastErr.message}`,
        'error'
    );

    // En cas d'erreur réseau : on planifie une dernière tentative silencieuse dans 30s
    if (lastErr instanceof TypeError) {
        setTimeout(async () => {
            try {
                const res = await fetch(`${AUTH_API}/api/games/reorder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ games, token: localStorage.getItem('adminToken') })
                });
                const data = await res.json();
                if (data.ok) {
                    AppState.games = data.games;
                    showNotification('Ordre synchronisé ✓', 'success');
                }
            } catch {
                // silencieux
            }
        }, 30000);
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