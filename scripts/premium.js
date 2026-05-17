// ===== PREMIUM VISUALS — GOTY EDITION =====
// Curseur doré + animations editoriales + transitions cinématiques

// ===== CURSEUR DORÉ + TRAÎNÉE LUMINEUSE (hors tier list) =====
function initCustomCursor() {
    if (window.matchMedia('(hover: none)').matches) return;

    // Supprimer l'ancien curseur s'il existe
    const oldDot = document.getElementById('cursor-dot');
    const oldRing = document.getElementById('cursor-ring');
    if (oldDot) oldDot.remove();
    if (oldRing) oldRing.remove();

    // Créer la boule principale (dorée, lumineuse)
    const dot = document.createElement('div');
    dot.id = 'cursor-dot';
    dot.style.cssText = `
        position: fixed;
        width: 12px;
        height: 12px;
        background: radial-gradient(circle, #FFD966, #C9A84C);
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(201,168,76,0.8), 0 0 4px #FFE6A3;
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
        transition: width 0.2s, height 0.2s;
        will-change: left, top;
    `;
    document.body.appendChild(dot);

    // Conteneur pour la traînée (plusieurs petites boules)
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

    // Paramètres de la traînée
    const TRAIL_LENGTH = 12;      // nombre de traces
    const TRAIL_DECAY = 0.85;     // coefficient de réduction de taille
    let trailPositions = [];       // stocke les positions {x, y}
    let lastTimestamp = 0;
    let isInsideTierList = false;  // flag pour savoir si on est dans la tier list

    // Créer les éléments de la traînée (invisible au début)
    const trailElements = [];
    for (let i = 0; i < TRAIL_LENGTH; i++) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, #E2C47A, #B8860B);
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.15s linear;
            filter: blur(0.5px);
            pointer-events: none;
            box-shadow: 0 0 6px rgba(201,168,76,0.6);
        `;
        trailContainer.appendChild(trail);
        trailElements.push(trail);
    }

    // Mettre à jour la position de la boule principale et ajouter un point à la traînée
    let mouseX = 0, mouseY = 0;
    let lastX = 0, lastY = 0;

    function addTrailPoint(x, y) {
        trailPositions.unshift({ x, y, age: 0 });
        if (trailPositions.length > TRAIL_LENGTH) trailPositions.pop();
    }

    function updateTrail() {
        // Mettre à jour chaque trace en fonction de sa position dans l'historique
        for (let i = 0; i < trailElements.length; i++) {
            const pos = trailPositions[i];
            if (pos && !isInsideTierList) {
                const element = trailElements[i];
                element.style.left = pos.x + 'px';
                element.style.top = pos.y + 'px';
                // Taille décroissante et opacité
                const scale = Math.pow(TRAIL_DECAY, i);
                const size = 8 * scale;
                element.style.width = size + 'px';
                element.style.height = size + 'px';
                element.style.opacity = 0.6 * scale;
                element.style.transform = 'translate(-50%, -50%)';
            } else {
                // Si on est dans la tier list, on cache la traînée
                trailElements[i].style.opacity = '0';
            }
        }
        requestAnimationFrame(updateTrail);
    }
    updateTrail();

    // Détecter si la souris est dans la zone de la tier list
    function checkIfInsideTierList(e) {
        const tierListZone = document.querySelector('.tier-list-container');
        if (!tierListZone) return false;
        const rect = tierListZone.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        return (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
    }

    // Événement mousemove
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';

        // Vérifier si on est dans la tier list
        const nowInside = checkIfInsideTierList(e);
        if (nowInside !== isInsideTierList) {
            isInsideTierList = nowInside;
            // Optionnel : changer l'apparence du curseur à l'intérieur
            if (isInsideTierList) {
                dot.style.width = '8px';
                dot.style.height = '8px';
                dot.style.background = 'radial-gradient(circle, #FFD966, #C9A84C)';
            } else {
                dot.style.width = '12px';
                dot.style.height = '12px';
            }
        }

        // Ajouter un point à la traînée uniquement si on est EN DEHORS de la tier list
        if (!isInsideTierList) {
            // Limiter la fréquence d'ajout pour éviter trop de points (toutes les 8ms environ)
            const now = performance.now();
            if (now - lastTimestamp > 8) {
                addTrailPoint(mouseX, mouseY);
                lastTimestamp = now;
            }
        } else {
            // Si on est à l'intérieur, on vide la traînée progressivement
            trailPositions = [];
        }
    });

    // Gérer la sortie de la fenêtre
    document.addEventListener('mouseleave', () => {
        dot.style.opacity = '0';
        trailElements.forEach(t => t.style.opacity = '0');
    });
    document.addEventListener('mouseenter', () => {
        dot.style.opacity = '1';
    });

    // Animation de pulsation légère (optionnel)
    setInterval(() => {
        if (!isInsideTierList) {
            dot.style.transform = 'translate(-50%, -50%) scale(1.1)';
            setTimeout(() => { dot.style.transform = 'translate(-50%, -50%) scale(1)'; }, 150);
        }
    }, 2000);
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

function initPremium() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    initGrain();
    initGoldLine();
    initCustomCursor();
    initCoverTilt();          
    initTierLabelsReveal();
    initTierRowsReveal();
    initCinematicTransitions();
}