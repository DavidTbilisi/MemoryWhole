// Uses DECK_LS_KEYS from state.js
const EDITOR_KEYS = DECK_LS_KEYS;

const EDITOR_TITLES = {
  major:         'Major System (0–99)',
  sem3:          'SEM3',
  months:        'Month Days (Georgian ABC)',
  clocks:        'Famous Clocks',
  calendar:      'Calendar Months (1–12)',
  bibleoverview: 'Bible Overview (10 Sections)',
  biblebooks:    'Bible Books (1–66)',
  binary:        'Binary 4-bit (0000–1111)',
  pao:           'PAO System (0–99)',
  pegmatrix:     'Peg Matrix (00–99)',
  pegmatrixru:   'Пег Матрица RU (00–99)',
};

// Uses DECK_BASE and loadDeckData from state.js

let editorDeck = 'major';

// Decks whose values are long phrases — use a single-column wide layout
const WIDE_DECKS = new Set(['clocks', 'bibleoverview', 'biblebooks', 'pao']);

function showEditor(deck) {
  editorDeck = deck || 'major';
  document.getElementById('editor-title').textContent = EDITOR_TITLES[editorDeck];
  const grid = document.getElementById('editor-grid');
  grid.dataset.mode = WIDE_DECKS.has(editorDeck) ? 'wide' : 'compact';
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

// ── Import ─────────────────────────────────────────────────────────────────
function importDeck(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);

      // Accept both the full export envelope {deck, data:{}} and a bare {key: value} object
      const incoming = (parsed.data && typeof parsed.data === 'object') ? parsed.data : parsed;

      // Validate: must be a flat key→string map
      const entries = Object.entries(incoming);
      if (entries.length === 0) throw new Error('No entries found');
      const invalid = entries.find(([, v]) => typeof v !== 'string');
      if (invalid) throw new Error(`Value for "${invalid[0]}" is not a string`);

      // Merge into current editor fields (imported value wins, preserves unmentioned keys)
      let applied = 0;
      entries.forEach(([key, val]) => {
        const input = document.querySelector(`.word-input[data-num="${key}"]`);
        if (input) { input.value = val.trim(); applied++; }
      });

      // Reset file input so same file can be re-imported if needed
      event.target.value = '';

      if (applied === 0) {
        showToast('No matching keys found');
      } else {
        showToast(`Imported ${applied} / ${entries.length} items — click Save to apply`);
      }
    } catch (err) {
      showToast('Import failed: ' + err.message);
      event.target.value = '';
    }
  };
  reader.readAsText(file);
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
