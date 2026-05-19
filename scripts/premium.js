// ===== PREMIUM VISUALS — GOTY EDITION =====
// Curseur doré + animations editoriales + transitions cinématiques

// ===== CURSEUR DORÉ + TRAÎNÉE LUMINEUSE (hors tier list) =====
// ===== CURSEUR DORÉ OPTIMISÉ (sans lag) =====
function measurePerformance(name, fn) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`🕒 ${name} : ${(end - start).toFixed(2)} ms`);
}

function initCustomCursor() {
    if (window.matchMedia('(hover: none)').matches) return;

    // Supprimer les anciens éléments
    const oldDot = document.getElementById('cursor-dot');
    const oldContainer = document.getElementById('cursor-trail-container');
    if (oldDot) oldDot.remove();
    if (oldContainer) oldContainer.remove();

    // === Curseur principal ===
    const dot = document.createElement('div');
    dot.id = 'cursor-dot';
    dot.style.cssText = `
        position: fixed;
        width: 12px;
        height: 12px;
        background: radial-gradient(circle, #FFD966, #C9A84C);
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(201,168,76,0.8);
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
        will-change: left, top;
        transition: width 0.2s, height 0.2s;
    `;
    document.body.appendChild(dot);

    // === Traînée légère (optionnelle, 3 éléments max) ===
    const trailContainer = document.createElement('div');
    trailContainer.id = 'cursor-trail-container';
    trailContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 9999;
    `;
    document.body.appendChild(trailContainer);

    const TRAIL_LENGTH = 3; // réduit à 3 pour plus de fluidité
    let trailElements = [];
    for (let i = 0; i < TRAIL_LENGTH; i++) {
        const trail = document.createElement('div');
        trail.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, #E2C47A, #B8860B);
            border-radius: 50%;
            opacity: 0;
            pointer-events: none;
            will-change: left, top;
        `;
        trailContainer.appendChild(trail);
        trailElements.push(trail);
    }

    let mouseX = 0, mouseY = 0;
    let trailPositions = [{ x: 0, y: 0 }]; // dernier point seulement

    // Mise à jour directe sans throttle, avec RAF
    function updateCursor() {
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';

        // Traînée : décaler les positions et mettre à jour
        if (trailPositions.length > 0) {
            for (let i = trailElements.length - 1; i >= 0; i--) {
                const pos = trailPositions[i] || trailPositions[trailPositions.length - 1];
                if (pos) {
                    trailElements[i].style.left = pos.x + 'px';
                    trailElements[i].style.top = pos.y + 'px';
                    const opacity = 0.5 * (1 - i / trailElements.length);
                    trailElements[i].style.opacity = opacity;
                }
            }
        }
        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Événement mousemove : stocke la position et met à jour la traînée
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Ajouter un point pour la traînée (simple, sans throttle)
        trailPositions.unshift({ x: mouseX, y: mouseY });
        if (trailPositions.length > TRAIL_LENGTH) trailPositions.pop();
    });

    // Gestion des changements de taille du curseur dans la tier list
    const tierListZone = document.querySelector('.tier-list-container');
    if (tierListZone) {
        tierListZone.addEventListener('mouseenter', () => {
            dot.style.width = '8px';
            dot.style.height = '8px';
        });
        tierListZone.addEventListener('mouseleave', () => {
            dot.style.width = '12px';
            dot.style.height = '12px';
        });
    }

    // Cache la souris système par défaut
    document.body.style.cursor = 'none';
}

// ── Révélation editoriale du titre ──
// ===== TITRE EDITORIAL (split + animation cascade) =====

function initEditorialTitle() {
    const title = document.getElementById('siteTitle');
    const subtitle = document.querySelector('.site-subtitle');
    if (!title) return;

    // 1. État initial : boutons invisibles mais bien positionnés (pour l'animation)
    gsap.set('.action-buttons .icon-btn', { opacity: 0, y: -10 });

    // 2. Split du titre en caractères (inchangé, mais on garde le wrapper)
    const html = [...title.textContent].map(char => {
        const cls = char === '.' ? 'char title-accent' : 'char';
        return `<span class="char-wrapper"><span class="${cls}">${char}</span></span>`;
    }).join('');
    title.innerHTML = html;

    // 3. Timeline (titre + sous-titre + boutons)
    const tl = gsap.timeline({ delay: 0.15 });

    tl.from(title.querySelectorAll('.char'), {
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
    .from('.action-buttons .icon-btn', {
        opacity: 0,
        y: -10,
        stagger: 0.06,
        duration: 0.4,
        ease: 'power2.out',
        clearProps: 'opacity,transform'   // ← NETTOIE APRÈS L'ANIMATION
    }, '-=0.4');

    // 4. Sécurité : forcer la visibilité finale au cas où (optionnel, mais prudent)
    tl.call(() => {
        gsap.set('.action-buttons .icon-btn', { opacity: 1, y: 0, clearProps: 'opacity,transform' });
    }, null, null, '+=0.1');
}

// ===== LABELS TIERS (apparition monumentale) =====
function initTierLabelsReveal() {
    const labels = document.querySelectorAll('.tier-label span:not([data-anim])');
    labels.forEach(label => {
        label.setAttribute('data-anim', '1');
        gsap.from(label, {
            scrollTrigger: { trigger: label, start: 'top 92%', once: true },
            opacity: 0,
            scale: 3,
            duration: 0.7,
            ease: 'expo.out'
        });
    });
}

// ===== RANGÉES TIERS (entrée latérale alternée) =====
function initTierRowsReveal() {
    const rows = document.querySelectorAll('.tier-row:not([data-anim])');
    rows.forEach((row, i) => {
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
}

// ── Hover 3D avancé sur les covers ──
function initCoverTilt() {
    document.addEventListener('mousemove', e => {
        if (document.body.classList.contains('is-dragging')) return; // 👈 ajoutez cette ligne
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
        if (document.body.classList.contains('is-dragging')) return; // 👈 ajoutez cette ligne
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
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 9998;
        mix-blend-mode: normal;
        opacity: 0.08; /* réduire l'opacité pour moins de contraste */
    `;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Remplacer l'animation continue par une mise à jour toutes les 200ms
    function renderGrain() {
        const { width: w, height: h } = canvas;
        const imgData = ctx.createImageData(w, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const v = Math.random() * 80; // intensité plus faible
            data[i] = data[i+1] = data[i+2] = v;
            data[i+3] = 20;
        }
        ctx.putImageData(imgData, 0, 0);
        setTimeout(renderGrain, 100); // 10 FPS au lieu de 60
    }
    renderGrain();
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

function initFPSMeter() {
    let fps = 60;
    let lastTime = performance.now();
    let frames = 0;
    const fpsDiv = document.createElement('div');
    fpsDiv.id = 'fps-counter';
    fpsDiv.style.cssText = `
        position: fixed; bottom: 10px; left: 10px;
        background: rgba(0,0,0,0.7); color: #0f0;
        font-family: monospace; font-size: 12px;
        padding: 4px 8px; border-radius: 4px;
        z-index: 9999; pointer-events: none;
        backdrop-filter: blur(4px);
    `;
    document.body.appendChild(fpsDiv);
    
    function update() {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            fps = frames;
            fpsDiv.textContent = `FPS: ${fps}`;
            fpsDiv.style.color = fps >= 55 ? '#0f0' : (fps >= 30 ? '#ff0' : '#f00');
            frames = 0;
            lastTime = now;
        }
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function initPremium() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    measurePerformance('initGrain', () => initGrain());
    measurePerformance('initGoldLine', () => initGoldLine());
    measurePerformance('initCustomCursor', () => initCustomCursor());
    measurePerformance('initEditorialTitle', () => initEditorialTitle());
    measurePerformance('initTierLabelsReveal', () => initTierLabelsReveal());
    measurePerformance('initTierRowsReveal', () => initTierRowsReveal());
    measurePerformance('initCoverTilt', () => initCoverTilt());
    measurePerformance('initCinematicTransitions', () => initCinematicTransitions());

}