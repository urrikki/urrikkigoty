// ===== SKELETON LOADER =====
function showSkeletonLoader() {
    const container = document.getElementById('tierList');
    if (!container) return;
    container.innerHTML = '';

    // Nombre de faux jeux par tier (visuellement crédible)
    const fakeCounts = { S: 3, A: 5, B: 6, C: 4, D: 3, E: 2, F: 2, NP: 1 };

    TIERS.forEach(tier => {
        const row = document.createElement('div');
        row.className = 'skeleton-row';

        const label = document.createElement('div');
        label.className = 'skeleton-label skeleton';
        row.appendChild(label);

        const games = document.createElement('div');
        games.className = 'skeleton-games';
        const count = fakeCounts[tier] || 3;
        for (let i = 0; i < count; i++) {
            const item = document.createElement('div');
            item.className = 'skeleton-game skeleton';
            games.appendChild(item);
        }
        row.appendChild(games);
        container.appendChild(row);
    });
}

function hideSkeletonLoader() {
    // Le renderTierList() écrase le contenu — rien à faire,
    // mais on peut forcer un wrapper visible proprement
    const container = document.getElementById('tierList');
    if (container) container.innerHTML = '';
}

// ===== PERSISTANCE =====
function saveToLocalStorage() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ games: AppState.games }));
}

function loadFromLocalStorage() {
    try {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY));
    } catch {
        return null;
    }
}

async function loadGames() {
    try {
        const res = await fetch(`${AUTH_API}/api/games`);
        const data = await res.json();
        if (data.ok && Array.isArray(data.games)) {
            AppState.games = data.games;
            return;
        }
        console.warn('[STORAGE] API renvoyé ok=false, fallback sur games.json', data.error);
    } catch (err) {
        console.warn('[STORAGE] Railway injoignable, fallback sur games.json', err);
    }
    const res = await fetch(DATA_PATH + '?v=' + Date.now());
    const data = await res.json();
    AppState.games = data.games || [];
    console.log(`[STORAGE] Chargé ${AppState.games.length} jeux depuis fallback local`);
}

// ===== EXPORT JSON =====
function exportData() {
    const blob = new Blob([JSON.stringify({ games: AppState.games }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `goty-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showNotification('Export réussi', 'success');
}