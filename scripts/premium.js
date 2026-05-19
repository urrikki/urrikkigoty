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

  // Supprimer les anciens
  const oldDot = document.getElementById('cursor-dot');
  const oldContainer = document.getElementById('cursor-trail-container');
  if (oldDot) oldDot.remove();
  if (oldContainer) oldContainer.remove();

  // Point principal (plus gros, plus brillant)
  const dot = document.createElement('div');
  dot.id = 'cursor-dot';
  dot.style.cssText = `
    position: fixed;
    width: 14px;
    height: 14px;
    background: radial-gradient(circle, #FFE6A3, #C9A84C);
    border-radius: 50%;
    box-shadow: 0 0 15px rgba(201,168,76,0.9), 0 0 5px #FFD966;
    pointer-events: none;
    z-index: 10000;
    transform: translate(-50%, -50%);
    will-change: left, top;
    transition: width 0.2s, height 0.2s;
  `;
  document.body.appendChild(dot);

  // Traînée améliorée (6 points, dégradé, mouvement plus doux)
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

  const TRAIL_LENGTH = 8;
  const trailElements = [];
  for (let i = 0; i < TRAIL_LENGTH; i++) {
    const trail = document.createElement('div');
    const size = 8 - i * 0.5; // taille décroissante
    trail.style.cssText = `
      position: absolute;
      width: ${Math.max(4, size)}px;
      height: ${Math.max(4, size)}px;
      background: radial-gradient(circle, rgba(226,196,122,0.8), rgba(184,134,11,0.4));
      border-radius: 50%;
      opacity: ${0.6 - i * 0.07};
      filter: blur(${i * 0.3}px);
      pointer-events: none;
      will-change: left, top;
      transition: opacity 0.1s linear;
    `;
    trailContainer.appendChild(trail);
    trailElements.push(trail);
  }

  let mouseX = 0, mouseY = 0;
  let positions = []; // historique des positions

  function updateTrail() {
    // Mettre à jour la position du point principal
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';

    // Ajouter la position actuelle dans l'historique
    positions.unshift({ x: mouseX, y: mouseY });
    if (positions.length > TRAIL_LENGTH) positions.pop();

    // Appliquer les positions décalées aux éléments de traînée
    for (let i = 0; i < trailElements.length; i++) {
      const pos = positions[i + 1] || positions[positions.length - 1];
      if (pos) {
        trailElements[i].style.left = pos.x + 'px';
        trailElements[i].style.top = pos.y + 'px';
      }
    }
    requestAnimationFrame(updateTrail);
  }
  updateTrail();

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Réduction de la taille dans la tier list (effet de précision)
  const tierZone = document.querySelector('.tier-list-container');
  if (tierZone) {
    tierZone.addEventListener('mouseenter', () => {
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.boxShadow = '0 0 8px rgba(201,168,76,0.8)';
    });
    tierZone.addEventListener('mouseleave', () => {
      dot.style.width = '14px';
      dot.style.height = '14px';
      dot.style.boxShadow = '0 0 15px rgba(201,168,76,0.9), 0 0 5px #FFD966';
    });
  }

  // Cacher le curseur système
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
    // Créer un canvas hors écran
    const canvas = document.createElement('canvas');
    const size = 512; // taille raisonnable
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Générer une texture de bruit (une seule fois)
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 50; // intensité
        data[i] = data[i+1] = data[i+2] = v;
        data[i+3] = 20; // transparence
    }
    ctx.putImageData(imageData, 0, 0);
    
    // Appliquer la texture comme background d'un div fixe
    const grainDiv = document.createElement('div');
    grainDiv.id = 'grain-overlay';
    grainDiv.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9998;
        opacity: 0.3;
        mix-blend-mode: overlay;
        background-image: url(${canvas.toDataURL()});
        background-repeat: repeat;
        background-size: ${size}px ${size}px;
    `;
    document.body.appendChild(grainDiv);
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

    measurePerformance('initGrain', () => initGrain());
    measurePerformance('initGoldLine', () => initGoldLine());
    measurePerformance('initCustomCursor', () => initCustomCursor());
    measurePerformance('initEditorialTitle', () => initEditorialTitle());
    measurePerformance('initTierLabelsReveal', () => initTierLabelsReveal());
    measurePerformance('initTierRowsReveal', () => initTierRowsReveal());
    measurePerformance('initCoverTilt', () => initCoverTilt());
    measurePerformance('initCinematicTransitions', () => initCinematicTransitions());

}