// ===== LOADING SCREEN (particules dorées) - VERSION DEBUG =====
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
  const PARTICLE_COUNT = 500;
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log("Canvas redimensionné:", canvas.width, "x", canvas.height);
  }
  window.addEventListener('resize', resizeCanvas);
  
  function initParticlesRandom() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        size: 2 + Math.random() * 4,
        alpha: 0.7 + Math.random() * 0.3,
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
    
    // Taille de police calculée dynamiquement
    let fontSize = 140;
    // On réduit tant que le texte dépasse 70% de la largeur ou 40% de la hauteur
    while (fontSize > 30) {
      offCtx.font = `800 ${fontSize}px 'Playfair Display', serif`;
      const metrics = offCtx.measureText(TARGET_TEXT);
      const textWidth = metrics.width;
      const textHeight = fontSize * 1.2; // approximation
      if (textWidth < canvas.width * 0.7 && textHeight < canvas.height * 0.4) {
        break;
      }
      fontSize -= 5;
    }
    console.log("Taille police choisie:", fontSize, "pour canvas", canvas.width, "x", canvas.height);
    
    offCtx.fillStyle = 'white';
    offCtx.font = `800 ${fontSize}px 'Playfair Display', serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(TARGET_TEXT, canvas.width / 2, canvas.height / 2);
    
    const imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const points = [];
    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const idx = (y * canvas.width + x) * 4;
        if (data[idx] > 200) {
          points.push({ x, y });
        }
      }
    }
    console.log("Points bruts détectés:", points.length);
    
    if (points.length === 0) {
      // Fallback : générer des points autour du centre
      for (let i = 0; i < 400; i++) {
        points.push({
          x: canvas.width/2 + (Math.random() - 0.5) * canvas.width * 0.5,
          y: canvas.height/2 + (Math.random() - 0.5) * canvas.height * 0.3
        });
      }
    }
    
    if (points.length > particles.length) {
      const step = Math.floor(points.length / particles.length);
      textPoints = points.filter((_, i) => i % step === 0);
    } else {
      textPoints = points;
    }
    console.log("Points cibles finaux:", textPoints.length);
  }
  
  function assignTargetsToParticles() {
    for (let i = 0; i < particles.length; i++) {
      const target = textPoints[i % textPoints.length];
      if (target) {
        particles[i].targetX = target.x;
        particles[i].targetY = target.y;
      } else {
        particles[i].targetX = canvas.width/2;
        particles[i].targetY = canvas.height/2;
      }
    }
  }
  
  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, '#FFF9C4');
    gradient.addColorStop(0.6, '#E5B83C');
    gradient.addColorStop(1, '#B88A1A');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#FFD700';
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
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        drawParticle(p);
      }
    } 
    else if (phase === 1) {
      const now = performance.now();
      let t = Math.min(1, (now - convergenceStart) / 3000);
      t = 1 - Math.pow(1 - t, 3); // easeOutCubic
      for (let p of particles) {
        p.x = p.x * (1 - t) + p.targetX * t;
        p.y = p.y * (1 - t) + p.targetY * t;
        drawParticle(p);
      }
      if (t >= 0.99 && phase === 1) {
        phase = 2;
        for (let p of particles) {
          p.vx = (Math.random() - 0.5) * 5;
          p.vy = (Math.random() - 0.5) * 5;
        }
        setTimeout(() => {
          overlay.style.transition = 'opacity 0.8s ease';
          overlay.style.opacity = '0';
          setTimeout(() => {
            overlay.style.display = 'none';
            if (typeof initPremium === 'function') initPremium();
            if (typeof initEditorialTitle === 'function') initEditorialTitle();
          }, 800);
        }, 2000);
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
  
  // On attend 5 secondes pour debug (vous aurez le temps d'ouvrir F12)
  setTimeout(() => {
    if (phase === 0) {
      phase = 1;
      convergenceStart = performance.now();
      assignTargetsToParticles();
    }
  }, 50000); // 5 secondes
  
  animate();
  
  // Skip link
  const skipLink = document.getElementById('skip-loading');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.style.transition = 'opacity 0.3s ease';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        if (typeof initPremium === 'function') initPremium();
        if (typeof initEditorialTitle === 'function') initEditorialTitle();
      }, 300);
    });
  }
})();