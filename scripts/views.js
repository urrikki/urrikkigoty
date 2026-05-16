// ===== UTILITAIRE IMAGE =====
function resolveImageSrc(picture) {
    if (picture && (picture.startsWith('data:image') || picture.startsWith('http'))) {
        return picture;
    }
    return 'pictures/' + (picture || 'placeholder.jpg');
}

const PLACEHOLDER_SVG = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23ddd"/></svg>';

// ===== VUE COURANTE =====
function switchView(view) {
    AppState.currentView = view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    document.getElementById('tierListView').style.display = view === 'tierlist' ? '' : 'none';
    document.getElementById('timelineView').style.display = view === 'timeline' ? '' : 'none';
    document.getElementById('galleryView').style.display = view === 'gallery' ? '' : 'none';
    renderCurrentView();
}

function renderCurrentView() {
    applyFiltersAndSort();
    if (AppState.currentView === 'tierlist') renderTierList();
    else if (AppState.currentView === 'timeline') renderTimeline();
    else if (AppState.currentView === 'gallery') renderGallery();
    updateGameCount();
    document.dispatchEvent(new CustomEvent('viewRendered'));
}

// ===== TIER LIST =====
function renderTierList() {
    const container = document.getElementById('tierList');
    container.innerHTML = '';
    TIERS.forEach(tier => {
        const row = document.createElement('div');
        row.className = 'tier-row';
        row.innerHTML = `
            <div class="tier-label" style="--tier-color: var(--tier-${tier.toLowerCase()})">
                <span>${tier}</span>
            </div>
            <div class="tier-games" id="tier-${tier.toLowerCase()}"></div>`;
        container.appendChild(row);
    });
    AppState.filteredGames.forEach((game, i) => {
        const el = createGameElement(game, i);
        const target = document.getElementById(`tier-${game.rank.toLowerCase()}`);
        if (target) target.appendChild(el);
    });
}

function createGameElement(game, index = 0) {
    const div = document.createElement('div');
    div.className = 'game-item';
    if (AppState.selectedForComparison.some(g => g.name === game.name)) div.classList.add('compare-selected');
    div.style.animationDelay = `${index * 0.03}s`;

    const img = document.createElement('img');
    img.src = resolveImageSrc(game.picture);
    img.alt = game.name;
    img.loading = 'lazy';
    img.onerror = () => img.src = PLACEHOLDER_SVG;
    div.appendChild(img);

    div.addEventListener('click', () => {
        if (AppState.comparisonMode) selectForComparison(game, div);
        else showGameModal(game);
    });
    return div;
}

// ===== TIMELINE =====
function renderTimeline() {
    const container = document.getElementById('timelineView');
    container.innerHTML = '';
    const byYear = new Map();
    AppState.filteredGames.forEach(g => {
        if (!byYear.has(g.year)) byYear.set(g.year, []);
        byYear.get(g.year).push(g);
    });
    const sorted = [...byYear.entries()].sort((a, b) => b[0] - a[0]);
    sorted.forEach(([year, games], yi) => {
        const section = document.createElement('div');
        section.className = 'timeline-year';
        section.style.animationDelay = `${yi * 0.08}s`;
        games.sort((a, b) => TIERS.indexOf(a.rank) - TIERS.indexOf(b.rank));
        section.innerHTML = `
            <div class="timeline-marker">${year}</div>
            <div class="timeline-connector"></div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <span>${games.length} jeu${games.length > 1 ? 'x' : ''}</span>
                </div>
                <div class="timeline-games" id="timeline-${year}"></div>
            </div>`;
        container.appendChild(section);
        const gamesContainer = section.querySelector('.timeline-games');
        games.forEach((game, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'timeline-game-wrapper';
            wrapper.appendChild(createGameElement(game, i));
            const tag = document.createElement('span');
            tag.className = 'tier-tag';
            tag.textContent = game.rank;
            wrapper.appendChild(tag);
            gamesContainer.appendChild(wrapper);
        });
    });
}

// ===== GALERIE =====
function renderGallery() {
    const container = document.getElementById('galleryView');
    container.innerHTML = '';
    AppState.filteredGames.forEach((game, i) => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.style.animationDelay = `${i * 0.04}s`;
        const imgSrc = resolveImageSrc(game.picture);
        card.innerHTML = `
            <div class="gallery-card-img">
                <img src="${imgSrc}" alt="${game.name}" loading="lazy">
            </div>
            <div class="gallery-card-info">
                <h3>${game.name}</h3>
                <div class="gallery-card-meta">
                    <span><i class="far fa-calendar-alt"></i> ${game.year}</span>
                    <span><i class="fas fa-trophy"></i> ${game.rank}</span>
                </div>
            </div>`;
        card.addEventListener('click', () => showGameModal(game));
        container.appendChild(card);
    });
}