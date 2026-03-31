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

// ── Data loading ───────────────────────────────────────────────────────────
// Always start from DEFAULTS; overlay with any non-empty user edits in localStorage.
function loadData() {
  data = { ...DEFAULTS };
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    try {
      const stored = JSON.parse(saved);
      for (const [k, v] of Object.entries(stored)) {
        if (v && v.trim()) data[k] = v;
      }
    } catch (e) {}
  }
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
