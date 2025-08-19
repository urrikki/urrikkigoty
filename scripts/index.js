document.addEventListener('DOMContentLoaded', function() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 5 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(255, 215, 0, 0.7)';
        particle.style.borderRadius = '50%';
        particle.style.boxShadow = '0 0 5px rgba(255, 215, 0, 0.5)';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = Math.random() * 100 + 'vh';
        
        particlesContainer.appendChild(particle);

        animateParticle(particle);
    }
    
    function animateParticle(element) {
        const duration = Math.random() * 5 + 5;
        
        element.animate([
            { transform: 'translateY(0px)', opacity: 0.7 },
            { transform: `translateY(${Math.random() * 100 - 50}px) translateX(${Math.random() * 100 - 50}px)`, opacity: 0.3 }
        ], {
            duration: duration * 1000,
            iterations: Infinity,
            direction: 'alternate',
            easing: 'ease-in-out'
        });
    }
    
    const title = document.querySelector('.title');
    
    title.addEventListener('mouseover', () => {
        title.style.transform = 'scale(1.05)';
        title.style.textShadow = '0 0 15px #ffd700, 0 0 25px #ffd700, 0 0 35px #ffd700, 0 0 45px #ff6b00, 0 0 80px #ff6b00, 0 0 90px #ff6b00';
    });
    
    title.addEventListener('mouseout', () => {
        title.style.transform = 'scale(1)';
        title.style.textShadow = '0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700, 0 0 40px #ff6b00, 0 0 70px #ff6b00, 0 0 80px #ff6b00';
    });
});