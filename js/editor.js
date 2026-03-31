const EDITOR_KEYS = {
  major:  null,                // uses LS_KEY
  sem3:   'sem3Edits_v1',
  months: 'monthsEdits_v1',
  clocks: 'clocksEdits_v1',
};

const EDITOR_TITLES = {
  major:  'Major System (0–99)',
  sem3:   'SEM3',
  months: 'Month Days (Georgian ABC)',
  clocks: 'Famous Clocks',
};

// Get the base data for a deck (before user edits)
function getBaseData(deck) {
  switch (deck) {
    case 'sem3':   return { ...SEM3_DATA };
    case 'months': return { ...MONTHS_DATA };
    case 'clocks': return { ...CLOCKS_DATA };
    default:       return { ...DEFAULTS };
  }
}

// Load user overrides for a deck from localStorage
function loadEditorData(deck) {
  const base = getBaseData(deck);
  const key  = EDITOR_KEYS[deck] || LS_KEY;
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    for (const [k, v] of Object.entries(stored)) {
      if (v && v.trim()) base[k] = v;
    }
  } catch (e) {}
  return base;
}

let editorDeck = 'major';

function showEditor(deck) {
  editorDeck = deck || 'major';
  document.getElementById('editor-title').textContent = EDITOR_TITLES[editorDeck];
  const editorData = loadEditorData(editorDeck);
  buildEditor(editorData);
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

  // Reload global data if we edited the active deck
  if (editorDeck === 'major') {
    data = { ...DEFAULTS };
    for (const [k, v] of Object.entries(edits)) {
      if (v) data[k] = v;
    }
  }

  showToast('Saved ✓');
}

// ── Export ─────────────────────────────────────────────────────────────────
function exportDeck(deck) {
  const base  = getBaseData(deck);
  const key   = EDITOR_KEYS[deck] || LS_KEY;
  let edits   = {};
  try { edits = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}

  const merged = { ...base, ...Object.fromEntries(Object.entries(edits).filter(([, v]) => v && v.trim())) };
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
