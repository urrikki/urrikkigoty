// ===== LOADING SCREEN (particules dorées) - version lissée =====
(function() {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'loading-canvas';
  canvas.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; display:block;';
  overlay.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let particles = [];
  let phase = 0; // 0: aléatoire, 1: convergence, 2: dispersion
  let convergenceStart = 0;
  let textPoints = [];
  let animationId;
  
  const TARGET_TEXT = "GOTY";
  const PARTICLE_COUNT = 450; // légèrement plus pour plus de densité
  const CONVERGENCE_DURATION = 3200; // ms, plus lent et doux
  const FLOAT_SPEED = 0.6; // particules plus lentes
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  
  function initParticlesRandom() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * FLOAT_SPEED,
        vy: (Math.random() - 0.5) * FLOAT_SPEED,
        size: 1.5 + Math.random() * 4,
        alpha: 0.5 + Math.random() * 0.5,
        targetX: 0,
        targetY: 0,
      });
    }
  }
  
  function prepareTextPoints() {
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    // Taille du texte adaptative, avec une marge intérieure
    const maxWidth = canvas.width * 0.8;
    const fontSize = Math.min(180, maxWidth / 4.5);
    offCtx.fillStyle = 'white';
    offCtx.font = `800 ${fontSize}px 'Playfair Display', serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    // Centrer parfaitement
    offCtx.fillText(TARGET_TEXT, canvas.width/2, canvas.height/2);
    
    const imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const points = [];
    // Échantillonnage plus fin (step 3) pour plus de points
    const step = 3;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const idx = (y * canvas.width + x) * 4;
        if (data[idx] > 200) {
          points.push({ x, y });
        }
      }
    }
    if (points.length > particles.length) {
      // Réduire le nombre de points pour correspondre aux particules
      const stepPoints = Math.floor(points.length / particles.length);
      textPoints = points.filter((_, i) => i % stepPoints === 0);
    } else {
      textPoints = points;
    }
    console.log(`Text points générés : ${textPoints.length}`);
  }
  
  function assignTargetsToParticles() {
    for (let i = 0; i < particles.length; i++) {
      const target = textPoints[i % textPoints.length];
      if (target) {
        particles[i].targetX = target.x;
        particles[i].targetY = target.y;
      } else {
        // fallback vers le centre
        particles[i].targetX = canvas.width/2;
        particles[i].targetY = canvas.height/2;
      }
    }
  }
  
  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    // Couleur or très clair, étoilé
    ctx.fillStyle = `rgba(255, 235, 180, ${p.alpha})`;
    ctx.fill();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#FFD966';
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  function animate() {
    if (!ctx || !overlay) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (phase === 0) {
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // Rebords souples avec effet de retour (au lieu de télégraphe)
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        drawParticle(p);
      }
    } 
    else if (phase === 1) {
      const now = performance.now();
      let t = Math.min(1, (now - convergenceStart) / CONVERGENCE_DURATION);
      // easing easeOutExpo pour une arrivée très douce
      t = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      for (let p of particles) {
        p.x = p.x * (1 - t) + p.targetX * t;
        p.y = p.y * (1 - t) + p.targetY * t;
        drawParticle(p);
      }
      if (t >= 0.99 && phase === 1) {
        phase = 2;
        for (let p of particles) {
          p.vx = (Math.random() - 0.5) * 3.5;
          p.vy = (Math.random() - 0.5) * 3.5;
        }
        setTimeout(() => {
          overlay.style.transition = 'opacity 1s cubic-bezier(0.23, 1, 0.32, 1)';
          overlay.style.opacity = '0';
          setTimeout(() => {
            overlay.style.display = 'none';
            // Lancer les animations du site
            if (typeof initPremium === 'function') initPremium();
            if (typeof initEditorialTitle === 'function') initEditorialTitle();
          }, 1000);
        }, 2200);
      }
    }
    else if (phase === 2) {
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        drawParticle(p);
      }
    }
    
    animationId = requestAnimationFrame(animate);
  }
  
  resizeCanvas();
  initParticlesRandom();
  prepareTextPoints();
  
  setTimeout(() => {
    if (phase === 0) {
      phase = 1;
      convergenceStart = performance.now();
      assignTargetsToParticles();
    }
  }, 1800); // délai initial plus long pour profiter du mouvement aléatoire
  
  animate();
  
  // Skip link
  const skipLink = document.getElementById('skip-loading');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.style.transition = 'opacity 0.4s ease';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        if (typeof initPremium === 'function') initPremium();
        if (typeof initEditorialTitle === 'function') initEditorialTitle();
      }, 400);
    });
  }
})();