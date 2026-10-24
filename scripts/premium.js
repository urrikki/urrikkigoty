// ===== EFFETS VISUELS — direction « affiche 1912 » =====
// Tout est désactivé si l'utilisateur demande moins de mouvement.
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function initPremium() {
    initDust();
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    initCoverTilt();
}

// Poussières dans le rayon de lampe (désactivées si mouvement réduit)
function initDust() {
    if (REDUCED_MOTION) return;
    const box = document.createElement('div');
    box.className = 'dust';
    box.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 18; i++) {
        const m = document.createElement('span');
        m.className = 'mote';
        m.style.setProperty('--x', `${Math.random() * 100}%`);
        m.style.setProperty('--y', `${40 + Math.random() * 60}%`);
        m.style.setProperty('--s', `${2 + Math.random() * 3}px`);
        m.style.setProperty('--dur', `${9 + Math.random() * 9}s`);
        m.style.setProperty('--delay', `${-Math.random() * 12}s`);
        box.appendChild(m);
    }
    document.body.prepend(box);
}

// Apparition du titre et de l'en-tête, après l'intro (appelé par index.js)
function initEditorialTitle() {
    if (typeof gsap === 'undefined' || REDUCED_MOTION) return;
    const items = document.querySelectorAll('.main-header .site-title, .main-header .site-subtitle, .action-buttons .icon-btn');
    gsap.from(items, {
        opacity: 0,
        y: 12,
        duration: 0.7,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'opacity,transform'
    });
}

// Étiquettes de tier : apparition au défilement
function initTierLabelsReveal() {
    if (REDUCED_MOTION || typeof ScrollTrigger === 'undefined') return;
    document.querySelectorAll('.tier-label span:not([data-anim])').forEach(label => {
        label.dataset.anim = '1';
        gsap.from(label, {
            scrollTrigger: { trigger: label, start: 'top 92%', once: true },
            opacity: 0,
            y: 10,
            duration: 0.6,
            ease: 'power3.out'
        });
    });
}

// Rangées de tiers : montée douce au défilement
function initTierRowsReveal() {
    if (REDUCED_MOTION || typeof ScrollTrigger === 'undefined') return;
    document.querySelectorAll('.tier-row:not([data-anim])').forEach((row, i) => {
        row.dataset.anim = '1';
        gsap.from(row, {
            scrollTrigger: { trigger: row, start: 'top 90%', once: true },
            opacity: 0,
            y: 24,
            duration: 0.7,
            delay: (i % 4) * 0.05,
            ease: 'power3.out'
        });
    });
}

// Inclinaison légère des jeux au survol (souris uniquement)
function initCoverTilt() {
    if (REDUCED_MOTION || !FINE_POINTER || typeof gsap === 'undefined') return;
    const MAX_DEG = 9;
    let current = null;

    function reset(el) {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    }

    document.addEventListener('mousemove', e => {
        if (document.body.classList.contains('is-dragging')) return;
        const item = e.target instanceof Element ? e.target.closest('.game-item') : null;
        if (current && current !== item) reset(current);
        current = item;
        if (!item) return;

        const r = item.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(item, {
            rotateY: px * MAX_DEG,
            rotateX: -py * MAX_DEG,
            transformPerspective: 600,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: 'auto'
        });
    }, { passive: true });
}
