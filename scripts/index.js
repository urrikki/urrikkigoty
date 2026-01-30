const AppState =
{
    games: [],
    isAdminMode: false,
    currentEditingGame: null
};

const CONFIG =
{
    ADMIN_KEY_SEQUENCE: ['a','d','m','i','n'],
    keySequence: [],
    STORAGE_KEY: 'gotyGamesData'
};

const SECURITY =
{
    ADMIN_HASH: "2348f998744212575d85959674f9607ab26f67708a917157472832386337c904"
};

document.addEventListener('DOMContentLoaded', () =>
{
    initializeApp();
    setupAdminKeyListener();
    createParticles();
});

async function initializeApp()
{
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved)
    {
        AppState.games = JSON.parse(saved).games;
    }
    else
    {
        const res = await fetch('data/games.json');
        AppState.games = (await res.json()).games;
    }
    initializeTierList();
}

function save()
{
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ games: AppState.games }));
}

function setupAdminKeyListener()
{
    document.addEventListener('keydown', async e =>
    {
        CONFIG.keySequence.push(e.key.toLowerCase());
        CONFIG.keySequence = CONFIG.keySequence.slice(-5);

        if (CONFIG.keySequence.join('') === 'admin')
        {
            const pwd = prompt("Mot de passe admin");
            if (!pwd) return;

            const hash = await sha256(pwd);
            if (hash === SECURITY.ADMIN_HASH)
            {
                AppState.isAdminMode = !AppState.isAdminMode;
                updateAdminUI();
            }
            else
            {
                alert("Mot de passe incorrect");
            }
            CONFIG.keySequence = [];
        }
    });
}

function updateAdminUI()
{
    adminBadge.style.display = AppState.isAdminMode ? 'block' : 'none';
    adminControls.style.display = AppState.isAdminMode ? 'flex' : 'none';
}

function initializeTierList()
{
    const tiers = ['S','A','B','C','D','E','F','NP'];
    tierList.innerHTML = '';

    tiers.forEach(t =>
    {
        const row = document.createElement('div');
        row.className = 'tier-row';

        const label = document.createElement('div');
        label.textContent = t;

        const games = document.createElement('div');
        games.className = 'tier-games';
        games.id = `tier-${t.toLowerCase()}`;

        row.append(label, games);
        tierList.appendChild(row);
    });

    refresh();
}

function refresh()
{
    document.querySelectorAll('.tier-games').forEach(c => c.innerHTML = '');
    AppState.games.forEach(g =>
    {
        const el = document.createElement('div');
        el.className = 'game-item';

        const img = document.createElement('img');
        img.src = `pictures/${g.picture}`;
        el.appendChild(img);

        document.getElementById(`tier-${g.rank.toLowerCase()}`).appendChild(el);
    });
}

async function sha256(text)
{
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

function createParticles()
{
    const container = document.getElementById("particles");
    for (let i = 0; i < 60; i++)
    {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.left = Math.random() * 100 + "%";
        p.style.animationDuration = 10 + Math.random() * 20 + "s";
        container.appendChild(p);
    }
}
