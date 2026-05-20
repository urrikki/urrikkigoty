// ===== LOADING SCREEN : poussière d'étoiles puis apparition du texte GOTY =====
(function() {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'loading-canvas';
  canvas.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; display:block;';
  overlay.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Créer l'élément texte qui apparaîtra
  const textDiv = document.createElement('div');
  textDiv.id = 'loading-text';
  textDiv.textContent = 'GOTY';
  textDiv.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    font-family: 'Playfair Display', serif;
    font-size: clamp(3rem, 12vw, 7rem);
    font-weight: 800;
    color: #E5B83C;
    text-shadow: 0 0 20px rgba(229,184,60,0.5);
    opacity: 0;
    transition: opacity 1s ease, transform 1s cubic-bezier(0.23, 1, 0.32, 1);
    pointer-events: none;
    z-index: 10;
    letter-spacing: 0.05em;
    white-space: nowrap;
  `;
  overlay.appendChild(textDiv);

  let particles = [];
  let phase = 0; // 0: aléatoire, 1: disparition des particules + apparition texte
  let animationId;
  
  const PARTICLE_COUNT = 400;
  
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
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        size: 2 + Math.random() * 4,
        alpha: 0.7 + Math.random() * 0.3,
      });
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
    ctx.shadowBlur = 6;
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
      // Mouvement aléatoire
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
      // Les particules s'éloignent vers les bords
      for (let p of particles) {
        p.x += p.vx * 1.5;
        p.y += p.vy * 1.5;
        // ne pas rebondir, elles sortent
        drawParticle(p);
      }
    }
    
    animationId = requestAnimationFrame(animate);
  }
  
  // Initialisation
  resizeCanvas();
  initParticlesRandom();
  animate();
  
  // Après 1.5 secondes, début de la transition
  setTimeout(() => {
    phase = 1; // les particules commencent à s'éloigner
    // Faire apparaître le texte
    textDiv.style.opacity = '1';
    textDiv.style.transform = 'translate(-50%, -50%) scale(1)';
    // Ajouter un effet de brillance progressive
    let glowIntensity = 0;
    const glowInterval = setInterval(() => {
      glowIntensity += 0.1;
      if (glowIntensity <= 1) {
        textDiv.style.textShadow = `0 0 ${20 + glowIntensity * 20}px rgba(229,184,60,${0.3 + glowIntensity * 0.5})`;
      } else {
        clearInterval(glowInterval);
      }
    }, 100);
  }, 1500);
  
  // Fermeture de l'overlay après que les particules soient parties
  setTimeout(() => {
    overlay.style.transition = 'opacity 0.8s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
      if (typeof initPremium === 'function') initPremium();
      if (typeof initEditorialTitle === 'function') initEditorialTitle();
    }, 800);
  }, 4500); // 1.5s + 3s pour l'éloignement
  
  // Skip link (optionnel)
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