// ── Hash-based SPA router ──────────────────────────────────────────────────
// Gives each view a bookmarkable URL. Browser back/forward works.
// URLs: #/home  #/dashboard/major  #/quiz/major  #/stats  #/editor/major  #/preview/major

// Wrap setView so it updates the hash whenever a view is activated
(function () {
  const _origSetView = setView;
  setView = function (name) {
    _origSetView(name);
    _syncHash(name);
  };
})();

// Map view IDs → hash paths (using activeDeck where needed)
function _syncHash(viewName) {
  const deckViews = ['dashboard', 'quiz-config', 'quiz', 'editor', 'preview'];
  if (deckViews.includes(viewName)) {
    const deck = (typeof activeDeck !== 'undefined') ? activeDeck : '';
    const slug = viewName === 'quiz-config' ? 'quiz' : viewName;
    _setHash('/' + slug + (deck ? '/' + deck : ''));
  } else {
    _setHash('/' + viewName);
  }
}

let _suppressHashChange = false;
function _setHash(path) {
  const target = '#' + path;
  if (window.location.hash === target) return;
  _suppressHashChange = true;
  window.location.hash = path;
  // Let the event fire once, then clear the suppressor
  setTimeout(() => { _suppressHashChange = false; }, 50);
}

// ── Route definitions ──────────────────────────────────────────────────────
const ROUTES = [
  { pattern: /^\/home$/,                        handler: ()  => showHome() },
  { pattern: /^\/dashboard\/([^/]+)$/,           handler: (m) => showDashboard(m[1]) },
  { pattern: /^\/quiz\/([^/]+)$/,                handler: (m) => showQuizConfig(m[1]) },
  { pattern: /^\/stats$/,                        handler: ()  => { /* stats is pushed by JS */ } },
  { pattern: /^\/editor\/([^/]+)$/,              handler: (m) => showEditor(m[1]) },
  { pattern: /^\/preview\/([^/]+)$/,             handler: (m) => showPreview(m[1]) },
];

function _handleHash() {
  if (_suppressHashChange) return;
  const path = window.location.hash.replace(/^#/, '') || '/home';
  for (const route of ROUTES) {
    const m = path.match(route.pattern);
    if (m) {
      try { route.handler(m); } catch (e) { console.warn('Router:', e); }
      return;
    }
  }
  // Unknown hash — go home
  showHome();
}

window.addEventListener('hashchange', _handleHash);

// On first load: if there's a hash in the URL, navigate to it
window.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash && window.location.hash !== '#/home') {
    _handleHash();
  }
});

// Public navigate helper
window.navigate = function (path) {
  window.location.hash = path;
};
