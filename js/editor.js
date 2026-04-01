// Uses DECK_LS_KEYS from state.js
const EDITOR_KEYS = DECK_LS_KEYS;

const EDITOR_TITLES = {
  major:  'Major System (0–99)',
  sem3:   'SEM3',
  months: 'Month Days (Georgian ABC)',
  clocks: 'Famous Clocks',
};

// Uses DECK_BASE and loadDeckData from state.js

let editorDeck = 'major';

function showEditor(deck) {
  editorDeck = deck || 'major';
  document.getElementById('editor-title').textContent = EDITOR_TITLES[editorDeck];
  buildEditor(loadDeckData(editorDeck));
  setView('editor');
}

function buildEditor(editorData) {
  const grid = document.getElementById('editor-grid');
  grid.innerHTML = '';

  const entries = Object.entries(editorData).sort(([a], [b]) => {
    // numeric sort for major/months, string sort for sem3/clocks
    const na = parseFloat(a), nb = parseFloat(b);
    return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
  });

  entries.forEach(([key, val]) => {
    const row = document.createElement('div');
    row.className = 'editor-row';

    const badge = document.createElement('span');
    badge.className = 'num-badge';
    badge.textContent = key;

    const input = document.createElement('input');
    input.className = 'word-input';
    input.type = 'text';
    input.dataset.num = key;
    input.value = val || '';
    input.placeholder = '…';

    row.appendChild(badge);
    row.appendChild(input);
    grid.appendChild(row);
  });
}

function saveEditor() {
  const edits = {};
  document.querySelectorAll('.word-input').forEach(inp => {
    edits[inp.dataset.num] = inp.value.trim();
  });

  const key = EDITOR_KEYS[editorDeck] || LS_KEY;
  localStorage.setItem(key, JSON.stringify(edits));

  if (window.fbSave && window.fbUser) {
    window.fbSave(editorDeck + '_edits', edits);
  }

  // Reload global data so next quiz uses the updated values
  if (editorDeck === activeDeck) {
    data = loadDeckData(editorDeck);
  }

  showToast('Saved ✓');
}

// ── Export ─────────────────────────────────────────────────────────────────
function exportDeck(deck) {
  const merged = loadDeckData(deck);
  const stats  = (window.deckStats && window.deckStats[deck]) ? window.deckStats[deck] : {};

  const payload = {
    deck,
    exportedAt: new Date().toISOString(),
    data: merged,
    stats,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `mnemonic-${deck}-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported ✓');
}
