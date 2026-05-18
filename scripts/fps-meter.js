function startFPSMonitor() {
    let fps = 60;
    let lastTime = performance.now();
    let frames = 0;
    function updateFPS() {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            fps = frames;
            console.log(`📊 FPS : ${fps}`);
            frames = 0;
            lastTime = now;
        }
        requestAnimationFrame(updateFPS);
    }
    requestAnimationFrame(updateFPS);
}