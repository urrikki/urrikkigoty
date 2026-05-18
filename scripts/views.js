function resolveImageSrc(picture) {
    if (!picture) return PLACEHOLDER_SVG;
    if (picture.startsWith('data:') || picture.startsWith('http')) return picture;
    return 'pictures/' + picture;
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
async function renderTierList() {
    destroyDragDrop();
    const container = document.getElementById('tierList');
    
    // 1. Construire la structure des tiers (labels + conteneurs vides)
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

    // 2. Remplir chaque tier avec les jeux dans l'ORDRE D'AJOUT (pas trié par position)
    //    -> on utilise l'ordre de AppState.filteredGames (qui respecte l'ordre original)
    const groupedByRank = {};
    AppState.filteredGames.forEach(game => {
        if (!groupedByRank[game.rank]) groupedByRank[game.rank] = [];
        groupedByRank[game.rank].push(game);
    });

    for (const tier of TIERS) {
        const games = groupedByRank[tier] || [];
        // Ordre actuel = ordre du tableau (ordre d'ajout)
        const tierContainer = document.getElementById(`tier-${tier.toLowerCase()}`);
        games.forEach((game, idx) => {
            const el = createGameElement(game, idx);
            tierContainer.appendChild(el);
        });
    }

    // 3. Capturer les positions actuelles (FLIP: First)
    const items = document.querySelectorAll('.game-item');
    const firstRects = Array.from(items).map(el => el.getBoundingClientRect());

    // 4. Réorganiser le DOM selon l'ordre des positions (trier par game.position)
    for (const tier of TIERS) {
        const games = groupedByRank[tier] || [];
        // Trier selon game.position (valeurs numériques)
        games.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const tierContainer = document.getElementById(`tier-${tier.toLowerCase()}`);
        // Vider le conteneur et réinjecter dans le nouvel ordre
        tierContainer.innerHTML = '';
        games.forEach((game, idx) => {
            // On récupère l'élément existant (grâce à son data-name)
            const existingEl = Array.from(document.querySelectorAll('.game-item')).find(
                el => el.dataset.name === game.name
            );
            if (existingEl) {
                tierContainer.appendChild(existingEl);
            } else {
                // Sécurité : recréer l'élément
                const newEl = createGameElement(game, idx);
                tierContainer.appendChild(newEl);
            }
        });
    }

    // 5. Capturer les positions finales (Last)
    const lastRects = Array.from(document.querySelectorAll('.game-item')).map(el => el.getBoundingClientRect());

    // 6. Animer (Invert & Play)
    items.forEach((el, i) => {
        const first = firstRects[i];
        const last = lastRects[i];
        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
            gsap.fromTo(el, 
                { x: deltaX, y: deltaY, opacity: 1 },
                { x: 0, y: 0, duration: 0.6, ease: 'back.out(0.6)' }
            );
        }
    });

    // Réactiver drag & drop si admin
    if (AppState.isAdminMode && typeof enableDragDrop === 'function') {
        enableDragDrop();
    }
}
function createGameElement(game, index = 0) {
    const div = document.createElement('div');
    div.className = 'game-item';
    div.dataset.name = game.name;
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