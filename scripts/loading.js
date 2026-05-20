// ===== LOADING SCREEN CINÉMATIQUE — GOTY EDITION v4 =====
(function () {

  /* ─── 1. HTML ─── */
  const overlay = document.createElement('div');
  overlay.id = 'goty-loader';
  overlay.innerHTML = `
    <canvas id="loader-canvas"></canvas>

    <!-- Tout le texte est dans ce canvas de texte — même plan que le scan -->
    <canvas id="loader-text-canvas"></canvas>

    <div class="loader-vignette"></div>
    <div class="loader-line-top"></div>

    <!-- Counter bas gauche — visible dès le départ -->
    <div class="loader-counter" id="loaderCounter">
      <span class="loader-pct" id="loaderPct">0</span><span class="loader-pct-sym">%</span>
    </div>

    <!-- Status bas droite — visible dès le départ -->
    <div class="loader-status-wrap" id="loaderStatusWrap">
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
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* Les deux canvas sont superposés plein écran */
    #loader-canvas,
    #loader-text-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    /* Le canvas texte est au-dessus */
    #loader-text-canvas { z-index: 2; }

    .loader-vignette {
      position: absolute;
      inset: 0;
      z-index: 3;
      background: radial-gradient(ellipse 80% 80% at 50% 50%,
        transparent 35%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.9) 100%);
      pointer-events: none;
    }

    .loader-line-top {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      z-index: 4;
      background: linear-gradient(90deg, transparent, #C9A84C 25%, #E2C47A 50%, #C9A84C 75%, transparent);
      animation: lineBreath 3s ease-in-out infinite;
    }
    @keyframes lineBreath { 0%,100%{opacity:.35} 50%{opacity:1} }

    /* Counter — visible dès le départ, z-index au-dessus */
    .loader-counter {
      position: absolute;
      bottom: 2.5rem;
      left: 3rem;
      display: flex;
      align-items: baseline;
      gap: 0.1em;
      z-index: 5;
      opacity: 1;
    }
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

    /* Status — visible dès le départ */
    .loader-status-wrap {
      position: absolute;
      bottom: 2.5rem;
      right: 3rem;
      z-index: 5;
      opacity: 1;
    }
    .loader-status {
      font-size: 0.58rem;
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
      color: rgba(245,240,232,0.2);
      font-size: 0.58rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      padding: 0.4rem 0.8rem;
      z-index: 5;
      opacity: 0;
      animation: fadeInSkip 0.6s ease 3s forwards;
    }
    @keyframes fadeInSkip { to { opacity: 1; } }
    .loader-skip:hover { color: rgba(245,240,232,0.7); }

    /* Rideau de sortie */
    #goty-loader.leaving {
      transform: translateY(-100%);
      transition: transform 0.85s cubic-bezier(0.77,0,0.175,1);
    }

    @media (max-width: 600px) {
      .loader-counter { bottom: 1.5rem; left: 1.5rem; }
      .loader-status-wrap { bottom: 1.5rem; right: 1.5rem; }
    }
  `;

  document.head.appendChild(css);
  document.body.insertBefore(overlay, document.body.firstChild);

  /* ─── 3. CANVAS PRINCIPAL (fond + scan) ─── */
  let canvasRaf;
  let appReady   = false;
  let scanDone   = false;
  let dismissCalled = false;
  let _dismissCallback = null;

  const bgCanvas  = document.getElementById('loader-canvas');
  const bgCtx     = bgCanvas.getContext('2d');
  const txtCanvas = document.getElementById('loader-text-canvas');
  const txtCtx    = txtCanvas.getContext('2d');

  let W, H;

  function resize() {
    W = bgCanvas.width  = txtCanvas.width  = window.innerWidth;
    H = bgCanvas.height = txtCanvas.height = window.innerHeight;
    buildTextLayout();
  }
  window.addEventListener('resize', resize);

  /* ─── 4. LAYOUT TEXTE (calculé une fois après resize) ─── */
  // Toutes les positions sont en coordonnées canvas absolues
  const layout = {};

  function buildTextLayout() {
    // Centre vertical
    const cy = H * 0.5;

    // Taille du logo GOTY
    const logoSize = Math.min(W * 0.22, H * 0.28, 200);

    layout.poem1  = { text: 'Among the greatest games',    x: W/2, y: cy - logoSize * 0.75 - 36, size: Math.min(W * 0.022, 22), alpha: 0 };
    layout.poem2  = { text: 'only a few deserve the throne', x: W/2, y: cy - logoSize * 0.75 - 8,  size: Math.min(W * 0.022, 22), alpha: 0 };
    layout.logo   = { text: 'GOTY',      x: W/2 - 10, y: cy + logoSize * 0.15, size: logoSize, alpha: 0 };
    layout.dot    = { text: '.',         x: W/2 + (logoSize * 2.05), y: cy + logoSize * 0.05, size: logoSize * 0.55, alpha: 0 };
    layout.year   = { text: String(new Date().getFullYear()), x: W/2, y: cy + logoSize * 0.45, size: Math.min(W * 0.045, 48), alpha: 0 };
    layout.tag    = { text: 'ÉDITION',   x: W/2 - Math.min(W * 0.045, 48) * 1.8, y: cy + logoSize * 0.45, size: Math.min(W * 0.008, 9), alpha: 0, spacing: 4 };
    layout.sub    = { text: 'The definitive ranking',        x: W/2 + Math.min(W * 0.045, 48) * 1.8, y: cy + logoSize * 0.45, size: Math.min(W * 0.012, 13), alpha: 0 };
    layout.label  = { text: 'TIER LIST', x: W/2, y: cy + logoSize * 0.72, size: Math.min(W * 0.008, 9), alpha: 0, spacing: 7 };
  }

  /* ─── 5. ANIMATION D'ENTRÉE DES TEXTES ─── */
  // Les textes "de base" (poèmes, logo, label) s'animent en entrée normalement
  // L'élément reveal (year/tag/sub) reste à 0 — le scan les révèle

  let entryStarted = false;
  function startEntryAnimation() {
    entryStarted = true;
    // Poem lines
    animateAlpha(layout.poem1, 0, 0.55, 900, 200);
    animateAlpha(layout.poem2, 0, 0.55, 900, 450);
    // Logo
    animateAlpha(layout.logo,  0, 1,    1100, 800);
    animateAlpha(layout.dot,   0, 1,    700,  1100);
    // Label
    animateAlpha(layout.label, 0, 0.5,  700,  1200);
    // year/tag/sub restent à 0 — le scan s'en charge
  }

  function animateAlpha(item, from, to, duration, delay) {
    setTimeout(() => {
      const start = performance.now();
      function step(now) {
        const p = Math.min(1, (now - start) / duration);
        item.alpha = from + (to - from) * easeOut(p);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* ─── 6. RENDU TEXTE SUR CANVAS (avec effet scan) ─── */
  // Le scan est une "lampe" qui éclaire les éléments reveal quand il passe dessus
  // Tous les textes ont la même texture : grain doré + glow

  function drawTextLayer(scanY) {
    txtCtx.clearRect(0, 0, W, H);

    // Pour chaque élément textuel, calculer l'influence du scan
    drawTextItem(txtCtx, layout.poem1,  scanY, 'serif-italic', 'rgba(245,240,232,VAR)');
    drawTextItem(txtCtx, layout.poem2,  scanY, 'serif-italic', 'rgba(245,240,232,VAR)');
    drawTextItem(txtCtx, layout.logo,   scanY, 'bebas',        'rgba(245,240,232,VAR)');
    drawTextItem(txtCtx, layout.dot,    scanY, 'bebas',        'rgba(201,168,76,VAR)');
    drawTextItem(txtCtx, layout.label,  scanY, 'spaced',       'rgba(201,168,76,VAR)');

    // Éléments reveal — leur alpha de base est 0, seul le scan les révèle
    drawRevealItem(txtCtx, layout.year,  scanY, 'bebas',        '#F5F0E8');
    drawRevealItem(txtCtx, layout.tag,   scanY, 'spaced',       '#C9A84C');
    drawRevealItem(txtCtx, layout.sub,   scanY, 'serif-italic', 'rgba(245,240,232,0.5)');
  }

  function getFont(style, size) {
    if (style === 'bebas')        return `${size}px "Bebas Neue", sans-serif`;
    if (style === 'serif-italic') return `italic ${size}px "DM Serif Display", Georgia, serif`;
    if (style === 'spaced')       return `600 ${size}px "Inter", sans-serif`;
    return `${size}px "Inter", sans-serif`;
  }

  // Calcule l'intensité du scan sur un élément (0 à 1)
  function scanInfluence(itemY, scanY, spread) {
    const dist = Math.abs(itemY - scanY);
    return dist < spread ? Math.pow(1 - dist / spread, 1.5) : 0;
  }

  function drawTextItem(ctx, item, scanY, style, colorTemplate) {
    if (item.alpha <= 0) return;

    const inf = scanInfluence(item.y, scanY, 120);

    // Couleur de base modulée par le scan (légère surbrillance)
    const alpha = item.alpha;
    const color = colorTemplate.replace('VAR', alpha.toFixed(3));

    ctx.save();
    ctx.font = getFont(style, item.size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (item.spacing) ctx.letterSpacing = item.spacing + 'px';

    if (inf > 0.01) {
      // Glow doré quand le scan passe
      ctx.shadowColor = `rgba(201,168,76,${inf * 0.9})`;
      ctx.shadowBlur  = inf * 30;
      // Teinter légèrement vers le doré
      const blend = inf * 0.45;
      const baseAlpha = alpha + (1 - alpha) * inf * 0.3;
      // Dessiner d'abord en doré (glow)
      ctx.fillStyle = `rgba(226,196,122,${blend * baseAlpha})`;
      ctx.fillText(item.text, item.x, item.y);
      ctx.shadowBlur = 0;
    }

    // Texte final
    ctx.shadowColor = inf > 0.01 ? `rgba(201,168,76,${inf * 0.5})` : 'transparent';
    ctx.shadowBlur  = inf > 0.01 ? inf * 15 : 0;
    ctx.fillStyle   = color;
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }

  function drawRevealItem(ctx, item, scanY, style, baseColor) {
    // Alpha piloté UNIQUEMENT par le scan (0 par défaut)
    const inf = scanInfluence(item.y, scanY, 100);
    if (inf <= 0.001) return;

    ctx.save();
    ctx.font = getFont(style, item.size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (item.spacing) ctx.letterSpacing = item.spacing + 'px';

    // Glow intense
    ctx.shadowColor = `rgba(201,168,76,${inf * 1.0})`;
    ctx.shadowBlur  = inf * 40;
    ctx.fillStyle   = `rgba(226,196,122,${inf * 0.5})`;
    ctx.fillText(item.text, item.x, item.y);

    ctx.shadowColor = `rgba(201,168,76,${inf * 0.6})`;
    ctx.shadowBlur  = inf * 18;
    ctx.fillStyle   = baseColor.includes('rgba')
      ? baseColor.replace(/[\d.]+\)$/, `${inf.toFixed(3)})`)
      : hexToRgba(baseColor, inf);
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }

  function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }

  /* ─── 7. BOUCLE PRINCIPALE ─── */
  let t      = 0;
  let scanY  = -80;
  const SCAN_SPEED = 1.6; // px/frame → ~6.5s sur 1080px

  resize(); // init layout
  setTimeout(startEntryAnimation, 100);

  function loop() {
    /* -- Fond -- */
    bgCtx.clearRect(0, 0, W, H);
    bgCtx.fillStyle = '#030303';
    bgCtx.fillRect(0, 0, W, H);

    // Grille dorée
    bgCtx.strokeStyle = 'rgba(201,168,76,0.032)';
    bgCtx.lineWidth   = 0.5;
    const CELL = 60;
    for (let x = 0; x < W; x += CELL) {
      bgCtx.beginPath(); bgCtx.moveTo(x,0); bgCtx.lineTo(x,H); bgCtx.stroke();
    }
    for (let y = 0; y < H; y += CELL) {
      bgCtx.beginPath(); bgCtx.moveTo(0,y); bgCtx.lineTo(W,y); bgCtx.stroke();
    }

    // Lueur centrale
    const gr = Math.min(W,H) * (0.3 + 0.04*Math.sin(t*0.5));
    const grd = bgCtx.createRadialGradient(W/2,H/2,0, W/2,H/2,gr);
    grd.addColorStop(0, 'rgba(201,168,76,0.055)');
    grd.addColorStop(1, 'transparent');
    bgCtx.fillStyle = grd;
    bgCtx.fillRect(0,0,W,H);

    // Scanlines CRT
    for (let y = 0; y < H; y += 4) {
      bgCtx.fillStyle = `rgba(0,0,0,${0.02 + 0.01*Math.sin((y+t*80)*0.05)})`;
      bgCtx.fillRect(0, y, W, 1);
    }

    /* -- Scan -- */
    if (scanY <= H + 80) {
      scanY += SCAN_SPEED;

      // Bande lumineuse
      const isNear = layout.year && Math.abs(scanY - layout.year.y) < 100;
      const intensity = isNear ? 0.20 : 0.07;
      const spread    = isNear ? 80   : 50;

      const sg = bgCtx.createLinearGradient(0, scanY-spread, 0, scanY+spread);
      sg.addColorStop(0,   'transparent');
      sg.addColorStop(0.45,`rgba(201,168,76,${intensity*0.3})`);
      sg.addColorStop(0.5, `rgba(201,168,76,${intensity})`);
      sg.addColorStop(0.55,`rgba(201,168,76,${intensity*0.3})`);
      sg.addColorStop(1,   'transparent');
      bgCtx.fillStyle = sg;
      bgCtx.fillRect(0, scanY-spread, W, spread*2);

      // Ligne nette
      bgCtx.strokeStyle = `rgba(226,196,122,${isNear ? 0.65 : 0.3})`;
      bgCtx.lineWidth   = isNear ? 1.5 : 1;
      bgCtx.beginPath();
      bgCtx.moveTo(0, scanY);
      bgCtx.lineTo(W, scanY);
      bgCtx.stroke();

    } else if (!scanDone) {
      scanDone = true;
      if (appReady) triggerDismiss();
    }

    /* -- Texte -- */
    drawTextLayer(scanY);

    t += 0.016;
    canvasRaf = requestAnimationFrame(loop);
  }

  loop();

  /* ─── 8. STATUS CYCLING ─── */
  const statuses = ['Loading the hierarchy','Calibrating tiers','Invoking the legends','Sorting masterpieces','Preparing the verdict','Finalizing rankings'];
  let statusIdx = 0;
  const statusInterval = setInterval(() => {
    const el = document.getElementById('loaderStatus');
    if (!el) return;
    statusIdx = (statusIdx + 1) % statuses.length;
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = statuses[statusIdx]; el.style.opacity = '1'; }, 300);
  }, 2200);

  /* ─── 9. COUNTER ─── */
  let currentPct = 0, targetPct = 0, pctRaf;

  function animatePct() {
    if (currentPct >= targetPct) return;
    currentPct = Math.min(targetPct, currentPct + Math.max(0.35, (targetPct-currentPct)*0.065));
    const el = document.getElementById('loaderPct');
    if (el) el.textContent = Math.floor(currentPct);
    pctRaf = requestAnimationFrame(animatePct);
  }

  function setProgress(pct) {
    targetPct = Math.min(100, Math.max(currentPct, pct));
    cancelAnimationFrame(pctRaf);
    animatePct();
  }

  // Auto-simulation
  setTimeout(() => setProgress(20),  400);
  setTimeout(() => setProgress(45),  1200);
  setTimeout(() => setProgress(72),  2200);
  setTimeout(() => setProgress(90),  3500);

  /* ─── 10. DISMISS ─── */
  function triggerDismiss() {
    if (dismissCalled) return;
    dismissCalled = true;
    dismiss(_dismissCallback);
  }

  function dismiss(callback) {
    clearInterval(statusInterval);
    cancelAnimationFrame(pctRaf);

    const pctEl = document.getElementById('loaderPct');
    if (pctEl) pctEl.textContent = '100';
    const stEl = document.getElementById('loaderStatus');
    if (stEl) { stEl.textContent = 'Ready'; stEl.style.color = 'rgba(201,168,76,0.8)'; }

    setTimeout(() => {
      cancelAnimationFrame(canvasRaf);
      overlay.classList.add('leaving');
      overlay.addEventListener('transitionend', () => {
        overlay.style.display = 'none';
        const app = document.querySelector('.app-wrapper');
        if (app) { app.style.transition = 'opacity 0.6s ease'; app.style.opacity = '1'; }
        if (typeof callback === 'function') callback();
      }, { once: true });
    }, 400);
  }

  /* ─── 11. API ─── */
  window.LoaderAPI = {
    setProgress,
    finish(callback) {
      setProgress(100);
      appReady = true;
      _dismissCallback = callback;
      if (scanDone) triggerDismiss();
    }
  };

  /* ─── 12. FALLBACK + SKIP ─── */
  setTimeout(() => { appReady = true; if (scanDone) triggerDismiss(); }, 10000);

  document.getElementById('loaderSkip')?.addEventListener('click', () => {
    appReady = true; scanDone = true; triggerDismiss();
  });

})();