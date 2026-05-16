// ===== PREMIUM VISUALS — AWWWARDS LEVEL =====
// Parallax covers + editorial typography + custom cursor + cinematic transitions

// ── Custom Cursor ──
function initCustomCursor() {
    const cursor = document.createElement('div');
    cursor.id = 'cursor-dot';
    const ring = document.createElement('div');
    ring.id = 'cursor-ring';
    document.body.appendChild(cursor);
    document.body.appendChild(ring);

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        gsap.set(cursor, { x: mouseX, y: mouseY });
    });

    // Ring follows with lag
    function animateRing() {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        gsap.set(ring, { x: ringX, y: ringY });
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // Cursor states
    document.addEventListener('mouseover', e => {
        const target = e.target;
        if (target.closest('.game-item') || target.closest('.view-btn') || target.closest('.icon-btn')) {
            cursor.classList.add('cursor-hover');
            ring.classList.add('cursor-hover');
        }
        if (target.closest('.game-item')) {
            ring.classList.add('cursor-game');
        }
    });

    document.addEventListener('mouseout', e => {
        const target = e.target;
        if (target.closest('.game-item') || target.closest('.view-btn') || target.closest('.icon-btn')) {
            cursor.classList.remove('cursor-hover');
            ring.classList.remove('cursor-hover');
        }
        if (target.closest('.game-item')) {
            ring.classList.remove('cursor-game');
        }
    });
}

// ── Parallax sur les covers de jeux ──
function initCoverParallax() {
    if (!window.ScrollTrigger) return;

    function applyParallax() {
        const items = document.querySelectorAll('.game-item:not([data-parallax])');
        items.forEach(item => {
            item.setAttribute('data-parallax', 'true');
            const img = item.querySelector('img');
            if (!img) return;

            // Chaque image se déplace légèrement en sens inverse du scroll
            gsap.to(img, {
                scrollTrigger: {
                    trigger: item,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.5
                },
                yPercent: -15,
                ease: 'none'
            });
        });
    }

    // Apply on initial render and on each re-render
    document.addEventListener('viewRendered', () => {
        setTimeout(applyParallax, 100);
    });
    setTimeout(applyParallax, 500);
}

// ── Révélation editoriale du titre GOTY ──
function initEditorialTitle() {
    const title = document.getElementById('siteTitle');
    const subtitle = document.querySelector('.site-subtitle');
    if (!title) return;

    // Wrap chaque lettre dans un span avec clip reveal
    const text = title.textContent;
    title.innerHTML = '';
    [...text].forEach((char, i) => {
        const wrapper = document.createElement('span');
        wrapper.className = 'char-wrapper';
        wrapper.style.display = 'inline-block';
        wrapper.style.overflow = 'hidden';

        const inner = document.createElement('span');
        inner.className = char === '.' ? 'char title-accent' : 'char';
        inner.textContent = char;
        inner.style.display = 'inline-block';

        wrapper.appendChild(inner);
        title.appendChild(wrapper);
    });

    const chars = title.querySelectorAll('.char');
    const tl = gsap.timeline({ delay: 0.1 });

    tl.from(chars, {
        yPercent: 110,
        duration: 0.9,
        stagger: 0.07,
        ease: 'expo.out'
    })
    .from(subtitle, {
        yPercent: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power4.out'
    }, '-=0.5')
    .from('.action-buttons .icon-btn', {
        opacity: 0,
        y: -15,
        stagger: 0.06,
        duration: 0.5,
        ease: 'power3.out'
    }, '-=0.4');
}

// ── Tier labels monumentaux (S, A, B...) ──
function initTierLabelsReveal() {
    document.addEventListener('viewRendered', () => {
        const labels = document.querySelectorAll('.tier-label span:not([data-revealed])');
        labels.forEach(label => {
            label.setAttribute('data-revealed', 'true');
            gsap.from(label, {
                scrollTrigger: {
                    trigger: label,
                    start: 'top 90%',
                    once: true
                },
                scale: 2.5,
                opacity: 0,
                duration: 0.6,
                ease: 'expo.out'
            });
        });
    });
}

// ── Reveal des tier rows avec stagger élaboré ──
function initTierRowsReveal() {
    document.addEventListener('viewRendered', () => {
        const rows = document.querySelectorAll('.tier-row:not([data-revealed])');
        rows.forEach((row, i) => {
            row.setAttribute('data-revealed', 'true');
            gsap.from(row, {
                scrollTrigger: {
                    trigger: row,
                    start: 'top 88%',
                    once: true
                },
                x: i % 2 === 0 ? -60 : 60,
                opacity: 0,
                duration: 0.8,
                delay: i * 0.05,
                ease: 'power4.out'
            });
        });
    });
}

// ── Hover 3D avancé sur les covers ──
function initAdvanced3DTilt() {
    document.addEventListener('mousemove', e => {
        if (!(e.target instanceof Element)) return;
        const item = e.target.closest('.game-item');
        if (!item) return;

        const rect = item.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 28;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -28;

        gsap.to(item, {
            rotateY: x,
            rotateX: y,
            scale: 1.12,
            transformPerspective: 500,
            transformOrigin: 'center center',
            duration: 0.25,
            ease: 'power2.out',
            boxShadow: `${-x * 0.6}px ${y * 0.6}px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)`
        });

        // Inner image contre-parallax
        const img = item.querySelector('img');
        if (img) {
            gsap.to(img, {
                x: x * 0.4,
                y: y * 0.4,
                scale: 1.08,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    }, true);

    document.addEventListener('mouseleave', e => {
        if (!(e.target instanceof Element)) return;
        const item = e.target.closest('.game-item');
        if (!item) return;

        gsap.to(item, {
            rotateY: 0, rotateX: 0, scale: 1,
            boxShadow: 'none',
            duration: 0.7,
            ease: 'elastic.out(1, 0.5)'
        });

        const img = item.querySelector('img');
        if (img) {
            gsap.to(img, {
                x: 0, y: 0, scale: 1,
                duration: 0.5,
                ease: 'power3.out'
            });
        }
    }, true);
}

// ── Transitions de vue cinématiques ──
function initCinematicViewTransitions() {
    const viewIds = ['tierListView', 'timelineView', 'galleryView'];

    window.switchViewPremium = function(view, callback) {
        const activeView = viewIds.map(id => document.getElementById(id))
                                  .find(el => el && el.style.display !== 'none');

        if (!activeView) { callback(); return; }

        // Sortie : slide + scale vers le haut
        gsap.to(activeView, {
            yPercent: -4,
            opacity: 0,
            scale: 0.97,
            duration: 0.35,
            ease: 'power3.in',
            onComplete: () => {
                callback();
                const newView = viewIds.map(id => document.getElementById(id))
                                       .find(el => el && el.style.display !== 'none');
                if (newView) {
                    gsap.fromTo(newView,
                        { yPercent: 3, opacity: 0, scale: 0.98 },
                        { yPercent: 0, opacity: 1, scale: 1,
                          duration: 0.55, ease: 'expo.out' }
                    );
                }
            }
        });
    };
}

// ── Grain overlay pour texture editoriale ──
function initGrainOverlay() {
    const canvas = document.createElement('canvas');
    canvas.id = 'grain-overlay';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function renderGrain() {
        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const val = Math.random() * 255;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
            data[i + 3] = 18; // très subtil
        }

        ctx.putImageData(imageData, 0, 0);
        requestAnimationFrame(renderGrain);
    }

    resize();
    window.addEventListener('resize', resize);
    renderGrain();
}

// ── Ligne de scan horizontale décorative ──
function initScanLine() {
    const line = document.createElement('div');
    line.id = 'scan-line';
    document.body.appendChild(line);

    gsap.to(line, {
        yPercent: 10000,
        duration: 8,
        ease: 'none',
        repeat: -1,
        modifiers: {
            yPercent: v => parseFloat(v) % 100
        }
    });
}

// ── Init global premium ──
function initPremium() {
    if (typeof gsap === 'undefined') {
        console.warn('[PREMIUM] GSAP non chargé');
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    initCustomCursor();
    initGrainOverlay();
    initEditorialTitle();
    initCoverParallax();
    initTierLabelsReveal();
    initTierRowsReveal();
    initAdvanced3DTilt();
    initCinematicViewTransitions();
}