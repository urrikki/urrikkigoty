// ===== DRAG & DROP ADMIN (SortableJS) avec animations =====

let _sortableInstances = [];

function enableDragDrop() {
    if (typeof Sortable === 'undefined') return console.error('SortableJS manquant');
    destroyDragDrop();

    const containers = document.querySelectorAll('.tier-games');
    if (!containers.length) return console.warn('Aucun .tier-games');

    containers.forEach(container => {
        const instance = Sortable.create(container, {
            group: 'games',
            animation: 200,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'drag-dragging',
            forceFallback: true,          // ← CRUCIAL : force le mode fallback
            fallbackClass: 'sortable-fallback',
            fallbackOnBody: false,
            delay: 0,
            touchStartThreshold: 2,
            swapThreshold: 0.5,           // ← 0.5 = insérer quand la souris dépasse la moitié de l'élément voisin
            invertSwap: true,             // ← permet l'insertion entre les éléments
            direction: 'horizontal',      // ← important pour flex-wrap
            onStart(evt) {
                document.body.classList.add('is-dragging');
                window.__lenis?.stop();
                gsap.set(evt.item, { clearProps: "transform,transition" });
            },
            onEnd(evt) {
                document.body.classList.remove('is-dragging');
                window.__lenis?.start();
                gsap.fromTo(evt.item,
                    { scale: 1.02, borderColor: '#C9A84C', boxShadow: '0 0 0 2px gold' },
                    { scale: 1, borderColor: 'var(--border)', boxShadow: 'none', duration: 0.25, ease: 'back.out(1.2)', clearProps: 'transform,boxShadow' }
                );
                const parent = evt.item.parentNode;
                if (parent) {
                    Array.from(parent.children).forEach(sib => {
                    if (sib !== evt.item) {
                        gsap.fromTo(sib, { scale: 1.01 }, { scale: 1, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.out' });
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