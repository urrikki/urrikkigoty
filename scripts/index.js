document.addEventListener('DOMContentLoaded', function() {
    fetch('data/games.json')
        .then(response => response.json())
        .then(data => {
            initializeTierList(data.games);
        })
        .catch(error => {
            console.error('Error loading game data:', error);
        });

    const modal = document.getElementById('gameModal');
    const closeModal = document.querySelector('.close-modal');
    
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

function initializeTierList(games) {
    const tierList = document.querySelector('.tier-list');
    const tiers = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'NP'];
    
    tiers.forEach(tier => {
        const tierRow = document.createElement('div');
        tierRow.className = `tier-row`;
        
        const tierLabel = document.createElement('div');
        tierLabel.className = `tier-label tier-${tier.toLowerCase().replace(' ', '-')}`;
        tierLabel.textContent = tier;
        
        const tierGames = document.createElement('div');
        tierGames.className = 'tier-games';
        tierGames.id = `tier-${tier.toLowerCase().replace(' ', '-')}`;
        
        tierRow.appendChild(tierLabel);
        tierRow.appendChild(tierGames);
        tierList.appendChild(tierRow);
    });
    
    games.forEach(game => {
        const gameElement = createGameElement(game);
        const tierContainer = document.getElementById(`tier-${game.rank.toLowerCase().replace(' ', '-')}`);
        
        if (tierContainer) {
            tierContainer.appendChild(gameElement);
        } else {
            console.warn(`Tier container for rank ${game.rank} not found`);
        }
    });
}

function createGameElement(game) {
    const gameItem = document.createElement('div');
    gameItem.className = 'game-item';
    gameItem.dataset.game = JSON.stringify(game);
    
    const gameImage = document.createElement('img');
    gameImage.src = `pictures/${game.picture}`;
    gameImage.alt = game.name;
    
    gameItem.appendChild(gameImage);
    
    gameItem.addEventListener('click', function() {
        showGameModal(game);
    });
    
    return gameItem;
}

function showGameModal(game) {
    const modal = document.getElementById('gameModal');
    const modalImage = document.querySelector('.modal-image');
    const modalTitle = document.querySelector('.modal-title');
    const modalYear = document.querySelector('.modal-year');
    const modalReview = document.querySelector('.modal-review');
    
    modalImage.src = `pictures/${game.picture}`;
    modalImage.alt = game.name;
    modalTitle.textContent = game.name;
    modalYear.textContent = `Année de sortie : ${game.year}`;
    modalReview.textContent = game.review;
    
    modal.style.display = 'block';
}