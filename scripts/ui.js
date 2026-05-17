// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    const colors = { success: '#10b981', error: '#ef4444', info: '#6366f1', warning: '#f59e0b' };
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    notif.style.background = colors[type] || colors.info;
    document.body.appendChild(notif);
    if (typeof animateNotification === 'function') animateNotification(notif);
    setTimeout(() => {
        if (typeof gsap !== 'undefined') {
            gsap.to(notif, { x: 60, opacity: 0, duration: 0.3, onComplete: () => notif.remove() });
        } else { notif.remove(); }
    }, 2500);
}

// ===== THEME =====
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-theme');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggle').innerHTML = isDark
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
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