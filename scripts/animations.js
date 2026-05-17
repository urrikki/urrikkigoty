// ===== ANIMATIONS — version allégée (complément de premium.js) =====

function initLenis() {
    const lenis = new Lenis({
        duration: 1.2,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
}

// Animation d'entrée du view toggle (pas de conflit)
function animateViewToggle() {
    gsap.from('.view-toggle-bar', {
        y: -30,
        opacity: 0,
        duration: 0.7,
        delay: 0.8,
        ease: 'power3.out'
    });
}

// Parallax sur header
function initHeaderParallax() {
    const header = document.querySelector('.main-header');
    if (!header) return;
    gsap.to(header, {
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: '200px top',
            scrub: true
        },
        backgroundPositionY: '30%',
        ease: 'none'
    });
}

// Notification animée
function animateNotification(el) {
    gsap.fromTo(el,
        { x: 60, opacity: 0 },
        { x: 0,  opacity: 1, duration: 0.4, ease: 'back.out(1.4)' }
    );
}

// Initialisation globale (sans refaire le titre, sans double tilt)
function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    initLenis();
    animateViewToggle();
    initHeaderParallax();

    // On écoute l'événement de rendu pour rafraîchir ScrollTrigger
    document.addEventListener('viewRendered', () => {
        ScrollTrigger.refresh();
    });
}