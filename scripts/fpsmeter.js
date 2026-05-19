// ===== FPS METER (visible à l'écran) =====
(function() {
    let fps = 60;
    let lastTime = performance.now();
    let frames = 0;
    
    // Créer l'élément d'affichage
    const fpsDiv = document.createElement('div');
    fpsDiv.id = 'fps-counter';
    fpsDiv.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.7);
        color: #0f0;
        font-family: monospace;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        z-index: 9999;
        pointer-events: none;
        backdrop-filter: blur(4px);
    `;
    document.body.appendChild(fpsDiv);
    
    function updateFPS() {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            fps = frames;
            fpsDiv.textContent = `FPS: ${fps}`;
            // Couleur selon performance
            if (fps >= 55) fpsDiv.style.color = '#0f0';
            else if (fps >= 30) fpsDiv.style.color = '#ff0';
            else fpsDiv.style.color = '#f00';
            frames = 0;
            lastTime = now;
        }
        requestAnimationFrame(updateFPS);
    }
    requestAnimationFrame(updateFPS);
    console.log('✅ FPS Meter actif (affichage en bas à gauche)');
})();