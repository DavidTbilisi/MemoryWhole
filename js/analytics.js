// ── Persistent analytics across all sessions ──────────────────────────────
let allTimeStats = {};
let deckStats = {};

const ANALYTICS_KEY = 'analytics_v1';
const DECK_ANALYTICS_KEY = 'deckStats_v1';

function loadAnalytics() {
  try {
    allTimeStats = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '{}');
    deckStats = JSON.parse(localStorage.getItem(DECK_ANALYTICS_KEY) || '{}');
  } catch (e) {
    allTimeStats = {};
    deckStats = {};
  }
  refreshGlobalStats();
}

function saveAnalytics() {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(allTimeStats));
  localStorage.setItem(DECK_ANALYTICS_KEY, JSON.stringify(deckStats));
  if (window.fbSave && window.fbUser) {
    window.fbSave('analytics', allTimeStats);
    window.fbSave('deckStats', deckStats);
  }
}

// Track a quiz session result
function recordSessionStats(deck, sessionNumStats) {
  // Initialize deck if needed
  if (!deckStats[deck]) {
    deckStats[deck] = {};
  }

  // Update per-item stats
  Object.entries(sessionNumStats).forEach(([num, stats]) => {
    if (!deckStats[deck][num]) {
      deckStats[deck][num] = { correct: 0, wrong: 0, totalTime: 0, attempts: 0 };
    }
    deckStats[deck][num].correct += stats.correct;
    deckStats[deck][num].wrong += stats.wrong;
    deckStats[deck][num].totalTime += stats.totalTime;
    deckStats[deck][num].attempts += stats.attempts;
  });

  // Update all-time counters
  if (!allTimeStats[deck]) {
    allTimeStats[deck] = { totalSessions: 0, totalAttempts: 0, totalCorrect: 0, totalWrong: 0 };
  }
  const sessionTotal = Object.values(sessionNumStats).reduce((sum, s) => sum + s.attempts, 0);
  const sessionCorrect = Object.values(sessionNumStats).reduce((sum, s) => sum + s.correct, 0);
  const sessionWrong = Object.values(sessionNumStats).reduce((sum, s) => sum + s.wrong, 0);

  allTimeStats[deck].totalSessions++;
  allTimeStats[deck].totalAttempts += sessionTotal;
  allTimeStats[deck].totalCorrect += sessionCorrect;
  allTimeStats[deck].totalWrong += sessionWrong;

  saveAnalytics();
}

// Get accuracy stats for a deck
function getDeckStats(deck) {
  const stats = deckStats[deck] || {};
  const items = Object.entries(stats).map(([num, s]) => ({
    num,
    word: data[num],
    attempts: s.attempts,
    correct: s.correct,
    wrong: s.wrong,
    accuracy: s.attempts ? (s.correct / s.attempts * 100).toFixed(1) : '—',
    avgTime: s.attempts ? (s.totalTime / s.attempts).toFixed(1) : '—',
    errorRate: s.attempts ? (s.wrong / s.attempts).toFixed(2) : 0,
  }));
  return items;
}

// Calculate mastery: how close to 100% accuracy
function calculateMastery(items) {
  if (items.length === 0) return { masteredCount: 0, weakCount: 0, needWorkCount: 0, score: 0 };

  const mastered = items.filter(i => i.attempts >= 5 && i.accuracy >= 95); // 5+ attempts, 95%+ accuracy
  const weak = items.filter(i => i.accuracy >= 75 && i.accuracy < 95);
  const needWork = items.filter(i => i.accuracy < 75 || i.attempts < 5);

  const masteredScore = mastered.length * 10; // 10 pts per mastered
  const weakScore = weak.length * 5;          // 5 pts per weak
  const needWorkScore = needWork.length * 0;

  const maxScore = items.length * 10;
  const currentScore = masteredScore + weakScore + needWorkScore;
  const percentScore = maxScore > 0 ? (currentScore / maxScore * 100) : 0;

  return {
    masteredCount: mastered.length,
    weakCount: weak.length,
    needWorkCount: needWork.length,
    score: percentScore,
    mastered,
    weak,
    needWork,
  };
}

// Show dashboard with all-time stats
function showDashboard(deck) {
  activeDeck = deck || activeDeck;
  loadAnalytics();

  const allTimeData = allTimeStats[activeDeck] || { totalSessions: 0, totalAttempts: 0, totalCorrect: 0, totalWrong: 0 };
  const deckItems = getDeckStats(activeDeck);
  const mastery = calculateMastery(deckItems);

  // Title
  document.getElementById('dash-title').textContent = DECK_NAMES[activeDeck] || activeDeck;

  // Overall stats
  const overallAccuracy = allTimeData.totalAttempts
    ? (allTimeData.totalCorrect / allTimeData.totalAttempts * 100).toFixed(1)
    : 0;

  document.getElementById('dash-overall').innerHTML = `
    <div class="stat-card">
      <div class="stat-num">${allTimeData.totalSessions}</div>
      <div class="lbl">Sessions</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${allTimeData.totalAttempts}</div>
      <div class="lbl">Attempts</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${overallAccuracy}%</div>
      <div class="lbl">Overall Accuracy</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${mastery.score.toFixed(0)}%</div>
      <div class="lbl">Mastery Score</div>
    </div>
  `;

  // Mastery breakdown
  const masteryColor = mastery.score >= 80 ? '#10b981' : mastery.score >= 60 ? '#f59e0b' : '#ef4444';
  document.getElementById('dash-progress').innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;width:100%;max-width:500px">
      <div style="flex:1">
        <div style="background:#2d3748;height:12px;border-radius:6px;overflow:hidden">
          <div style="background:${masteryColor};height:100%;width:${mastery.score}%;transition:width 0.3s"></div>
        </div>
        <div style="font-size:0.8rem;color:#a0aec0;margin-top:0.5rem">${mastery.score.toFixed(1)}% to perfection</div>
      </div>
    </div>
  `;

  // Status breakdown
  document.getElementById('dash-status').innerHTML = `
    <div class="status-box good">
      <div class="status-val">${mastery.masteredCount}</div>
      <div class="status-lbl">Mastered</div>
      <div class="status-desc">95%+ accuracy, 5+ attempts</div>
    </div>
    <div class="status-box warning">
      <div class="status-val">${mastery.weakCount}</div>
      <div class="status-lbl">In Progress</div>
      <div class="status-desc">75-94% accuracy</div>
    </div>
    <div class="status-box bad">
      <div class="status-val">${mastery.needWorkCount}</div>
      <div class="status-lbl">Need Work</div>
      <div class="status-desc">&lt;75% accuracy</div>
    </div>
  `;

  // Weak areas table
  const weakItems = deckItems
    .filter(i => i.attempts > 0)
    .sort((a, b) => {
      const scoreA = (a.correct / a.attempts) * 100;
      const scoreB = (b.correct / b.attempts) * 100;
      return scoreA - scoreB;
    })
    .slice(0, 10);

  const weakHtml = weakItems.length
    ? weakItems.map(i => `
      <tr>
        <td class="row-head">${i.num}</td>
        <td>${i.word}</td>
        <td>${i.accuracy}%</td>
        <td>${i.attempts}</td>
        <td>${i.avgTime}s</td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:#6b7280">No practice sessions yet</td></tr>';

  document.getElementById('dash-weak-table').innerHTML = `
    <table class="assoc-table" style="width:100%;margin-top:0.5rem">
      <thead><tr><th class="row-head">Item</th><th>Word</th><th>Accuracy</th><th>Attempts</th><th>Avg Time</th></tr></thead>
      <tbody>${weakHtml}</tbody>
    </table>
  `;

  setView('dashboard');
}

// Called after each quiz session
function recordQuizSession(deck, sessionStats) {
  recordSessionStats(deck, sessionStats);
  refreshHomeMastery();
  refreshGlobalStats();
}

// ── Global stats bar ───────────────────────────────────────────────────────
function refreshGlobalStats() {
  const allDecks = ['major','sem3','months','clocks','pao','binary','calendar','bibleoverview','biblebooks'];

  let totalAttempts = 0, totalCorrect = 0, totalSessions = 0, knowledgePoints = 0;

  allDecks.forEach(deck => {
    const at = allTimeStats[deck];
    if (at) {
      totalAttempts += at.totalAttempts || 0;
      totalCorrect  += at.totalCorrect  || 0;
      totalSessions += at.totalSessions || 0;
    }
    const items = getDeckStats(deck);
    items.forEach(item => {
      if (item.attempts >= 5 && parseFloat(item.accuracy) >= 95) knowledgePoints++;
    });
  });

  const accuracy = totalAttempts > 0
    ? (totalCorrect / totalAttempts * 100).toFixed(1) + '%'
    : '—';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('gs-kp',       knowledgePoints);
  set('gs-acc',      accuracy);
  set('gs-sessions', totalSessions);
  set('gs-attempts', totalAttempts);
}

// ── Cloud analytics sync ───────────────────────────────────────────────────
// Called by firebase.js after sign-in to push/pull analytics from Firestore.
// Strategy: cloud wins if it has more attempts (trained on another device);
// otherwise push local data up to cloud.
function loadAnalyticsFromCloud(cloudAll, cloudDeck) {
  const localAttempts = Object.values(allTimeStats)
    .reduce((s, d) => s + (d?.totalAttempts || 0), 0);
  const cloudAttempts = Object.values(cloudAll || {})
    .reduce((s, d) => s + (d?.totalAttempts || 0), 0);

  if (cloudAll && cloudAttempts >= localAttempts) {
    // Cloud is ahead (or equal) — use cloud
    allTimeStats = cloudAll;
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(allTimeStats));
  } else if (Object.keys(allTimeStats).length > 0) {
    // Local is ahead — push up
    window.fbSave?.('analytics', allTimeStats);
  }

  if (cloudDeck && cloudAttempts >= localAttempts) {
    deckStats = cloudDeck;
    localStorage.setItem(DECK_ANALYTICS_KEY, JSON.stringify(deckStats));
  } else if (Object.keys(deckStats).length > 0) {
    window.fbSave?.('deckStats', deckStats);
  }

  refreshHomeMastery();
  refreshGlobalStats();
}
window.loadAnalyticsFromCloud = loadAnalyticsFromCloud;

// Render tiny mastery badge on each home card
function refreshHomeMastery() {
  const decks = ['major', 'sem3', 'months', 'clocks', 'pao', 'binary', 'calendar', 'bibleoverview', 'biblebooks'];
  decks.forEach(deck => {
    const el = document.getElementById('mastery-' + deck);
    if (!el) return;
    const items = getDeckStats(deck);
    const mastery = calculateMastery(items);
    const pct = mastery.score.toFixed(0);
    const color = mastery.score >= 80 ? '#10b981' : mastery.score >= 50 ? '#f59e0b' : '#ef4444';
    el.innerHTML = `
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#2d3748" stroke-width="4"/>
        <circle cx="22" cy="22" r="18" fill="none" stroke="${color}" stroke-width="4"
          stroke-dasharray="${(mastery.score / 100 * 113).toFixed(1)} 113"
          stroke-linecap="round"
          transform="rotate(-90 22 22)"/>
        <text x="22" y="27" text-anchor="middle" fill="${color}" font-size="10" font-weight="700">${pct}%</text>
      </svg>`;
  });
}
