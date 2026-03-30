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

// ── Data loading ───────────────────────────────────────────────────────────
// Always start from DEFAULTS; overlay with any non-empty user edits in localStorage.
function loadData() {
  data = { ...DEFAULTS };
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    try {
      const stored = JSON.parse(saved);
      for (const [k, v] of Object.entries(stored)) {
        if (Object.prototype.hasOwnProperty.call(stored, k)) data[k] = v;
      }
    } catch (e) {}
  }
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
