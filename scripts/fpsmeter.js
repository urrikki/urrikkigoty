// ===== FPS METER (admin only) =====
let fpsInterval = null;
let fpsDiv = null;

function createFPSMeter() {
    if (fpsDiv) return; // déjà existant
    fpsDiv = document.createElement('div');
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
        display: block;
    `;
    document.body.appendChild(fpsDiv);
    
    let fps = 60;
    let lastTime = performance.now();
    let frames = 0;
    
    function update() {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            fps = frames;
            fpsDiv.textContent = `FPS: ${fps}`;
            fpsDiv.style.color = fps >= 55 ? '#0f0' : (fps >= 30 ? '#ff0' : '#f00');
            frames = 0;
            lastTime = now;
        }
        fpsInterval = requestAnimationFrame(update);
    }
    update();
}

function destroyFPSMeter() {
    if (fpsInterval) {
        cancelAnimationFrame(fpsInterval);
        fpsInterval = null;
    }
    if (fpsDiv) {
        fpsDiv.remove();
        fpsDiv = null;
    }
}