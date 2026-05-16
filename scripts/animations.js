// ===== ANIMATIONS — GSAP + LENIS =====

// ── Smooth Scroll ──
function initLenis() {
    const lenis = new Lenis({
        duration: 1.2,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    });

    // Connecter Lenis à GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    window.__lenis = lenis;
}

// ── Animation d'entrée du titre GOTY ──
function animateHeroTitle() {
    const title = document.getElementById('siteTitle');
    const subtitle = document.querySelector('.site-subtitle');
    if (!title) return;

    // Split le texte lettre par lettre
    const text = title.textContent;
    title.innerHTML = text.split('').map((char, i) => {
        if (char === '.') return `<span class="title-accent char" style="display:inline-block">${char}</span>`;
        return `<span class="char" style="display:inline-block">${char}</span>`;
    }).join('');

    const tl = gsap.timeline({ delay: 0.2 });

    tl.from(title.querySelectorAll('.char'), {
        y: 80,
        opacity: 0,
        rotateX: -90,
        stagger: 0.06,
        duration: 0.8,
        ease: 'back.out(1.7)',
        transformOrigin: 'center bottom'
    })
    .from(subtitle, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out'
    }, '-=0.3')
    .from('.action-buttons .icon-btn', {
        y: -20,
        opacity: 0,
        stagger: 0.07,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.4');
}

// ── Animation d'entrée du view toggle ──
function animateViewToggle() {
    gsap.from('.view-toggle-bar', {
        y: -30,
        opacity: 0,
        duration: 0.7,
        delay: 0.8,
        ease: 'power3.out'
    });
}

// ── Révélation des tier rows au scroll ──
function animateTierRows() {
    const rows = document.querySelectorAll('.tier-row');
    if (!rows.length) return;

    gsap.from(rows, {
        scrollTrigger: {
            trigger: '.tier-list',
            start: 'top 85%',
        },
        x: -40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power3.out'
    });
}

// ── Révélation des game items au scroll ──
function animateGameItems() {
    const items = document.querySelectorAll('.game-item');
    if (!items.length) return;

    ScrollTrigger.batch(items, {
        onEnter: batch => gsap.from(batch, {
            scale: 0.7,
            opacity: 0,
            stagger: 0.05,
            duration: 0.5,
            ease: 'back.out(1.4)'
        }),
        start: 'top 90%'
    });
}

// ── Effet 3D tilt au hover sur les game items ──
function initTiltEffect() {
    document.addEventListener('mousemove', e => {
        if (!(e.target instanceof Element)) return;
        const item = e.target.closest('.game-item');
        if (!item) return;

        const rect = item.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 20;
        const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -20;

        gsap.to(item, {
            rotateY: x,
            rotateX: y,
            scale: 1.08,
            transformPerspective: 600,
            transformOrigin: 'center center',
            duration: 0.3,
            ease: 'power2.out',
            boxShadow: `${-x * 0.5}px ${y * 0.5}px 20px rgba(0,0,0,0.25)`
        });
    });

    document.addEventListener('mouseleave', e => {
        if (!(e.target instanceof Element)) return;
        const item = e.target.closest('.game-item');
        if (!item) return;
        gsap.to(item, {
            rotateY: 0, rotateX: 0, scale: 1,
            boxShadow: 'none',
            duration: 0.5,
            ease: 'elastic.out(1, 0.5)'
        });
    }, true);
}

// ── Transition de vue fluide ──
function animateViewTransition(callback) {
    const views = ['tierListView', 'timelineView', 'galleryView'];
    const activeView = views.map(id => document.getElementById(id))
                            .find(el => el && el.style.display !== 'none');

    if (!activeView) { callback(); return; }

    gsap.to(activeView, {
        opacity: 0,
        y: 20,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
            callback();
            const newViews = views.map(id => document.getElementById(id))
                                  .find(el => el && el.style.display !== 'none');
            if (newViews) {
                gsap.fromTo(newViews,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
                );
            }
        }
    });
}

// ── Animation d'ouverture des modales ──
function animateModalOpen(modalId) {
    const modal = document.getElementById(modalId);
    const content = modal?.querySelector('.modal-content');
    if (!content) return;

    gsap.fromTo(content,
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1,   opacity: 1, y: 0,
          duration: 0.45, ease: 'back.out(1.4)' }
    );
}

// ── Animation fermeture des modales ──
function animateModalClose(modalId, callback) {
    const modal = document.getElementById(modalId);
    const content = modal?.querySelector('.modal-content');
    if (!content) { callback(); return; }

    gsap.to(content, {
        scale: 0.92, opacity: 0, y: 20,
        duration: 0.25, ease: 'power2.in',
        onComplete: callback
    });
}

// ── Parallax sur le header ──
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

// ── Notification animée ──
function animateNotification(el) {
    gsap.fromTo(el,
        { x: 60, opacity: 0 },
        { x: 0,  opacity: 1, duration: 0.4, ease: 'back.out(1.4)' }
    );
}

// ── Init globale ──
function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    initLenis();
    animateHeroTitle();
    animateViewToggle();
    initTiltEffect();
    initHeaderParallax();

    // Re-animer après chaque render de vue
    document.addEventListener('viewRendered', () => {
        ScrollTrigger.refresh();
        animateTierRows();
        animateGameItems();
    });
}