// ===== LOADING SCREEN CINÉMATIQUE — GOTY EDITION v2 =====
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

      <!-- Élément central : révélé par le scan -->
      <div class="loader-reveal-wrap" id="loaderRevealWrap">
        <div class="loader-reveal-inner">
          <span class="reveal-tag">Édition</span>
          <span class="reveal-year">${new Date().getFullYear()}</span>
          <span class="reveal-sub">The definitive ranking</span>
        </div>
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

    /* ── Élément central révélé par le scan ── */
    .loader-reveal-wrap {
      position: relative;
      height: 3.5rem;
      overflow: hidden;
      margin: -0.2rem 0 0;
      pointer-events: none;
    }
    .loader-reveal-inner {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.5s ease, transform 0.5s ease;
      white-space: nowrap;
    }
    .loader-reveal-wrap.lit .loader-reveal-inner {
      opacity: 1;
      transform: translateY(0);
    }
    /* Masque de clip : ne s'affiche que dans la zone du scan */
    .loader-reveal-wrap::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg,
        transparent 0%,
        rgba(201,168,76,0.06) 50%,
        transparent 100%);
      pointer-events: none;
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
      color: rgba(245,240,232,0.4);
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

  /* ─── 3. CANVAS — grille + scan lumineux ─── */
  let canvasRaf;
  (function initCanvas() {
    const canvas = document.getElementById('loader-canvas');
    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    let t = 0;
    const revealWrap = document.getElementById('loaderRevealWrap');

    // Centre vertical approximatif de l'élément reveal (relatif à la fenêtre)
    function getRevealCenterY() {
      if (!revealWrap) return H * 0.5;
      const rect = revealWrap.getBoundingClientRect();
      return rect.top + rect.height / 2;
    }

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
      grd.addColorStop(0, 'rgba(201,168,76,0.06)');
      grd.addColorStop(0.6, 'rgba(201,168,76,0.015)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Scanlines CRT
      for (let y = 0; y < H; y += 4) {
        ctx.fillStyle = `rgba(0,0,0,${0.022 + 0.012 * Math.sin((y + t * 80) * 0.05)})`;
        ctx.fillRect(0, y, W, 1);
      }

      // ── Scan lumineux qui traverse de haut en bas en boucle ──
      // Amplitude couvre toute la hauteur sur ~6 secondes
      const period = 6; // secondes par passage
      const scanRatio = (t % period) / period;       // 0→1
      const scanY = scanRatio * (H + 120) - 60;      // -60 → H+60

      // Intensité maximale quand le scan est au centre (zone reveal)
      const revealCY = getRevealCenterY();
      const dist = Math.abs(scanY - revealCY);
      const isNearReveal = dist < 80;
      if (isNearReveal && revealWrap) {
        revealWrap.classList.add('lit');
      } else if (!isNearReveal && revealWrap) {
        revealWrap.classList.remove('lit');
      }

      // Bande lumineuse du scan — plus brillante près de l'élément reveal
      const scanIntensity = isNearReveal ? 0.18 : 0.07;
      const scanSpread    = isNearReveal ? 70    : 50;

      const scanGrd = ctx.createLinearGradient(0, scanY - scanSpread, 0, scanY + scanSpread);
      scanGrd.addColorStop(0,   'transparent');
      scanGrd.addColorStop(0.4, `rgba(201,168,76,${scanIntensity * 0.3})`);
      scanGrd.addColorStop(0.5, `rgba(201,168,76,${scanIntensity})`);
      scanGrd.addColorStop(0.6, `rgba(201,168,76,${scanIntensity * 0.3})`);
      scanGrd.addColorStop(1,   'transparent');
      ctx.fillStyle = scanGrd;
      ctx.fillRect(0, scanY - scanSpread, W, scanSpread * 2);

      // Ligne fine nette au centre du scan
      ctx.strokeStyle = `rgba(226,196,122,${isNearReveal ? 0.55 : 0.25})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(W, scanY);
      ctx.stroke();

      t += 0.016;
      canvasRaf = requestAnimationFrame(drawFrame);
    }

    drawFrame();
  })();

  /* ─── 4. STATUS CYCLING ─── */
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

  /* ─── 5. ENTRÉE SÉQUENCÉE ─── */
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

  /* ─── 6. COUNTER ─── */
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

  // Simulation auto-progression (l'app appellera LoaderAPI.finish() pour terminer)
  setTimeout(() => setProgress(25),  500);
  setTimeout(() => setProgress(50),  1300);
  setTimeout(() => setProgress(75),  2200);
  setTimeout(() => setProgress(90),  3200);

  /* ─── 7. SORTIE EN RIDEAU ─── */
  let dismissed = false;

  function dismiss(callback) {
    if (dismissed) return;
    dismissed = true;

    clearInterval(statusInterval);
    cancelAnimationFrame(pctRaf);

    // Affiche 100%
    const pctEl = document.getElementById('loaderPct');
    if (pctEl) pctEl.textContent = '100';
    const statusEl = document.getElementById('loaderStatus');
    if (statusEl) {
      statusEl.textContent = 'Ready';
      statusEl.style.color = 'rgba(201,168,76,0.8)';
      statusEl.style.opacity = '1';
    }

    // Courte pause puis rideau
    setTimeout(() => {
      cancelAnimationFrame(canvasRaf);
      overlay.classList.add('leaving');

      overlay.addEventListener('transitionend', () => {
        overlay.style.display = 'none';
        const app = document.querySelector('.app-wrapper');
        if (app) {
          app.style.transition = 'opacity 0.6s ease';
          app.style.opacity = '1';
        }
        if (typeof callback === 'function') callback();
      }, { once: true });

    }, 450);
  }

  /* ─── 8. FALLBACK : si l'app met trop de temps, on ferme quand même ─── */
  setTimeout(() => dismiss(), 8000);

  /* ─── 9. API ─── */
  window.LoaderAPI = { setProgress, finish: dismiss };

  /* ─── 10. SKIP ─── */
  document.getElementById('loaderSkip')
    ?.addEventListener('click', () => dismiss());

})();