// ── Shared mutable state ───────────────────────────────────────────────────
let activeDeck = 'major';
let data = {};
let score = { correct: 0, wrong: 0, streak: 0, times: [] };
let currentAnswer = '';
let currentNum = '';
let answering = false;
let questionStartTime = 0;
let timerInterval = null;
let numStats = {};
let weights = {}; // { key: number } — higher = appears more often
let isReplaying = false;
let replayQueue = [];

// ── Speed Drill state ──────────────────────────────────────────────────────
let isSpeedDrill  = false;
let drillScore    = 0;
let drillTimeLeft = 60;
let drillInterval = null;

// ── Per-deck localStorage keys ─────────────────────────────────────────────
const DECK_LS_KEYS = {
  major:         LS_KEY,            // 'majorSystemData_v2'
  sem3:          'sem3Edits_v1',
  months:        'monthsEdits_v1',
  clocks:        'clocksEdits_v1',
  calendar:      'calendarEdits_v1',
  bibleoverview: 'bibleOverviewEdits_v1',
  biblebooks:    'bibleBooksEdits_v1',
  binary:        'binaryEdits_v1',
  pao:           'paoEdits_v1',
};

const DECK_BASE = {
  major:         () => ({ ...DEFAULTS }),
  sem3:          () => ({ ...SEM3_DATA }),
  months:        () => ({ ...MONTHS_DATA }),
  clocks:        () => ({ ...CLOCKS_DATA }),
  calendar:      () => ({ ...CALENDAR_DATA }),
  bibleoverview: () => ({ ...BIBLE_OVERVIEW_DATA }),
  biblebooks:    () => ({ ...BIBLE_BOOKS_DATA }),
  binary:        () => ({ ...BINARY_DATA }),
  pao:           () => ({ ...PAO_DATA }),
};

// Load base data for a deck, overlaid with any user edits from localStorage.
function loadDeckData(deck) {
  const base = DECK_BASE[deck]?.() ?? {};
  const key  = DECK_LS_KEYS[deck];
  if (key) {
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      for (const [k, v] of Object.entries(stored)) {
        if (v && v.trim()) base[k] = v;
      }
    } catch (e) {}
  }
  return base;
}

// ── Data loading ───────────────────────────────────────────────────────────
function loadData() {
  data = loadDeckData('major');
}

// ── Weights (spaced-repetition-lite) ──────────────────────────────────────
function loadWeights(deck) {
  try {
    weights = JSON.parse(localStorage.getItem('weights_' + deck) || '{}');
  } catch (e) { weights = {}; }
}

function saveWeights(deck) {
  localStorage.setItem('weights_' + deck, JSON.stringify(weights));
  if (window.fbSave && window.fbUser) window.fbSave('weights_' + deck, weights);
}

// Pick a random entry from pool biased by weights[key] (higher = more likely).
function weightedRandom(pool) {
  const total = pool.reduce((sum, [k]) => sum + (weights[k] || 1), 0);
  let r = Math.random() * total;
  for (const entry of pool) {
    r -= weights[entry[0]] || 1;
    if (r <= 0) return entry;
  }
  return pool[pool.length - 1];
}

// Adjust weight for key after an answer.
//   Wrong             → ×2   (max 16)
//   Correct but slow  → ×1.3 (max 16)
//   Correct and fast  → ×0.7 (min 1)
function updateWeight(key, isCorrect, elapsed) {
  const sessionAvg = score.times.length
    ? score.times.reduce((a, b) => a + b, 0) / score.times.length
    : 4;                              // fallback threshold: 4 s
  const slow = elapsed > sessionAvg * 1.5;
  const w = weights[key] || 1;

  if (!isCorrect)     weights[key] = Math.min(w * 2,   16);
  else if (slow)      weights[key] = Math.min(w * 1.3, 16);
  else                weights[key] = Math.max(w * 0.7,  1);
}

// ── Utilities ──────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ── Navigation ─────────────────────────────────────────────────────────────
function setView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(name).classList.add('active');
}

function showHome() {
  document.getElementById('score-bar').classList.remove('visible');
  setView('home');
}

// ── Score bar ──────────────────────────────────────────────────────────────
function updateScoreBar() {
  document.getElementById('sc-correct').textContent = score.correct;
  document.getElementById('sc-wrong').textContent   = score.wrong;
  document.getElementById('sc-streak').textContent  = score.streak;
  const avg = score.times.length
    ? (score.times.reduce((a, b) => a + b, 0) / score.times.length).toFixed(1) + 's'
    : '—';
  document.getElementById('sc-avg').textContent = avg;
}
