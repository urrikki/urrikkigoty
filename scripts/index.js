document.addEventListener('DOMContentLoaded', function() {
    initializeTierList();
    
    document.getElementById('add-game').addEventListener('click', addGameHandler);
    
    addSampleGames();
});

const tierConfig = [
    { id: 'S', label: 'S', color: '#d4af37' },
    { id: 'A', label: 'A', color: '#b8941d' },
    { id: 'B', label: 'B', color: '#a37f15' },
    { id: 'C', label: 'C', color: '#8b6b3d' },
    { id: 'D', label: 'D', color: '#7a5c2d' },
    { id: 'E', label: 'E', color: '#6a4f26' },
    { id: 'F', label: 'F', color: '#5c4320' },
    { id: 'not-played', label: 'NP', color: '#8b7d6b' }
];

function initializeTierList() {
    const tierContainer = document.querySelector('.tier-container');
    tierContainer.innerHTML = '';
    
    tierConfig.forEach(tier => {
        const tierRow = document.createElement('div');
        tierRow.className = 'tier-row';
        tierRow.innerHTML = `
            <div class="tier-label">${tier.label}</div>
            <div class="tier-content" data-tier="${tier.id}"></div>
        `;
        tierContainer.appendChild(tierRow);
    });
}

function addGameHandler() {
    const titleInput = document.getElementById('game-title');
    const tierSelect = document.getElementById('game-tier');
    const ratingSelect = document.getElementById('game-rating');
    
    const title = titleInput.value.trim();
    const tier = tierSelect.value;
    const rating = parseInt(ratingSelect.value);
    
    if (title === '') {
        alert('Please enter a game title');
        return;
    }
    
    addGameToTier(title, tier, rating);
    
    titleInput.value = '';
    tierSelect.value = 'S';
    ratingSelect.value = '5';
}

function addGameToTier(title, tier, rating) {
    const tierContent = document.querySelector(`.tier-content[data-tier="${tier}"]`);
    
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.draggable = true;
    gameCard.dataset.rating = rating;
    
    let iconClass = 'fas fa-gamepad';
    if (tier === 'S') iconClass = 'fas fa-crown';
    if (tier === 'not-played') iconClass = 'fas fa-question';
    
    gameCard.innerHTML = `
        <div class="game-icon"><i class="${iconClass}"></i></div>
        <div class="game-info">
            <div class="game-title">${title}</div>
            <div class="game-rating">${createStarRating(rating, tier === 'not-played')}</div>
        </div>
    `;
    
    gameCard.addEventListener('dragstart', dragStart);
    gameCard.addEventListener('dragend', dragEnd);
    
    tierContent.appendChild(gameCard);
}

function createStarRating(rating, notPlayed) {
    if (notPlayed || isNaN(rating)) return '<span class="star">Not Played</span>';
    
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHtml += '<span class="star"><i class="fas fa-star"></i></span>';
        } else {
            starsHtml += '<span class="star"><i class="far fa-star"></i></span>';
        }
    }
    return starsHtml;
}

let draggedItem = null;

function dragStart() {
    draggedItem = this;
    setTimeout(() => this.style.opacity = '0.5', 0);
}

function dragEnd() {
    draggedItem = null;
    setTimeout(() => this.style.opacity = '1', 0);
}

function initializeDragAndDrop() {
    const tierContents = document.querySelectorAll('.tier-content');
    tierContents.forEach(area => {
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.background = 'rgba(212, 175, 55, 0.1)';
        });
        
        area.addEventListener('dragleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.8)';
        });
        
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.background = 'rgba(255, 255, 255, 0.8)';
            
            if (draggedItem) {
                this.appendChild(draggedItem);
                
                const icon = draggedItem.querySelector('.game-icon i');
                const ratingElement = draggedItem.querySelector('.game-rating');
                const originalRating = draggedItem.dataset.rating;
                
                if (this.dataset.tier === 'not-played') {
                    icon.className = 'fas fa-question';
                    ratingElement.innerHTML = '<span class="star">Not Played</span>';
                } else {
                    icon.className = this.dataset.tier === 'S' ? 'fas fa-crown' : 'fas fa-gamepad';
                    ratingElement.innerHTML = createStarRating(parseInt(originalRating), false);
                }
            }
        });
    });
}

function addSampleGames() {
    addGameToTier('The Witcher 3', 'S', 5);
    addGameToTier('Elden Ring', 'A', 5);
    addGameToTier('God of War', 'B', 4);
    addGameToTier('Cyberpunk 2077', 'not-played', 0);
    addGameToTier('The Legend of Zelda: Breath of the Wild', 'S', 5);
    addGameToTier('Red Dead Redemption 2', 'A', 5);
    addGameToTier('Hollow Knight', 'A', 4);
    addGameToTier('Dark Souls III', 'B', 4);
    
    initializeDragAndDrop();
}