// ===== MODALS =====
function openModal(id) {
    const m = document.getElementById(id);
    if (m) {
        m.style.display = 'flex';
        if (typeof animateModalOpen === 'function') animateModalOpen(id);
    }
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    if (typeof animateModalClose === 'function') {
        animateModalClose(id, () => m.style.display = 'none');
    } else {
        m.style.display = 'none';
    }
}

// ===== MODALE JEU =====
function showGameModal(game) {
    const imgSrc = resolveImageSrc(game.picture);
    document.getElementById('modalImage').src = imgSrc;
    document.getElementById('modalTitle').innerText = game.name;
    document.getElementById('modalYear').innerHTML = `<i class="far fa-calendar-alt"></i> ${game.year}`;
    document.getElementById('modalTier').innerHTML = `<i class="fas fa-trophy"></i> Tier ${game.rank}`;
    document.getElementById('modalReview').innerText = game.review;
    AppState.currentEditingGame = game;
    updateFavoriteButton(game);
    updateAdminUI();
    openModal('gameModal');
}

// ===== MODALE COMPARAISON =====
function toggleComparisonMode() {
    AppState.comparisonMode = !AppState.comparisonMode;
    const btn = document.getElementById('compareBtn');
    btn.classList.toggle('active', AppState.comparisonMode);
    document.body.classList.toggle('compare-mode', AppState.comparisonMode);
    if (!AppState.comparisonMode) {
        AppState.selectedForComparison = [];
        closeModal('comparisonModal');
        renderCurrentView();
        showNotification('Comparaison désactivée', 'info');
    } else {
        AppState.selectedForComparison = [];
        showNotification('Sélectionnez 2 jeux', 'info');
    }
}

function selectForComparison(game, el) {
    const idx = AppState.selectedForComparison.findIndex(g => g.name === game.name);
    if (idx !== -1) {
        AppState.selectedForComparison.splice(idx, 1);
        el.classList.remove('compare-selected');
    } else {
        if (AppState.selectedForComparison.length >= 2) {
            showNotification('Maximum 2 jeux', 'warning');
            return;
        }
        AppState.selectedForComparison.push(game);
        el.classList.add('compare-selected');
    }
    if (AppState.selectedForComparison.length === 2) showComparisonModal();
}

function showComparisonModal() {
    const container = document.getElementById('comparisonContainer');
    container.innerHTML = '';
    AppState.selectedForComparison.forEach(g => {
        const imgSrc = resolveImageSrc(g.picture);
        container.innerHTML += `
            <div class="comparison-game">
                <img src="${imgSrc}" alt="${g.name}">
                <div class="comparison-game-info">
                    <h3>${g.name}</h3>
                    <p class="meta"><i class="far fa-calendar-alt"></i> ${g.year} &nbsp; <i class="fas fa-trophy"></i> Tier ${g.rank}</p>
                    <p class="review">${g.review}</p>
                </div>
            </div>`;
    });
    openModal('comparisonModal');
}