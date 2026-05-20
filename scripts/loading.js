// ===== LOADING SCREEN CINÉMATIQUE — GOTY EDITION =====
// Inspiré de Son Daven : visuel plein écran + counter minimaliste + rideau de sortie
// Usage : <script src="scripts/loading.js"></script> tout en haut du <body>

(function () {

  /* ─── 1. HTML ─── */
  const overlay = document.createElement('div');
  overlay.id = 'goty-loader';
  overlay.innerHTML = `

    <!-- Fond : effet visuel canvas (scanlines animées + vignette) -->
    <canvas id="loader-canvas"></canvas>

    <!-- Vignette de bords -->
    <div class="loader-vignette"></div>

    <!-- Ligne or haut -->
    <div class="loader-line-top"></div>

    <!-- Contenu central -->
    <div class="loader-body">

      <!-- Phrase poétique (style Son Daven) -->
      <p class="loader-poem" id="loaderPoem">
        <span class="poem-line" id="poemLine1">Among the greatest games</span>
        <span class="poem-line" id="poemLine2">only a few deserve the throne</span>
      </p>

      <!-- Logo -->
      <div class="loader-logo">
        <span class="loader-logo-text" id="loaderLogoText">GOTY</span>
        <span class="loader-logo-dot">.</span>
      </div>

      <!-- Label -->
      <p class="loader-label">Tier List</p>

    </div>

    <!-- Counter en bas à gauche — exactement comme Son Daven -->
    <div class="loader-counter">
      <span class="loader-pct" id="loaderPct">0</span><span class="loader-pct-sym">%</span>
    </div>

    <!-- Status en bas à droite -->
    <div class="loader-status-wrap">
      <span class="loader-status" id="loaderStatus">Loading the hierarchy</span>
    </div>

    <!-- Skip -->
    <button class="loader-skip" id="loaderSkip">Skip intro ↗</button>

  `;

  /* ─── 2. CSS ─── */
  const css = document.createElement('style');
  css.textContent = `

    /* Masquer le contenu pendant le chargement */
    .app-wrapper { opacity: 0; }

    #goty-loader {
      position: fixed;
      inset: 0;
      background: #030303;
      z-index: 99999;
      overflow: hidden;
      cursor: none;
      font-family: 'Inter', 'DM Sans', system-ui, sans-serif;
    }

    /* Canvas fond */
    #loader-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0.9;
    }

    /* Vignette — assombrit les coins */
    .loader-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 75% 75% at 50% 50%,
        transparent 40%,
        rgba(0,0,0,0.6) 75%,
        rgba(0,0,0,0.92) 100%
      );
      pointer-events: none;
    }

    /* Ligne or en haut */
    .loader-line-top {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, #C9A84C 25%, #E2C47A 50%, #C9A84C 75%, transparent);
      animation: lineBreath 3s ease-in-out infinite;
    }
    @keyframes lineBreath {
      0%, 100% { opacity: 0.4; }
      50%       { opacity: 1; }
    }

    /* Corps central */
    .loader-body {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 2rem;
      text-align: center;
    }

    /* Phrase poétique */
    .loader-poem {
      display: flex;
      flex-direction: column;
      gap: 0.3em;
      margin: 0 0 1rem;
    }
    .poem-line {
      display: block;
      font-family: 'DM Serif Display', 'Georgia', serif;
      font-style: italic;
      font-size: clamp(1rem, 2.5vw, 1.5rem);
      color: rgba(245,240,232,0.65);
      letter-spacing: 0.02em;
      font-weight: 400;
      opacity: 0;
      transform: translateY(14px);
      transition: opacity 0.9s ease, transform 0.9s ease;
    }
    .poem-line.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Logo GOTY */
    .loader-logo {
      display: flex;
      align-items: flex-start;
      line-height: 1;
    }
    .loader-logo-text {
      font-family: 'Bebas Neue', 'DM Serif Display', sans-serif;
      font-size: clamp(7rem, 20vw, 14rem);
      color: #F5F0E8;
      letter-spacing: -0.01em;
      line-height: 0.85;
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 1.1s cubic-bezier(0.23,1,0.32,1),
                  transform 1.1s cubic-bezier(0.23,1,0.32,1);
    }
    .loader-logo-text.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .loader-logo-dot {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(4rem, 10vw, 8rem);
      color: #C9A84C;
      line-height: 0.75;
      margin-top: 0.15em;
      opacity: 0;
      transition: opacity 0.6s ease 0.7s;
      text-shadow: 0 0 30px rgba(201,168,76,0.5);
    }
    .loader-logo-dot.visible { opacity: 1; }

    /* Label */
    .loader-label {
      margin: 0;
      font-size: clamp(0.55rem, 1.2vw, 0.7rem);
      letter-spacing: 0.45em;
      text-transform: uppercase;
      color: #C9A84C;
      font-weight: 500;
      opacity: 0;
      transition: opacity 0.7s ease 0.9s;
    }
    .loader-label.visible { opacity: 1; }

    /* Counter — bas gauche, exactement comme Son Daven */
    .loader-counter {
      position: absolute;
      bottom: 2.5rem;
      left: 3rem;
      display: flex;
      align-items: baseline;
      gap: 0.1em;
      opacity: 0;
      transition: opacity 0.5s ease 1.2s;
    }
    .loader-counter.visible { opacity: 1; }
    .loader-pct {
      font-family: 'Bebas Neue', 'DM Serif Display', sans-serif;
      font-size: clamp(3.5rem, 8vw, 6rem);
      color: #F5F0E8;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .loader-pct-sym {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(1.5rem, 3vw, 2.2rem);
      color: #C9A84C;
      line-height: 1;
    }

    /* Status — bas droite */
    .loader-status-wrap {
      position: absolute;
      bottom: 2.5rem;
      right: 3rem;
      opacity: 0;
      transition: opacity 0.5s ease 1.3s;
    }
    .loader-status-wrap.visible { opacity: 1; }
    .loader-status {
      font-size: 0.6rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: rgba(245,240,232,0.35);
      font-weight: 500;
      transition: opacity 0.4s;
    }

    /* Skip */
    .loader-skip {
      position: absolute;
      top: 1.8rem;
      right: 2rem;
      background: none;
      border: none;
      color: rgba(245,240,232,0.3);
      font-size: 0.6rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      padding: 0.4rem 0.8rem;
      transition: color 0.3s;
      opacity: 0;
      transition: opacity 0.5s ease 2s, color 0.3s;
    }
    .loader-skip.visible { opacity: 1; }
    .loader-skip:hover { color: rgba(245,240,232,0.7); }

    /* Sortie : le rideau monte */
    #goty-loader.leaving {
      transform: translateY(-100%);
      transition: transform 0.85s cubic-bezier(0.77,0,0.175,1);
    }

    /* Mobile */
    @media (max-width: 600px) {
      .loader-counter { bottom: 1.5rem; left: 1.5rem; }
      .loader-status-wrap { bottom: 1.5rem; right: 1.5rem; }
      .loader-skip { top: 1rem; right: 1rem; }
      .poem-line { font-size: clamp(0.85rem, 4vw, 1.1rem); }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .poem-line, .loader-logo-text, .loader-logo-dot,
      .loader-label, .loader-counter, .loader-status-wrap,
      .loader-skip { transition: none; }
      #goty-loader.leaving { transition: none; }
    }
  `;

  document.head.appendChild(css);
  document.body.insertBefore(overlay, document.body.firstChild);

  /* ─── 3. CANVAS : fond animé (grille + scanlines + lueur centrale) ─── */
  (function initCanvas() {
    const canvas = document.getElementById('loader-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, raf;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    let t = 0;
    function drawFrame() {
      ctx.clearRect(0, 0, W, H);

      // Fond très sombre
      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, W, H);

      // Grille fine
      ctx.strokeStyle = 'rgba(201,168,76,0.04)';
      ctx.lineWidth = 0.5;
      const CELL = 60;
      for (let x = 0; x < W; x += CELL) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += CELL) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Lueur centrale dorée (pulse lent)
      const glowR = Math.min(W, H) * (0.35 + 0.05 * Math.sin(t * 0.6));
      const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, glowR);
      grd.addColorStop(0, 'rgba(201,168,76,0.07)');
      grd.addColorStop(0.5, 'rgba(201,168,76,0.02)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Scanlines horizontales (effet CRT subtil)
      for (let y = 0; y < H; y += 4) {
        const alpha = 0.025 + 0.015 * Math.sin((y + t * 80) * 0.05);
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.fillRect(0, y, W, 1);
      }

      // Ligne horizontale lumineuse qui traverse (comme un scanner)
      const scanY = (H * 0.5) + Math.sin(t * 0.4) * H * 0.3;
      const scanGrd = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scanGrd.addColorStop(0, 'transparent');
      scanGrd.addColorStop(0.5, 'rgba(201,168,76,0.04)');
      scanGrd.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrd;
      ctx.fillRect(0, scanY - 40, W, 80);

      t += 0.016;
      raf = requestAnimationFrame(drawFrame);
    }

    drawFrame();
    overlay._stopCanvas = () => { cancelAnimationFrame(raf); };
  })();

  /* ─── 4. ANIMATIONS D'ENTRÉE (séquencées avec setTimeout — pas de dépendance GSAP) ─── */
  const statuses = [
    'Loading the hierarchy',
    'Calibrating tiers',
    'Invoking the legends',
    'Sorting masterpieces',
    'Preparing the verdict',
    'Finalizing rankings',
  ];
  let statusIdx = 0;

  function cycleStatus() {
    const el = document.getElementById('loaderStatus');
    if (!el) return;
    statusIdx = (statusIdx + 1) % statuses.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = statuses[statusIdx];
      el.style.opacity = '1';
    }, 300);
  }
  el_status_interval = setInterval(cycleStatus, 2000);

  // Entrée séquencée
  setTimeout(() => {
    document.getElementById('poemLine1')?.classList.add('visible');
  }, 150);
  setTimeout(() => {
    document.getElementById('poemLine2')?.classList.add('visible');
  }, 450);
  setTimeout(() => {
    document.getElementById('loaderLogoText')?.classList.add('visible');
    document.querySelector('.loader-logo-dot')?.classList.add('visible');
    document.querySelector('.loader-label')?.classList.add('visible');
  }, 800);
  setTimeout(() => {
    document.querySelector('.loader-counter')?.classList.add('visible');
    document.querySelector('.loader-status-wrap')?.classList.add('visible');
    document.querySelector('.loader-skip')?.classList.add('visible');
  }, 1200);

  /* ─── 5. COUNTER ─── */
  let currentPct = 0;
  let targetPct  = 0;
  let pctRaf;

  function animatePct() {
    if (currentPct >= targetPct) return;
    currentPct += Math.max(0.5, (targetPct - currentPct) * 0.08);
    if (currentPct > targetPct) currentPct = targetPct;
    const el = document.getElementById('loaderPct');
    if (el) el.textContent = Math.floor(currentPct);
    pctRaf = requestAnimationFrame(animatePct);
  }

  function setProgress(pct) {
    targetPct = Math.min(100, Math.max(currentPct, pct));
    cancelAnimationFrame(pctRaf);
    animatePct();
  }

  // Simulation progression auto (sera complétée par l'app)
  setTimeout(() => setProgress(20), 600);
  setTimeout(() => setProgress(45), 1200);
  setTimeout(() => setProgress(70), 2000);

  /* ─── 6. SORTIE EN RIDEAU ─── */
  function dismiss(callback) {
    clearInterval(el_status_interval);
    cancelAnimationFrame(pctRaf);

    // Afficher 100% une fraction de seconde
    const pctEl = document.getElementById('loaderPct');
    if (pctEl) pctEl.textContent = '100';

    const statusEl = document.getElementById('loaderStatus');
    if (statusEl) {
      statusEl.textContent = 'Ready';
      statusEl.style.color = 'rgba(201,168,76,0.7)';
      statusEl.style.opacity = '1';
    }

    // Courte pause pour lire "100%" puis rideau
    setTimeout(() => {
      if (overlay._stopCanvas) overlay._stopCanvas();

      overlay.classList.add('leaving');

      // Après la transition CSS, révéler le contenu
      overlay.addEventListener('transitionend', () => {
        overlay.style.display = 'none';
        const app = document.querySelector('.app-wrapper');
        if (app) {
          app.style.transition = 'opacity 0.6s ease';
          app.style.opacity = '1';
        }
        if (typeof callback === 'function') callback();
      }, { once: true });

    }, 400);
  }

  /* ─── 7. API PUBLIQUE ─── */
  window.LoaderAPI = {
    setProgress,
    finish: dismiss,
  };

  /* ─── 8. SKIP ─── */
  document.getElementById('loaderSkip')?.addEventListener('click', () => dismiss());

  let el_status_interval; // déclarée avant usage dans cycleStatus

})();