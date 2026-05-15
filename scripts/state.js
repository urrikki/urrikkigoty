// ===== ÉTAT GLOBAL =====
const AppState = {
    games: [],
    filteredGames: [],
    isAdminMode: false,
    currentEditingGame: null,
    filters: { search: '', year: '', tier: '', favoritesOnly: false },
    sortBy: 'default',
    comparisonMode: false,
    selectedForComparison: [],
    currentView: 'tierlist'
};

const CONFIG = {
    TRISTAN: 'b53f3d5a331ac7ba157a9745e50ef88531f577d84ad1059ad287fdc26575161d62a154e1bc2a5143f24b4760846e49d6',
    ADMIN_SESSION_DURATION: 24 * 60 * 60 * 1000,
    STORAGE_KEY: 'gotyGamesData'
};

const DATA_PATH = 'data/games.json';

const TIERS = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'NP'];
const TIER_COLORS = {
    S: '#d97706', A: '#ef4444', B: '#10b981',
    C: '#3b82f6', D: '#8b5cf6', E: '#ec4899',
    F: '#6b7280', NP: '#94a3b8'
};
