// ===== PREMIUM VISUALS — GOTY EDITION =====
// Curseur doré + animations editoriales + transitions cinématiques

// ── Custom Cursor (doré) ──
function initCustomCursor() {
    if (window.matchMedia('(hover: none)').matches) return;

    document.body.classList.add('has-custom-cursor');

    const dot  = document.createElement('div');
    dot.id = 'cursor-dot';
    const ring = document.createElement('div');
    ring.id = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = 0, my = 0, rx = 0, ry = 0, visible = false;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        gsap.set(dot, { x: mx, y: my });
        if (!visible) {
            visible = true;
            gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
        }
    });

    (function tick() {
        rx += (mx - rx) * 0.1;
        ry += (my - ry) * 0.1;
        gsap.set(ring, { x: rx, y: ry });
        requestAnimationFrame(tick);
    })();

    document.addEventListener('mouseover', e => {
        if (!(e.target instanceof Element)) return;
        if (e.target.closest('.game-item') || e.target.closest('.gallery-card')) {
            ring.classList.add('cursor-game');
            ring.classList.remove('cursor-hover');
        } else if (e.target.closest('button') || e.target.closest('.icon-btn') || e.target.closest('.view-btn')) {
            ring.classList.add('cursor-hover');
            ring.classList.remove('cursor-game');
        }
    });

    document.addEventListener('mouseout', e => {
        if (!(e.target instanceof Element)) return;
        if (e.target.closest('.game-item') || e.target.closest('.gallery-card')) {
            ring.classList.remove('cursor-game');
        } else if (e.target.closest('button') || e.target.closest('.icon-btn') || e.target.closest('.view-btn')) {
            ring.classList.remove('cursor-hover');
        }
    });

    document.addEventListener('mouseleave', () => {
        gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
        visible = false;
    });
    document.addEventListener('mouseenter', () => {
        gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
        visible = true;
    });
}

// ── Révélation editoriale du titre ──
function initEditorialTitle() {
    const title    = document.getElementById('siteTitle');
    const subtitle = document.querySelector('.site-subtitle');
    const buttons  = document.querySelectorAll('.action-buttons .icon-btn');
    if (!title) return;

    // Split en chars avec wrapper clip
    const html = [...title.textContent].map(char => {
        const cls = char === '.' ? 'char title-accent' : 'char';
        return `<span class="char-wrapper"><span class="${cls}">${char}</span></span>`;
    }).join('');
    title.innerHTML = html;

    const tl = gsap.timeline({ delay: 0.15 });
    tl
    .from(title.querySelectorAll('.char'), {
        yPercent: 110,
        duration: 1,
        stagger: 0.06,
        ease: 'expo.out'
    })
    .from(subtitle, {
        opacity: 0,
        y: 12,
        duration: 0.6,
        ease: 'power3.out'
    }, '-=0.5')
    .from(buttons, {
        opacity: 0,
        y: -10,
        stagger: 0.06,
        duration: 0.4,
        ease: 'power2.out'
    }, '-=0.4');
}

// ── Tier labels — entrée monumentale ──
function initTierLabelsReveal() {
    document.addEventListener('viewRendered', () => {
        document.querySelectorAll('.tier-label span:not([data-anim])').forEach(label => {
            label.setAttribute('data-anim', '1');
            gsap.from(label, {
                scrollTrigger: { trigger: label, start: 'top 92%', once: true },
                opacity: 0,
                scale: 3,
                duration: 0.7,
                ease: 'expo.out'
            });
        });
    });
}

// ── Tier rows — entrée gauche/droite alternée ──
function initTierRowsReveal() {
    document.addEventListener('viewRendered', () => {
        document.querySelectorAll('.tier-row:not([data-anim])').forEach((row, i) => {
            row.setAttribute('data-anim', '1');
            gsap.from(row, {
                scrollTrigger: { trigger: row, start: 'top 90%', once: true },
                x: i % 2 === 0 ? -40 : 40,
                opacity: 0,
                duration: 0.7,
                delay: i * 0.04,
                ease: 'power4.out'
            });
        });
    });
}

// ── Hover 3D avancé sur les covers ──
function initCoverTilt() {
    document.addEventListener('mousemove', e => {
        if (!(e.target instanceof Element)) return;
        const item = e.target.closest('.game-item');
        if (!item) return;

        const rect = item.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 22;
        const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -22;

        gsap.to(item, {
            rotateY: x, rotateX: y,
            scale: 1.1,
            transformPerspective: 600,
            duration: 0.3,
            ease: 'power2.out'
        });

        const img = item.querySelector('img');
        if (img) gsap.to(img, { x: x * 0.35, y: y * 0.35, duration: 0.35, ease: 'power2.out' });
    }, true);

    document.addEventListener('mouseleave', e => {
        if (!(e.target instanceof Element)) return;
        const item = e.target.closest('.game-item');
        if (!item) return;

        gsap.to(item, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
        const img = item.querySelector('img');
        if (img) gsap.to(img, { x: 0, y: 0, duration: 0.5, ease: 'power3.out' });
    }, true);
}

// ── Transitions de vue cinématiques ──
function initCinematicTransitions() {
    const viewIds = ['tierListView', 'timelineView', 'galleryView'];

    window.switchViewPremium = function(view, callback) {
        const active = viewIds
            .map(id => document.getElementById(id))
            .find(el => el && el.style.display !== 'none');

        if (!active) { callback(); return; }

        gsap.to(active, {
            opacity: 0,
            y: -16,
            scale: 0.975,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                callback();
                const next = viewIds
                    .map(id => document.getElementById(id))
                    .find(el => el && el.style.display !== 'none');
                if (next) {
                    gsap.fromTo(next,
                        { opacity: 0, y: 16, scale: 0.98 },
                        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'expo.out' }
                    );
                }
            }
        });
    };
}

// ── Grain overlay premium ──
function initGrain() {
    const canvas = document.createElement('canvas');
    canvas.id = 'grain-overlay';
    canvas.style.cssText = `
        position: fixed; inset: 0;
        width: 100vw; height: 100vh;
        pointer-events: none;
        z-index: 9998;
        mix-blend-mode: soft-light;
        opacity: 0.25;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function render() {
        const { width: w, height: h } = canvas;
        const img  = ctx.createImageData(w, h);
        const data = img.data;
        for (let i = 0; i < data.length; i += 4) {
            const v = Math.random() * 255;
            data[i] = data[i+1] = data[i+2] = v;
            data[i+3] = 22;
        }
        ctx.putImageData(img, 0, 0);
        requestAnimationFrame(render);
    }

    resize();
    window.addEventListener('resize', resize);
    render();
}

// ── Ligne lumineuse décorative au top ──
function initGoldLine() {
    const line = document.createElement('div');
    line.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, #C9A84C 30%, #E2C47A 50%, #C9A84C 70%, transparent 100%);
        z-index: 9997;
        pointer-events: none;
        animation: goldLinePulse 4s ease-in-out infinite;
    `;
    document.body.appendChild(line);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes goldLinePulse {
            0%, 100% { opacity: 0.4; }
            50%       { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// ── View toggle bar — entrée élégante ──
function initViewToggleReveal() {
    gsap.from('.view-toggle-bar', {
        opacity: 0,
        y: -20,
        duration: 0.6,
        delay: 1,
        ease: 'power3.out'
    });
}

// ── Init global ──
function initPremium() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    initGrain();
    initGoldLine();
    initCustomCursor();
    initEditorialTitle();
    initViewToggleReveal();
    initCoverTilt();
    initTierLabelsReveal();
    initTierRowsReveal();
    initCinematicTransitions();
}