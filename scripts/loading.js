// ===== LOADING SCREEN CINÉMATIQUE — GOTY EDITION v3 =====
(function () {

  /* ─── 1. HTML ─── */
  const overlay = document.createElement('div');
  overlay.id = 'goty-loader';
  overlay.innerHTML = `
    <canvas id="loader-canvas"></canvas>
    <div class="loader-vignette"></div>
    <div class="loader-line-top"></div>

    <div class="loader-body">
      <p class="loader-poem">
        <span class="poem-line" id="poemLine1">Among the greatest games</span>
        <span class="poem-line" id="poemLine2">only a few deserve the throne</span>
      </p>

      <div class="loader-logo">
        <span class="loader-logo-text" id="loaderLogoText">GOTY</span>
        <span class="loader-logo-dot">.</span>
      </div>

      <!-- Élément central : INVISIBLE par défaut, révélé UNIQUEMENT par le scan -->
      <div class="loader-reveal-wrap" id="loaderRevealWrap">
        <span class="reveal-tag">Édition</span>
        <span class="reveal-year">${new Date().getFullYear()}</span>
        <span class="reveal-sub">The definitive ranking</span>
      </div>

      <p class="loader-label">Tier List</p>
    </div>

    <div class="loader-counter">
      <span class="loader-pct" id="loaderPct">0</span><span class="loader-pct-sym">%</span>
    </div>

    <div class="loader-status-wrap">
      <span class="loader-status" id="loaderStatus">Loading the hierarchy</span>
    </div>

    <button class="loader-skip" id="loaderSkip">Skip intro ↗</button>
  `;

  /* ─── 2. CSS ─── */
  const css = document.createElement('style');
  css.textContent = `
    .app-wrapper { opacity: 0; }

    #goty-loader {
      position: fixed;
      inset: 0;
      background: #030303;
      z-index: 99999;
      overflow: hidden;
      cursor: none;
      font-family: 'Inter', system-ui, sans-serif;
    }

    #loader-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .loader-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 80% at 50% 50%,
        transparent 35%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.92) 100%);
      pointer-events: none;
    }

    .loader-line-top {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, #C9A84C 25%, #E2C47A 50%, #C9A84C 75%, transparent);
      animation: lineBreath 3s ease-in-out infinite;
    }
    @keyframes lineBreath { 0%,100%{opacity:.35} 50%{opacity:1} }

    .loader-body {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
    }

    .loader-poem {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      margin: 0 0 0.5rem;
    }
    .poem-line {
      display: block;
      font-family: 'DM Serif Display', Georgia, serif;
      font-style: italic;
      font-size: clamp(0.95rem, 2.2vw, 1.4rem);
      color: rgba(245,240,232,0.55);
      letter-spacing: 0.02em;
      opacity: 0;
      transform: translateY(14px);
      transition: opacity 0.9s ease, transform 0.9s ease;
    }
    .poem-line.visible { opacity: 1; transform: translateY(0); }

    .loader-logo {
      display: flex;
      align-items: flex-start;
      line-height: 1;
    }
    .loader-logo-text {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(7rem, 20vw, 13rem);
      color: #F5F0E8;
      letter-spacing: -0.01em;
      line-height: 0.85;
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 1.1s cubic-bezier(0.23,1,0.32,1),
                  transform 1.1s cubic-bezier(0.23,1,0.32,1);
    }
    .loader-logo-text.visible { opacity: 1; transform: translateY(0); }

    .loader-logo-dot {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(4rem, 10vw, 7rem);
      color: #C9A84C;
      line-height: 0.75;
      margin-top: 0.18em;
      opacity: 0;
      transition: opacity 0.6s ease 0.6s;
    }
    .loader-logo-dot.visible { opacity: 1; }

    /* ── Élément reveal : INVISIBLE par défaut ── */
    .loader-reveal-wrap {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      opacity: 0;               /* invisible de base */
      transition: none;         /* PAS de transition CSS — géré par le canvas/JS */
      white-space: nowrap;
      pointer-events: none;
      margin: -0.2rem 0 0;
    }

    .reveal-tag {
      font-size: 0.55rem;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: #C9A84C;
      font-weight: 600;
    }
    .reveal-year {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(2rem, 5vw, 3rem);
      color: #F5F0E8;
      letter-spacing: 0.05em;
      line-height: 1;
    }
    .reveal-sub {
      font-family: 'DM Serif Display', serif;
      font-style: italic;
      font-size: 0.75rem;
      color: rgba(245,240,232,0.45);
      letter-spacing: 0.08em;
    }

    .loader-label {
      margin: 0.25rem 0 0;
      font-size: clamp(0.5rem, 1.1vw, 0.65rem);
      letter-spacing: 0.45em;
      text-transform: uppercase;
      color: #C9A84C;
      font-weight: 500;
      opacity: 0;
      transition: opacity 0.7s ease 0.8s;
    }
    .loader-label.visible { opacity: 1; }

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
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(3.5rem, 8vw, 5.5rem);
      color: #F5F0E8;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .loader-pct-sym {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(1.5rem, 3vw, 2rem);
      color: #C9A84C;
      line-height: 1;
    }

    .loader-status-wrap {
      position: absolute;
      bottom: 2.5rem;
      right: 3rem;
      opacity: 0;
      transition: opacity 0.5s ease 1.3s;
    }
    .loader-status-wrap.visible { opacity: 1; }
    .loader-status {
      font-size: 0.58rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: rgba(245,240,232,0.3);
      font-weight: 500;
      transition: opacity 0.4s;
    }

    .loader-skip {
      position: absolute;
      top: 1.8rem;
      right: 2rem;
      background: none;
      border: none;
      color: rgba(245,240,232,0.25);
      font-size: 0.58rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      padding: 0.4rem 0.8rem;
      opacity: 0;
      transition: opacity 0.5s ease 2.5s, color 0.3s;
    }
    .loader-skip.visible { opacity: 1; }
    .loader-skip:hover { color: rgba(245,240,232,0.7); }

    /* Rideau qui monte */
    #goty-loader.leaving {
      transform: translateY(-100%);
      transition: transform 0.85s cubic-bezier(0.77,0,0.175,1);
    }

    @media (max-width: 600px) {
      .loader-counter { bottom: 1.5rem; left: 1.5rem; }
      .loader-status-wrap { bottom: 1.5rem; right: 1.5rem; }
      .loader-skip { top: 1rem; right: 1rem; }
    }
  `;

  document.head.appendChild(css);
  document.body.insertBefore(overlay, document.body.firstChild);

  /* ─── 3. CANVAS ─── */
  let canvasRaf;
  let appReady = false;      // true quand l'app a chargé ses données
  let scanDone = false;      // true quand le scan a terminé son passage complet
  let dismissCalled = false;

  (function initCanvas() {
    const canvas = document.getElementById('loader-canvas');
    const ctx    = canvas.getContext('2d');
    let W, H;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const revealEl = document.getElementById('loaderRevealWrap');

    // Le scan démarre depuis le haut (-60px) et va jusqu'en bas (H+60px)
    // Une seule passe, pas de boucle
    let scanY = -60;
    const SCAN_SPEED = 1.8; // px par frame (~108px/s à 60fps) → ~6s pour traverser 1080px

    let t = 0;

    function drawFrame() {
      ctx.clearRect(0, 0, W, H);

      // Fond
      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, W, H);

      // Grille fine dorée
      ctx.strokeStyle = 'rgba(201,168,76,0.035)';
      ctx.lineWidth = 0.5;
      const CELL = 60;
      for (let x = 0; x < W; x += CELL) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += CELL) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Lueur centrale (pulse lent)
      const glowR = Math.min(W, H) * (0.3 + 0.04 * Math.sin(t * 0.5));
      const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, glowR);
      grd.addColorStop(0,   'rgba(201,168,76,0.06)');
      grd.addColorStop(0.6, 'rgba(201,168,76,0.015)');
      grd.addColorStop(1,   'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Scanlines CRT
      for (let y = 0; y < H; y += 4) {
        ctx.fillStyle = `rgba(0,0,0,${0.022 + 0.012 * Math.sin((y + t * 80) * 0.05)})`;
        ctx.fillRect(0, y, W, 1);
      }

      // ── Scan unique de haut en bas ──
      if (scanY <= H + 60) {
        scanY += SCAN_SPEED;

        // L'élément reveal : visible UNIQUEMENT quand le scan est à sa hauteur
        if (revealEl) {
          const rect     = revealEl.getBoundingClientRect();
          const centerY  = rect.top + rect.height / 2;
          const dist     = Math.abs(scanY - centerY);
          const REVEAL_ZONE = 90; // px de part et d'autre du centre

          if (dist < REVEAL_ZONE) {
            // Opacité proportionnelle à la proximité (0 → 1 → 0)
            const alpha = 1 - dist / REVEAL_ZONE;
            revealEl.style.opacity = alpha.toFixed(3);
          } else {
            revealEl.style.opacity = '0';
          }
        }

        // Intensité du scan : plus fort quand il croise l'élément reveal
        const revealCenterY = revealEl
          ? (revealEl.getBoundingClientRect().top + revealEl.getBoundingClientRect().height / 2)
          : H / 2;
        const dist2 = Math.abs(scanY - revealCenterY);
        const isNear = dist2 < 90;

        const intensity = isNear ? 0.22 : 0.08;
        const spread    = isNear ? 80   : 50;

        const scanGrd = ctx.createLinearGradient(0, scanY - spread, 0, scanY + spread);
        scanGrd.addColorStop(0,   'transparent');
        scanGrd.addColorStop(0.4, `rgba(201,168,76,${intensity * 0.35})`);
        scanGrd.addColorStop(0.5, `rgba(201,168,76,${intensity})`);
        scanGrd.addColorStop(0.6, `rgba(201,168,76,${intensity * 0.35})`);
        scanGrd.addColorStop(1,   'transparent');
        ctx.fillStyle = scanGrd;
        ctx.fillRect(0, scanY - spread, W, spread * 2);

        // Ligne nette du scan
        ctx.strokeStyle = `rgba(226,196,122,${isNear ? 0.6 : 0.28})`;
        ctx.lineWidth   = isNear ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(W, scanY);
        ctx.stroke();

      } else {
        // ── Le scan a terminé son passage ──
        if (revealEl) revealEl.style.opacity = '0'; // masquer l'élément reveal
        if (!scanDone) {
          scanDone = true;
          onScanComplete();
        }
      }

      t += 0.016;
      canvasRaf = requestAnimationFrame(drawFrame);
    }

    drawFrame();
  })();

  /* ─── 4. Quand le scan EST TERMINÉ ─── */
  function onScanComplete() {
    // Si l'app est déjà prête : on ferme
    if (appReady) {
      triggerDismiss();
    }
    // Sinon on attend que l'app appelle LoaderAPI.finish()
  }

  /* ─── 5. Quand L'APP EST PRÊTE ─── */
  function onAppReady(callback) {
    appReady = true;
    _dismissCallback = callback;
    // Si le scan est déjà terminé : on ferme
    if (scanDone) {
      triggerDismiss();
    }
    // Sinon on attend la fin du scan (onScanComplete s'en chargera)
  }

  let _dismissCallback = null;

  function triggerDismiss() {
    if (dismissCalled) return;
    dismissCalled = true;
    dismiss(_dismissCallback);
  }

  /* ─── 6. STATUS CYCLING ─── */
  const statuses = [
    'Loading the hierarchy',
    'Calibrating tiers',
    'Invoking the legends',
    'Sorting masterpieces',
    'Preparing the verdict',
    'Finalizing rankings',
  ];
  let statusIdx = 0;
  const statusInterval = setInterval(() => {
    const el = document.getElementById('loaderStatus');
    if (!el) return;
    statusIdx = (statusIdx + 1) % statuses.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = statuses[statusIdx];
      el.style.opacity = '1';
    }, 300);
  }, 2000);

  /* ─── 7. ENTRÉE SÉQUENCÉE ─── */
  setTimeout(() => document.getElementById('poemLine1')?.classList.add('visible'), 150);
  setTimeout(() => document.getElementById('poemLine2')?.classList.add('visible'), 420);
  setTimeout(() => {
    document.getElementById('loaderLogoText')?.classList.add('visible');
    document.querySelector('.loader-logo-dot')?.classList.add('visible');
    document.querySelector('.loader-label')?.classList.add('visible');
  }, 780);
  setTimeout(() => {
    document.querySelector('.loader-counter')?.classList.add('visible');
    document.querySelector('.loader-status-wrap')?.classList.add('visible');
  }, 1200);
  setTimeout(() => {
    document.querySelector('.loader-skip')?.classList.add('visible');
  }, 2500);

  /* ─── 8. COUNTER ─── */
  let currentPct = 0;
  let targetPct  = 0;
  let pctRaf;

  function animatePct() {
    if (currentPct >= targetPct) return;
    currentPct = Math.min(targetPct, currentPct + Math.max(0.4, (targetPct - currentPct) * 0.07));
    const el = document.getElementById('loaderPct');
    if (el) el.textContent = Math.floor(currentPct);
    pctRaf = requestAnimationFrame(animatePct);
  }

  function setProgress(pct) {
    targetPct = Math.min(100, Math.max(currentPct, pct));
    cancelAnimationFrame(pctRaf);
    animatePct();
  }

  // Simulation auto
  setTimeout(() => setProgress(25),  500);
  setTimeout(() => setProgress(50),  1300);
  setTimeout(() => setProgress(75),  2200);
  setTimeout(() => setProgress(90),  3200);

  /* ─── 9. SORTIE EN RIDEAU ─── */
  function dismiss(callback) {
    clearInterval(statusInterval);
    cancelAnimationFrame(pctRaf);

    const pctEl = document.getElementById('loaderPct');
    if (pctEl) pctEl.textContent = '100';
    const statusEl = document.getElementById('loaderStatus');
    if (statusEl) {
      statusEl.textContent = 'Ready';
      statusEl.style.color  = 'rgba(201,168,76,0.8)';
      statusEl.style.opacity = '1';
    }

    setTimeout(() => {
      cancelAnimationFrame(canvasRaf);
      overlay.classList.add('leaving');
      overlay.addEventListener('transitionend', () => {
        overlay.style.display = 'none';
        const app = document.querySelector('.app-wrapper');
        if (app) {
          app.style.transition = 'opacity 0.6s ease';
          app.style.opacity    = '1';
        }
        if (typeof callback === 'function') callback();
      }, { once: true });
    }, 400);
  }

  /* ─── 10. FALLBACK SÉCURITÉ (12s max) ─── */
  setTimeout(() => triggerDismiss(), 12000);

  /* ─── 11. API PUBLIQUE ─── */
  window.LoaderAPI = {
    setProgress,
    // L'app appelle finish() quand les données sont prêtes
    // Le loader attendra la fin du scan PUIS fermera
    finish: function(callback) {
      setProgress(100);
      onAppReady(callback);
    }
  };

  /* ─── 12. SKIP ─── */
  document.getElementById('loaderSkip')
    ?.addEventListener('click', () => {
      scanDone = true;   // forcer la fin du scan
      appReady = true;
      triggerDismiss();
    });

})();