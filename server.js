const express = require('express');
const crypto  = require('crypto');
const cors    = require('cors');

const app = express();
app.use(express.json());

// ── CORS : autorise uniquement ton domaine GitHub Pages ──
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
}));

// ── Rate limiting maison (en mémoire) ──
const attempts = new Map(); // ip → { count, blockedUntil }
const MAX_ATTEMPTS   = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 min

function isBlocked(ip) {
    const entry = attempts.get(ip);
    if (!entry) return false;
    if (entry.blockedUntil && Date.now() < entry.blockedUntil) return true;
    if (entry.blockedUntil && Date.now() >= entry.blockedUntil) {
        attempts.delete(ip);
        return false;
    }
    return false;
}

function registerFail(ip) {
    const entry = attempts.get(ip) || { count: 0, blockedUntil: null };
    entry.count++;
    if (entry.count >= MAX_ATTEMPTS) {
        entry.blockedUntil = Date.now() + BLOCK_DURATION;
        console.warn(`[AUTH] IP bloquée: ${ip} jusqu'à ${new Date(entry.blockedUntil).toISOString()}`);
    }
    attempts.set(ip, entry);
}

function registerSuccess(ip) {
    attempts.delete(ip);
}

// ── Hash SHA-384 ──
function sha384(str) {
    return crypto.createHash('sha384').update(str, 'utf8').digest('hex');
}

// ── POST /api/login ──
app.post('/api/login', (req, res) => {
    const ip  = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    const pwd = req.body?.password;

    if (isBlocked(ip)) {
        const entry = attempts.get(ip);
        const remaining = Math.ceil((entry.blockedUntil - Date.now()) / 60000);
        return res.status(429).json({ ok: false, error: `Trop de tentatives. Réessaie dans ${remaining} min.` });
    }

    if (!pwd || typeof pwd !== 'string') {
        return res.status(400).json({ ok: false, error: 'Mot de passe manquant.' });
    }

    const hash = sha384(pwd);
    const expected = process.env.ADMIN_HASH;

    if (!expected) {
        console.error('[AUTH] ADMIN_HASH non défini dans les variables d\'environnement !');
        return res.status(500).json({ ok: false, error: 'Erreur serveur.' });
    }

    // Comparaison en temps constant (évite timing attacks)
    const hashBuf     = Buffer.from(hash,     'hex');
    const expectedBuf = Buffer.from(expected, 'hex');

    if (hashBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hashBuf, expectedBuf)) {
        registerFail(ip);
        const entry = attempts.get(ip) || { count: 0 };
        const left  = MAX_ATTEMPTS - entry.count;
        return res.status(401).json({ ok: false, error: `Mot de passe incorrect. ${left} tentative${left > 1 ? 's' : ''} restante${left > 1 ? 's' : ''}.` });
    }

    registerSuccess(ip);

    // Token signé (HMAC) : payload + expiry
    const expiry  = Date.now() + 24 * 60 * 60 * 1000; // 24h
    const payload = `admin:${expiry}`;
    const secret  = process.env.TOKEN_SECRET;
    if (!secret) {
        console.error('[AUTH] TOKEN_SECRET non défini !');
        return res.status(500).json({ ok: false, error: 'Erreur serveur.' });
    }
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(JSON.stringify({ payload, signature })).toString('base64');

    res.json({ ok: true, token, expiry });
});

// ── POST /api/verify ──
app.post('/api/verify', (req, res) => {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ ok: false });

    try {
        const { payload, signature } = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        const secret   = process.env.TOKEN_SECRET;
        const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        // Vérification signature + expiry
        const sigBuf = Buffer.from(signature, 'hex');
        const expBuf = Buffer.from(expected,  'hex');
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
            return res.status(401).json({ ok: false, error: 'Token invalide.' });
        }

        const expiry = parseInt(payload.split(':')[1]);
        if (Date.now() > expiry) {
            return res.status(401).json({ ok: false, error: 'Session expirée.' });
        }

        res.json({ ok: true, expiry });
    } catch {
        res.status(400).json({ ok: false, error: 'Token malformé.' });
    }
});


// ═══════════════════════════════════════════
// GITHUB API — lecture/écriture de games.json
// ═══════════════════════════════════════════

const GITHUB_API   = 'https://api.github.com';
const GITHUB_REPO  = process.env.GITHUB_REPO;       // urrikki/urrikkigoty
const GITHUB_FILE  = process.env.GITHUB_FILE_PATH;  // data/games.json
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function githubHeaders() {
    return {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
    };
}

// Récupérer le SHA du fichier + son contenu actuel
async function getFileInfo() {
    const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
        headers: githubHeaders()
    });
    if (!res.ok) throw new Error(`GitHub GET error: ${res.status}`);
    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    return { sha: data.sha, content };
}

// Écrire le fichier sur GitHub
async function writeFile(games, sha, message) {
    const body = JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify({ games }, null, 2)).toString('base64'),
        sha
    });
    const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
        method: 'PUT',
        headers: githubHeaders(),
        body
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(`GitHub PUT error: ${res.status} — ${JSON.stringify(err)}`);
    }
    return res.json();
}

// Middleware : vérifie que la requête vient d'un admin authentifié
function requireAdmin(req, res, next) {
    const { token } = req.body || {};
    if (!token) return res.status(401).json({ ok: false, error: 'Token manquant.' });
    try {
        const { payload, signature } = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        const secret   = process.env.TOKEN_SECRET;
        const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const sigBuf   = Buffer.from(signature, 'hex');
        const expBuf   = Buffer.from(expected,  'hex');
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
            return res.status(401).json({ ok: false, error: 'Token invalide.' });
        }
        const expiry = parseInt(payload.split(':')[1]);
        if (Date.now() > expiry) return res.status(401).json({ ok: false, error: 'Session expirée.' });
        next();
    } catch {
        res.status(400).json({ ok: false, error: 'Token malformé.' });
    }
}

// ── GET /api/games — lire games.json depuis GitHub ──
app.get('/api/games', async (req, res) => {
    try {
        const { content } = await getFileInfo();
        res.json({ ok: true, games: content.games || [] });
    } catch (err) {
        console.error('[GAMES] Erreur lecture:', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── POST /api/games/add — ajouter un jeu ──
app.post('/api/games/add', requireAdmin, async (req, res) => {
    try {
        const game = req.body.game;
        if (!game?.name || !game?.year || !game?.rank) {
            return res.status(400).json({ ok: false, error: 'Données incomplètes.' });
        }
        const { sha, content } = await getFileInfo();
        const games = content.games || [];
        if (games.some(g => g.name.toLowerCase() === game.name.toLowerCase())) {
            return res.status(409).json({ ok: false, error: 'Ce jeu existe déjà.' });
        }
        games.push(game);
        await writeFile(games, sha, `➕ Ajout : ${game.name}`);
        res.json({ ok: true, games });
    } catch (err) {
        console.error('[GAMES] Erreur ajout:', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── POST /api/games/update — modifier un jeu ──
app.post('/api/games/update', requireAdmin, async (req, res) => {
    try {
        const { originalName, game } = req.body;
        const { sha, content } = await getFileInfo();
        const games = content.games || [];
        const idx = games.findIndex(g => g.name === originalName);
        if (idx === -1) return res.status(404).json({ ok: false, error: 'Jeu introuvable.' });
        games[idx] = game;
        await writeFile(games, sha, `✏️ Modif : ${game.name}`);
        res.json({ ok: true, games });
    } catch (err) {
        console.error('[GAMES] Erreur modif:', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── POST /api/games/delete — supprimer un jeu ──
app.post('/api/games/delete', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const { sha, content } = await getFileInfo();
        const games = (content.games || []).filter(g => g.name !== name);
        await writeFile(games, sha, `🗑️ Suppression : ${name}`);
        res.json({ ok: true, games });
    } catch (err) {
        console.error('[GAMES] Erreur suppression:', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── Health check ──
app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[AUTH] Serveur démarré sur le port ${PORT}`));