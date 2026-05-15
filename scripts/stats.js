// ===== STATISTIQUES =====
function updateStats() {
    const total = AppState.games.length;
    const latestYear = Math.max(...AppState.games.map(g => g.year), 0);
    const latestGame = AppState.games.find(g => g.year === latestYear);
    document.getElementById('totalGames').innerText = total;
    document.getElementById('latestYear').innerText = latestYear;
    document.getElementById('latestGame').innerText = latestGame ? latestGame.name : '—';
    renderCharts();
}

function renderCharts() {
    renderTierChart();
    renderYearChart();
}

function renderTierChart() {
    const container = document.getElementById('tierChart');
    if (!container) return;
    const counts = {};
    TIERS.forEach(t => counts[t] = 0);
    AppState.games.forEach(g => counts[g.rank]++);
    const total = AppState.games.length;
    container.innerHTML = '';
    TIERS.forEach(tier => {
        const pct = total ? Math.round((counts[tier] / total) * 100) : 0;
        container.innerHTML += `
            <div class="chart-bar-row">
                <span class="chart-bar-label" style="color:${TIER_COLORS[tier]}">${tier}</span>
                <div class="chart-bar-bg">
                    <div class="chart-bar" style="width:${pct}%;background:${TIER_COLORS[tier]}"></div>
                </div>
                <span class="chart-bar-value">${counts[tier]} (${pct}%)</span>
            </div>`;
    });
}

function renderYearChart() {
    const container = document.getElementById('yearChart');
    if (!container) return;
    const yearCounts = {};
    AppState.games.forEach(g => { yearCounts[g.year] = (yearCounts[g.year] || 0) + 1; });
    const years = Object.keys(yearCounts).sort();
    const maxCount = Math.max(...Object.values(yearCounts));
    container.innerHTML = '';
    years.forEach(y => {
        const pct = maxCount ? Math.round((yearCounts[y] / maxCount) * 100) : 0;
        container.innerHTML += `
            <div class="chart-bar-row">
                <span class="chart-bar-label">${y}</span>
                <div class="chart-bar-bg">
                    <div class="chart-bar" style="width:${pct}%;background:var(--text-primary)"></div>
                </div>
                <span class="chart-bar-value">${yearCounts[y]}</span>
            </div>`;
    });
}
