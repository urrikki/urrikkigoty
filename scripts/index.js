const AppState =
{
    games: [],
    isAdminMode: false
};

const CONFIG =
{
    STORAGE_KEY: "gotyGamesData"
};

const SECURITY =
{
    ADMIN_HASH: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"
};

document.addEventListener("DOMContentLoaded", () =>
{
    loadGames();
    buildTierList();
    createParticles();
    setupAdminLogin();
});

async function loadGames()
{
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);

    if (saved)
    {
        AppState.games = JSON.parse(saved).games;
    }
    else
    {
        const res = await fetch("data/games.json");
        AppState.games = (await res.json()).games;
    }
}

function buildTierList()
{
    const tiers = ["S","A","B","C","D","E","F","NP"];
    const tierList = document.getElementById("tierList");
    tierList.innerHTML = "";

    tiers.forEach(tier =>
    {
        const row = document.createElement("div");
        row.className = "tier-row";

        const label = document.createElement("div");
        label.className = "tier-label";
        label.textContent = tier;

        const games = document.createElement("div");
        games.className = "tier-games";
        games.id = `tier-${tier.toLowerCase()}`;

        row.append(label, games);
        tierList.appendChild(row);
    });

    populateGames();
}

function populateGames()
{
    AppState.games.forEach(game =>
    {
        const item = document.createElement("div");
        item.className = "game-item";

        const img = document.createElement("img");
        img.src = `pictures/${game.picture}`;
        img.alt = game.name;

        item.appendChild(img);
        document.getElementById(`tier-${game.rank.toLowerCase()}`).appendChild(item);
    });
}

function setupAdminLogin()
{
    document.addEventListener("keydown", async e =>
    {
        if (e.key.toLowerCase() === "a")
        {
            const pwd = prompt("Mot de passe admin");
            if (!pwd) return;

            const hash = await sha256(pwd);
            if (hash === SECURITY.ADMIN_HASH)
            {
                document.getElementById("adminBadge").style.display = "block";
                document.getElementById("adminControls").style.display = "flex";
            }
        }
    });
}

async function sha256(text)
{
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2,"0"))
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
