const CONFIG =
{
    PASSWORD_HASH: "2348f998744212575d85959674f9607ab26f67708a917157472832386337c904",
    DATA_PATH: "data/games.json"
};

const AppState =
{
    games: [],
    filteredGames: [],
    isAdmin: false
};

document.addEventListener("DOMContentLoaded", async () =>
{
    await loadGames();
    buildTierList();
    populateYearFilter();
    updateStats();
    createParticles();
    setupEvents();
});

async function loadGames()
{
    const saved = localStorage.getItem("gotyGames");
    if (saved)
    {
        AppState.games = JSON.parse(saved).games;
    }
    else
    {
        const res = await fetch(CONFIG.DATA_PATH);
        AppState.games = (await res.json()).games;
    }
    AppState.filteredGames = [...AppState.games];
}

function buildTierList()
{
    const tiers = ["S","A","B","C","D","E","F","NP"];
    const list = document.getElementById("tierList");
    list.innerHTML = "";

    tiers.forEach(t =>
    {
        const row = document.createElement("div");
        row.className = "tier-row";

        const label = document.createElement("div");
        label.className = "tier-label";
        label.textContent = t;

        const games = document.createElement("div");
        games.className = "tier-games";
        games.id = `tier-${t}`;

        row.append(label, games);
        list.appendChild(row);
    });

    populateGames();
}

function populateGames()
{
    document.querySelectorAll(".tier-games").forEach(c => c.innerHTML = "");

    AppState.filteredGames.forEach(g =>
    {
        const item = document.createElement("div");
        item.className = "game-item";

        const img = document.createElement("img");
        img.src = `pictures/${g.picture}`;
        img.title = `${g.name} (${g.year})`;

        item.appendChild(img);
        document.getElementById(`tier-${g.rank}`).appendChild(item);
    });
}

function populateYearFilter()
{
    const years = [...new Set(AppState.games.map(g => g.year))].sort((a,b)=>b-a);
    const select = document.getElementById("yearFilter");
    years.forEach(y =>
    {
        const o = document.createElement("option");
        o.value = y;
        o.textContent = y;
        select.appendChild(o);
    });
}

function updateStats()
{
    document.getElementById("totalGames").textContent = AppState.games.length;
}

function setupEvents()
{
    document.getElementById("filterBtn").onclick = () => toggle("filterPanel");
    document.getElementById("statsBtn").onclick = () => toggle("statsPanel");

    document.getElementById("applyFilters").onclick = applyFilters;
    document.getElementById("resetFilters").onclick = resetFilters;

    document.getElementById("mainTitle").onclick = adminLogin;
}

function toggle(id)
{
    const el = document.getElementById(id);
    el.style.display = el.style.display === "none" ? "flex" : "none";
}

function applyFilters()
{
    const s = searchInput.value.toLowerCase();
    const y = yearFilter.value;
    const t = tierFilter.value;

    AppState.filteredGames = AppState.games.filter(g =>
        (!s || g.name.toLowerCase().includes(s)) &&
        (!y || g.year == y) &&
        (!t || g.rank == t)
    );

    buildTierList();
}

function resetFilters()
{
    searchInput.value = "";
    yearFilter.value = "";
    tierFilter.value = "";
    AppState.filteredGames = [...AppState.games];
    buildTierList();
}

async function adminLogin()
{
    const pwd = prompt("Mot de passe admin");
    if (!pwd) return;

    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pwd));
    const hex = [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");

    if (hex === CONFIG.PASSWORD_HASH)
    {
        adminBadge.style.display = "block";
        adminControls.style.display = "flex";
    }
}

function createParticles()
{
    const c = document.getElementById("particles");
    for (let i=0;i<60;i++)
    {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.left = Math.random()*100+"%";
        p.style.animationDuration = 10+Math.random()*20+"s";
        c.appendChild(p);
    }
}
