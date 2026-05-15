// ===== CONFIG AUTH =====
// Remplace cette URL par celle de ton service Railway une fois déployé
const AUTH_API = 'https://urrikkigoty-production.up.railway.app';

// ===== AUTH =====
function checkSavedAuth() {
    const token  = localStorage.getItem('adminToken');
    const expiry = parseInt(localStorage.getItem('adminTokenExpiry') || '0');

    if (!token || Date.now() >= expiry) {
        logout(true);
        return;
    }

    // Vérification du token côté serveur
    fetch(`${AUTH_API}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) activateAdminMode();
        else logout(true);
    })
    .catch(() => {
        // Serveur injoignable → accepter le token local si pas expiré
        if (Date.now() < expiry) activateAdminMode();
        else logout(true);
    });
}

async function login(pwd) {
    let data;
    try {
        const res = await fetch(`${AUTH_API}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        data = await res.json();
    } catch {
        throw new Error('Serveur injoignable. Réessaie dans quelques secondes.');
    }

    if (!data.ok) throw new Error(data.error || 'Erreur inconnue.');

    // Stocker le token signé (pas le mot de passe, pas le hash)
    localStorage.setItem('adminToken',       data.token);
    localStorage.setItem('adminTokenExpiry', data.expiry.toString());

    // Nettoyage des anciens clés (migration)
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminAuthExpiry');

    activateAdminMode();
    closeModal('loginModal');
    showNotification('Mode admin activé', 'success');
    return true;
}

function logout(silent) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminTokenExpiry');
    AppState.isAdminMode = false;
    updateAdminUI();
    if (!silent) showNotification('Déconnexion', 'info');
}

function activateAdminMode() {
    AppState.isAdminMode = true;
    updateAdminUI();
}

function updateAdminUI() {
    const badge    = document.getElementById('adminBadge');
    const controls = document.getElementById('adminControls');
    const editBtn  = document.getElementById('modalEditBtn');
    if (badge)    badge.style.display    = AppState.isAdminMode ? 'block'       : 'none';
    if (controls) controls.style.display = AppState.isAdminMode ? 'flex'        : 'none';
    if (editBtn)  editBtn.style.display  = AppState.isAdminMode ? 'inline-flex' : 'none';
}