// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    const colors = { success: '#8DB58A', error: '#E8836E', info: '#5FA8A0', warning: '#E0A458' };
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    notif.style.setProperty('--notif-accent', colors[type] || colors.info);
    document.body.appendChild(notif);
    if (typeof animateNotification === 'function') animateNotification(notif);
    setTimeout(() => {
        if (typeof gsap !== 'undefined') {
            gsap.to(notif, { x: 60, opacity: 0, duration: 0.3, onComplete: () => notif.remove() });
        } else { notif.remove(); }
    }, 2500);
}

// ===== THEME =====
// Sombre par défaut. Le mode clair est la classe « theme-light » sur <body>.
const THEME_KEY = 'goty-theme';

function applyTheme(mode) {
    const isLight = mode === 'light';
    document.body.classList.toggle('theme-light', isLight);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* stockage indisponible */ }
    applyTheme(saved === 'light' ? 'light' : 'dark');
}

function toggleTheme() {
    const next = document.body.classList.contains('theme-light') ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* stockage indisponible */ }
}

// ===== PANELS =====
function togglePanel(id) {
    const panel = document.getElementById(id);
    const isVisible = panel.style.display !== 'none';
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    panel.style.display = isVisible ? 'none' : 'block';
}

// ===== SCROLL TO TOP =====
function initScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scrollTopBtn';
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollBtn.title = 'Retour en haut';
    scrollBtn.setAttribute('aria-label', 'Retour en haut de page');
    document.body.appendChild(scrollBtn);
    window.addEventListener('scroll', () => {
        scrollBtn.classList.toggle('visible', window.scrollY > 300);
    });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===== TITLE TRIPLE CLICK (admin secret) =====
function setupTitleClickListener() {
    let clicks = 0, timer;
    document.getElementById('siteTitle').addEventListener('click', () => {
        clicks++;
        if (clicks === 3) {
            clicks = 0;
            clearTimeout(timer);
            openModal('loginModal');
        } else {
            clearTimeout(timer);
            timer = setTimeout(() => clicks = 0, 500);
        }
    });
}