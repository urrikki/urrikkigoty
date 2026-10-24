// ===== INTRO — l'arche s'allume dans la serre =====
// Contrat utilisé par index.js : LoaderAPI.setProgress(p) et LoaderAPI.finish(cb).
(function () {
    const root = document.documentElement;
    root.classList.add('is-loading');

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MIN_MS = REDUCED ? 250 : 2400;   // durée minimale affichée
    const MAX_MS = 8000;                   // repli si les données tardent
    const startedAt = performance.now();
    const hasGsap = typeof gsap !== 'undefined';

    const overlay = document.createElement('div');
    overlay.id = 'goty-loader';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = `
        <div class="ldr-halo" aria-hidden="true"></div>
        <svg class="ldr-arch" viewBox="0 0 540 500" aria-hidden="true">
            <path pathLength="1" d="M50 480 V240 A220 220 0 0 1 490 240 V480"/>
        </svg>
        <div class="ldr-content">
            <div class="ldr-title" aria-hidden="true">${'GOTY'.split('').map(l => `<span>${l}</span>`).join('')}</div>
            <p class="ldr-sub">Classement personnel des meilleurs jeux</p>
        </div>
        <div class="ldr-foot">
            <div class="ldr-bar"><span id="ldrFill"></span></div>
            <p id="ldrStatus" class="ldr-status">Les lampes s'allument</p>
        </div>
        <button id="ldrSkip" class="ldr-skip" type="button">Passer</button>`;
    document.body.insertBefore(overlay, document.body.firstChild);

    const halo    = overlay.querySelector('.ldr-halo');
    const arch    = overlay.querySelector('.ldr-arch path');
    const letters = overlay.querySelectorAll('.ldr-title span');
    const sub     = overlay.querySelector('.ldr-sub');
    const foot    = overlay.querySelector('.ldr-foot');
    const fill    = overlay.querySelector('#ldrFill');
    const status  = overlay.querySelector('#ldrStatus');
    const skip    = overlay.querySelector('#ldrSkip');

    if (hasGsap && !REDUCED) {
        gsap.timeline()
            .from(halo,    { opacity: 0, scale: 0.6, duration: 1.8, ease: 'sine.out' })
            .fromTo(arch,  { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0.1)
            .from(letters, { y: 22, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 0.8)
            .from(sub,     { opacity: 0, y: 6, duration: 0.7, ease: 'power2.out' }, '-=0.3')
            .from(foot,    { opacity: 0, duration: 0.5, ease: 'power1.out' }, '-=0.2');
    } else {
        arch.style.strokeDashoffset = '0';
    }

    let progress = 0;
    let appReady = false;
    let skipping = false;
    let dismissed = false;
    let doneCb = null;

    function setProgress(p) {
        progress = Math.max(progress, Math.min(100, p));
        if (hasGsap) gsap.to(fill, { scaleX: progress / 100, duration: 0.6, ease: 'power2.out', overwrite: true });
        else fill.style.transform = `scaleX(${progress / 100})`;
    }

    function dismiss() {
        dismissed = true;
        status.textContent = 'Serre ouverte';
        const done = () => {
            overlay.remove();
            root.classList.remove('is-loading');
            if (typeof doneCb === 'function') doneCb();
        };
        if (hasGsap && !REDUCED) {
            gsap.to(overlay, { opacity: 0, filter: 'blur(6px)', duration: 0.7, ease: 'power2.inOut', onComplete: done });
        } else {
            done();
        }
    }

    function tryDismiss() {
        if (dismissed || !appReady) return;
        const elapsed = performance.now() - startedAt;
        if (!skipping && elapsed < MIN_MS) {
            setTimeout(tryDismiss, MIN_MS - elapsed);
            return;
        }
        dismiss();
    }

    window.LoaderAPI = {
        setProgress,
        finish(cb) {
            setProgress(100);
            doneCb = cb;
            appReady = true;
            // Si l'intro a déjà été passée, le callback doit tout de même partir.
            if (dismissed) { if (typeof cb === 'function') cb(); return; }
            tryDismiss();
        }
    };

    setProgress(8);
    setTimeout(() => { appReady = true; tryDismiss(); }, MAX_MS);
    skip.addEventListener('click', () => { skipping = true; appReady = true; tryDismiss(); });
})();
