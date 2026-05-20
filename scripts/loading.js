// ===== LOADING SCREEN — Scan Reveal v6 =====
(function () {

  const overlay = document.createElement('div');
  overlay.id = 'goty-loader';
  overlay.innerHTML = `
    <canvas id="ldr-c"></canvas>
    <div class="ldr-vignette"></div>
    <div class="ldr-ui">
      <div class="ldr-counter"><span id="ldrPct">0</span><span class="ldr-sym">%</span></div>
      <div id="ldrStatus" class="ldr-status">Loading the hierarchy</div>
    </div>
    <button id="ldrSkip" class="ldr-skip">Skip ↗</button>
  `;

  const css = document.createElement('style');
  css.textContent = `
    .app-wrapper{opacity:0}
    #goty-loader{position:fixed;inset:0;background:#030303;z-index:99999;overflow:hidden}
    #ldr-c{position:absolute;inset:0;width:100%;height:100%}
    .ldr-vignette{position:absolute;inset:0;z-index:2;pointer-events:none;
      background:radial-gradient(ellipse 85% 85% at 50% 50%,transparent 25%,rgba(0,0,0,.45) 65%,rgba(0,0,0,.92) 100%)}
    .ldr-ui{position:absolute;bottom:2.5rem;left:0;right:0;z-index:3;
      display:flex;align-items:flex-end;justify-content:space-between;padding:0 3rem}
    .ldr-counter{display:flex;align-items:baseline;gap:.05em}
    #ldrPct{font-family:'Bebas Neue',sans-serif;font-size:clamp(3.5rem,8vw,5.5rem);
      color:#F5F0E8;letter-spacing:-.02em;line-height:1}
    .ldr-sym{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,3vw,2rem);color:#C9A84C}
    .ldr-status{font-size:.58rem;letter-spacing:.25em;text-transform:uppercase;
      color:rgba(245,240,232,.28);font-weight:500;text-align:right;transition:opacity .4s}
    .ldr-skip{position:absolute;top:1.8rem;right:2rem;background:none;border:none;
      color:rgba(245,240,232,.2);font-size:.58rem;letter-spacing:.2em;text-transform:uppercase;
      cursor:pointer;font-family:'Inter',sans-serif;padding:.4rem .8rem;z-index:3;
      opacity:0;animation:skipIn .5s ease 3s forwards}
    @keyframes skipIn{to{opacity:1}}
    .ldr-skip:hover{color:rgba(245,240,232,.6)}
    #goty-loader.leaving{transform:translateY(-100%);transition:transform .85s cubic-bezier(.77,0,.175,1)}
    @media(max-width:600px){.ldr-ui{padding:0 1.5rem;bottom:1.5rem}}
  `;
  document.head.appendChild(css);
  document.body.insertBefore(overlay, document.body.firstChild);

  /* ── Canvas setup ── */
  const c   = document.getElementById('ldr-c');
  const ctx = c.getContext('2d');
  let W, H;

  // Toutes les "lignes" à scanner — définies en % de H pour être responsive
  // Chaque ligne a : text, font, color or, yRatio, taille
  // Elles sont TOUTES invisibles par défaut, révélées ET masquées par le scan
  let lines = [];

  function buildLines() {
    const bb  = s => `${s}px "Bebas Neue",sans-serif`;
    const si  = s => `italic ${s}px "DM Serif Display",Georgia,serif`;
    const sp  = s => `600 ${s}px "Inter",sans-serif`;

    const logoS  = Math.min(H * 0.24, W * 0.20, 185);
    const poemS  = Math.min(W * 0.020, 19);
    const yearS  = Math.min(W * 0.038, 40);
    const tagS   = Math.min(W * 0.0068, 8);
    const subS   = Math.min(W * 0.011, 12);
    const lblS   = Math.min(W * 0.007, 8);

    lines = [
      { text:'Among the greatest games',       font:si(poemS), y:H*.32, gold:false },
      { text:'only a few deserve the throne',  font:si(poemS), y:H*.32 + poemS*1.7, gold:false },
      { text:'GOTY',    font:bb(logoS), y:H*.5 + logoS*.12,  gold:false, big:true },
      { text:'ÉDITION', font:sp(tagS),  y:H*.5 + logoS*.52,  gold:true,  ls:4 },
      { text:String(new Date().getFullYear()), font:bb(yearS), y:H*.5 + logoS*.52, gold:false },
      { text:'The definitive ranking', font:si(subS), y:H*.5 + logoS*.52, gold:false, dim:true },
      { text:'TIER LIST', font:sp(lblS), y:H*.5 + logoS*.75, gold:true, ls:7 },
    ];

    // Mesurer les largeurs pour aligner "ÉDITION — YEAR — sub" sur une ligne
    ctx.save();
    ctx.font = lines[4].font; // year (Bebas)
    const yw = ctx.measureText(lines[4].text).width;
    ctx.font = lines[3].font; // tag
    const tw = ctx.measureText(lines[3].text).width;
    ctx.font = lines[5].font; // sub
    const sw = ctx.measureText(lines[5].text).width;
    ctx.restore();

    const gap = Math.min(W * 0.015, 18);
    lines[3].x = W/2 - yw/2 - gap - tw/2;  // ÉDITION à gauche du year
    lines[4].x = W/2;                        // YEAR centré
    lines[5].x = W/2 + yw/2 + gap + sw/2;  // sub à droite du year
  }

  function resize() {
    W = c.width  = window.innerWidth;
    H = c.height = window.innerHeight;
    buildLines();
  }
  window.addEventListener('resize', resize);
  resize();

  /* ── Scan state ── */
  // Le scan fait UN seul passage de -SPREAD à H+SPREAD
  // Chaque ligne a une "fenêtre" de visibilité = [scanY - ZONE, scanY + ZONE]
  const ZONE  = 90;   // px de part et d'autre du scan qui révèle le texte
  const SPEED = 0.42;  // px/frame
  let scanY = -ZONE;
  let scanDone = false, appReady = false, dismissCalled = false, _cb = null;
  let canvasRaf;

  /* ── Draw ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Fond
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, W, H);

    // Grille dorée
    ctx.strokeStyle = 'rgba(201,168,76,.03)';
    ctx.lineWidth   = 0.5;
    for (let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
    for (let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}

    // Lueur centrale
    const gr = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.min(W,H)*.32);
    gr.addColorStop(0,'rgba(201,168,76,.05)');
    gr.addColorStop(1,'transparent');
    ctx.fillStyle = gr;
    ctx.fillRect(0,0,W,H);

    // Scanlines CRT
    for(let y=0;y<H;y+=4){
      ctx.fillStyle=`rgba(0,0,0,.02)`;
      ctx.fillRect(0,y,W,1);
    }

    /* ── Ligne de scan ── */
    if (scanY >= -ZONE && scanY <= H + ZONE) {
      // Bande de lumière
      const sg = ctx.createLinearGradient(0, scanY-ZONE, 0, scanY+ZONE);
      sg.addColorStop(0,   'transparent');
      sg.addColorStop(0.35,'rgba(201,168,76,.06)');
      sg.addColorStop(0.5, 'rgba(201,168,76,.18)');
      sg.addColorStop(0.65,'rgba(201,168,76,.06)');
      sg.addColorStop(1,   'transparent');
      ctx.fillStyle = sg;
      ctx.fillRect(0, scanY-ZONE, W, ZONE*2);

      // Ligne nette
      ctx.strokeStyle = 'rgba(226,196,122,.70)';
      ctx.lineWidth   = 1.2;
      ctx.beginPath(); ctx.moveTo(0,scanY); ctx.lineTo(W,scanY); ctx.stroke();

      // Reflet sous la ligne (trail)
      const trail = ctx.createLinearGradient(0,scanY,0,scanY+30);
      trail.addColorStop(0,'rgba(201,168,76,.10)');
      trail.addColorStop(1,'transparent');
      ctx.fillStyle=trail; ctx.fillRect(0,scanY,W,30);
    }

    /* ── Textes — visibles UNIQUEMENT dans la fenêtre du scan ── */
    for (const line of lines) {
      const dist = Math.abs(line.y - scanY);
      // avant le scan : invisible; après le scan : reste affiché pleinement
      if (line.y > scanY + ZONE) continue;  // pas encore atteint
      const pastScan = line.y < scanY - ZONE;

      // Influence : 1 au centre, 0 aux bords (courbe douce)
      const inf = pastScan ? 1 : Math.pow(1 - dist / ZONE, 1.4);

      ctx.save();
      ctx.font         = line.font;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      if (line.ls) ctx.letterSpacing = line.ls + 'px';

      const x = line.x ?? W/2;

      // ── Même texture que le scan : glow doré intense ──
      // Couche 1 : halo large doré
      ctx.shadowColor = `rgba(201,168,76,${inf * .95})`;
      ctx.shadowBlur  = inf * 45;
      ctx.fillStyle   = `rgba(226,196,122,${inf * .55})`;
      ctx.fillText(line.text, x, line.y);

      // Couche 2 : halo serré plus lumineux
      ctx.shadowColor = `rgba(255,220,120,${inf * .7})`;
      ctx.shadowBlur  = inf * 18;
      ctx.fillStyle   = `rgba(240,210,140,${inf * .4})`;
      ctx.fillText(line.text, x, line.y);

      // Couche 3 : texte final — couleur réelle
      ctx.shadowColor = `rgba(201,168,76,${inf * .5})`;
      ctx.shadowBlur  = inf * 8;

      if (line.gold) {
        ctx.fillStyle = `rgba(201,168,76,${inf})`;
      } else if (line.dim) {
        ctx.fillStyle = `rgba(245,240,232,${inf * .55})`;
      } else {
        // Blanc chaud qui vire légèrement doré au centre du scan
        const warmth = inf * 40;
        ctx.fillStyle = `rgba(${245+warmth*.1|0},${240-warmth*.3|0},${232-warmth|0},${inf})`;
      }
      ctx.fillText(line.text, x, line.y);

      ctx.restore();
    }
  }

  /* ── Boucle ── */
  function loop() {
    if (scanY <= H + ZONE) {
      scanY += SPEED;
    } else if (!scanDone) {
      scanDone = true;
      if (appReady) _triggerDismiss();
    }
    draw();
    canvasRaf = requestAnimationFrame(loop);
  }
  loop();

  /* ── Counter ── */
  let cur=0, tgt=0, pRaf;
  function animPct() {
    if (cur>=tgt) return;
    cur = Math.min(tgt, cur + Math.max(.3,(tgt-cur)*.065));
    const el = document.getElementById('ldrPct');
    if (el) el.textContent = Math.floor(cur);
    pRaf = requestAnimationFrame(animPct);
  }
  function setProgress(p) { tgt=Math.min(100,Math.max(cur,p)); cancelAnimationFrame(pRaf); animPct(); }

  setTimeout(()=>setProgress(20), 400);
  setTimeout(()=>setProgress(48), 1300);
  setTimeout(()=>setProgress(75), 2400);
  setTimeout(()=>setProgress(92), 3800);

  /* ── Status cycling ── */
  const ST=['Loading the hierarchy','Calibrating tiers','Invoking the legends','Sorting masterpieces','Preparing the verdict','Finalizing rankings'];
  let si=0;
  const stInt=setInterval(()=>{
    const el=document.getElementById('ldrStatus'); if(!el)return;
    si=(si+1)%ST.length; el.style.opacity='0';
    setTimeout(()=>{el.textContent=ST[si];el.style.opacity='1'},300);
  },2200);

  /* ── Dismiss ── */
  function _triggerDismiss() {
    if (dismissCalled) return; dismissCalled=true;
    clearInterval(stInt); cancelAnimationFrame(pRaf);
    const pe=document.getElementById('ldrPct'); if(pe)pe.textContent='100';
    const se=document.getElementById('ldrStatus');
    if(se){se.textContent='Ready';se.style.color='rgba(201,168,76,.9)'}
    setTimeout(()=>{
      cancelAnimationFrame(canvasRaf);
      overlay.classList.add('leaving');
      overlay.addEventListener('transitionend',()=>{
        overlay.style.display='none';
        const app=document.querySelector('.app-wrapper');
        if(app){app.style.transition='opacity .6s ease';app.style.opacity='1'}
        if(typeof _cb==='function')_cb();
      },{once:true});
    },450);
  }

  /* ── API ── */
  window.LoaderAPI = {
    setProgress,
    finish(cb){ setProgress(100); appReady=true; _cb=cb; if(scanDone)_triggerDismiss(); }
  };
  setTimeout(()=>{appReady=true;if(scanDone)_triggerDismiss()},12000);
  document.getElementById('ldrSkip')?.addEventListener('click',()=>{
    appReady=true; scanDone=true; _triggerDismiss();
  });

})();