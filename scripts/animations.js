// ===== ANIMATIONS — défilement fluide, modales, notifications =====
const REDUCED_MOTION_ANIM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initLenis() {
    if (REDUCED_MOTION_ANIM || typeof Lenis === 'undefined') return;
    const lenis = new Lenis({
        duration: 1.15,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
}

function initAnimations() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    initLenis();

    document.addEventListener('viewRendered', () => {
        ScrollTrigger.refresh();
        initTierLabelsReveal();
        initTierRowsReveal();
    });
}

// Ouverture d'une modale : le cadre remonte pendant que le fond s'éclaircit
function animateModalOpen(id) {
    if (typeof gsap === 'undefined' || REDUCED_MOTION_ANIM) return;
    const modal = document.getElementById(id);
    if (!modal) return;
    const box = modal.querySelector('.modal-content');
    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out', clearProps: 'opacity' });
    if (box) {
        gsap.fromTo(box,
            { y: 18, opacity: 0, scale: 0.985 },
            { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out', clearProps: 'transform,opacity' });
    }
}

// Fermeture : callback appelé à la fin, pour que modal.js masque l'élément
function animateModalClose(id, done) {
    const modal = document.getElementById(id);
    if (!modal || typeof gsap === 'undefined' || REDUCED_MOTION_ANIM) { done(); return; }
    const box = modal.querySelector('.modal-content');
    const tl = gsap.timeline({ onComplete: done });
    if (box) tl.to(box, { y: 10, opacity: 0, duration: 0.2, ease: 'power2.in' }, 0);
    tl.to(modal, { opacity: 0, duration: 0.22, ease: 'power2.in' }, 0.05);
}

// Notification : glisse depuis la droite
function animateNotification(el) {
    if (typeof gsap === 'undefined' || REDUCED_MOTION_ANIM) return;
    gsap.fromTo(el,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
}
