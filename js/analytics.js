// ── Persistent analytics across all sessions ──────────────────────────────
let allTimeStats = {};
let deckStats = {};

const ANALYTICS_KEY      = 'analytics_v1';
const DECK_ANALYTICS_KEY = 'deckStats_v1';
const DRILL_RECORDS_KEY  = 'drillRecords_v1';
const ACTIVITY_KEY       = 'activityLog_v1';

let drillRecords = {};
let activityLog  = {};

function loadAnalytics() {
  try {
    allTimeStats = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '{}');
    deckStats    = JSON.parse(localStorage.getItem(DECK_ANALYTICS_KEY) || '{}');
    loadDrillRecords();
    loadActivityLog();
  } catch (e) {
    allTimeStats = {};
    deckStats    = {};
    drillRecords = {};
    activityLog  = {};
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

// ── Drill Records ──────────────────────────────────────────────────────────
function loadDrillRecords() {
  try { drillRecords = JSON.parse(localStorage.getItem(DRILL_RECORDS_KEY) || '{}'); }
  catch (e) { drillRecords = {}; }
}

function saveDrillRecords() {
  localStorage.setItem(DRILL_RECORDS_KEY, JSON.stringify(drillRecords));
  if (window.fbSave && window.fbUser) window.fbSave('drillRecords', drillRecords);
}

function recordDrillResult(deck, score, correct, wrong, maxStreak) {
  if (!drillRecords[deck]) {
    drillRecords[deck] = {
      bestScore: 0, bestAccuracy: 0, bestStreak: 0,
      mostCorrect: 0, totalDrills: 0, totalScore: 0,
      history: []
    };
  }
  const rec   = drillRecords[deck];
  const total = correct + wrong;
  const accuracy = total > 0 ? parseFloat((correct / total * 100).toFixed(1)) : 0;
  const newRecords = [];

  if (score    > rec.bestScore)    { rec.bestScore    = score;    newRecords.push('score');    }
  if (accuracy > rec.bestAccuracy) { rec.bestAccuracy = accuracy; newRecords.push('accuracy'); }
  if (maxStreak > rec.bestStreak)  { rec.bestStreak   = maxStreak; newRecords.push('streak'); }
  if (correct  > rec.mostCorrect)  { rec.mostCorrect  = correct;  newRecords.push('correct'); }

  rec.totalDrills++;
  rec.totalScore += score;
  rec.history.unshift({ ts: Date.now(), score, correct, wrong, maxStreak });
  if (rec.history.length > 50) rec.history.length = 50;

  saveDrillRecords();
  return { isNewBest: newRecords.length > 0, newRecords };
}

// ── Activity Log ───────────────────────────────────────────────────────────
function loadActivityLog() {
  try { activityLog = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}'); }
  catch (e) { activityLog = {}; }
}

function saveActivityLog() {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activityLog));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function logActivity(type) {
  const key = todayKey();
  if (!activityLog[key]) activityLog[key] = { drills: 0, sessions: 0, attempts: 0 };
  if (type === 'drill')   activityLog[key].drills++;
  if (type === 'session') activityLog[key].sessions++;
  saveActivityLog();
}

function getActivityStreak() {
  let streak = 0;
  const d = new Date();
  // Start from today; if today has no activity, start from yesterday
  const todayStr = todayKey();
  if (!activityLog[todayStr]) d.setDate(d.getDate() - 1);
  while (true) {
    const key = d.toISOString().slice(0, 10);
    const day = activityLog[key];
    if (!day || (day.drills + day.sessions) === 0) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function renderActivityHeatmap(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const DAYS = 84; // 12 weeks
  const cells = [];
  const d = new Date();
  // Align to Sunday so grid lines up as weeks
  d.setDate(d.getDate() - (DAYS - 1));

  for (let i = 0; i < DAYS; i++) {
    const key = d.toISOString().slice(0, 10);
    const day = activityLog[key] || { drills: 0, sessions: 0, attempts: 0 };
    const total = day.drills + day.sessions;
    cells.push({ key, day, total });
    d.setDate(d.getDate() + 1);
  }

  const maxTotal = Math.max(...cells.map(c => c.total), 1);
  const colors = ['#1e2a3a', '#0f4c75', '#1b6ca8', '#3498db', '#06b6d4'];

  const grid = document.createElement('div');
  grid.className = 'activity-grid';

  cells.forEach(({ key, day, total }) => {
    const intensity = total === 0 ? 0 : Math.ceil((total / maxTotal) * 4);
    const cell = document.createElement('div');
    cell.className = 'activity-cell';
    cell.style.background = colors[intensity];
    cell.title = `${key} — ${day.drills} drills, ${day.sessions} sessions`;
    grid.appendChild(cell);
  });

  container.innerHTML = '';
  container.appendChild(grid);
}

// ── Rank System ────────────────────────────────────────────────────────────
const RANK_TIERS = [
  { rank: 'F',    min: 0,     color: '#6b7280' },
  { rank: 'E',    min: 80,    color: '#9ca3af' },
  { rank: 'D',    min: 250,   color: '#60a5fa' },
  { rank: 'C',    min: 600,   color: '#34d399' },
  { rank: 'B',    min: 1400,  color: '#fbbf24' },
  { rank: 'A',    min: 3000,  color: '#f97316' },
  { rank: 'S',    min: 6000,  color: '#f43f5e' },
  { rank: 'SS',   min: 11000, color: '#a78bfa' },
  { rank: 'SSS',  min: 20000, color: '#e879f9' },
  { rank: 'SSS+', min: 35000, color: null },  // animated gold
];

function calculateRankScore() {
  const allDecks = Object.keys(DECK_NAMES || {});
  let knowledgePoints = 0;
  let bestDrillSum    = 0;
  let totalAttempts   = 0;
  let totalCorrect    = 0;

  allDecks.forEach(deck => {
    // Knowledge points
    const items = getDeckStats(deck);
    items.forEach(item => {
      if (item.attempts >= 5 && parseFloat(item.accuracy) >= 95) knowledgePoints++;
    });
    // All-time accuracy
    const at = allTimeStats[deck];
    if (at) {
      totalAttempts += at.totalAttempts || 0;
      totalCorrect  += at.totalCorrect  || 0;
    }
    // Best drill score per deck
    const dr = drillRecords[deck];
    if (dr) bestDrillSum += dr.bestScore || 0;
  });

  const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts * 100) : 0;
  return Math.floor(
    (knowledgePoints * 10) +
    bestDrillSum +
    (overallAccuracy * totalAttempts / 50)
  );
}

function getRankTier(rankScore) {
  let current = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (rankScore >= tier.min) current = tier;
  }
  const idx  = RANK_TIERS.indexOf(current);
  const next = RANK_TIERS[idx + 1] || null;
  const progress = next
    ? Math.min(100, ((rankScore - current.min) / (next.min - current.min)) * 100)
    : 100;
  return { ...current, next, progress: parseFloat(progress.toFixed(1)), rankScore };
}

function renderRankBadge(beforeRank) {
  const rs   = calculateRankScore();
  const info = getRankTier(rs);
  const el   = document.getElementById('global-rank-badge');
  if (!el) return info;

  const isMax = !info.next;
  const isSSSPlus = info.rank === 'SSS+';

  const colorStyle = isSSSPlus
    ? 'background:linear-gradient(135deg,#ffd700,#ff8c00,#ffd700);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text'
    : `color:${info.color}`;

  const nextText = info.next
    ? `<span style="font-size:0.75rem;color:#6b7280">${info.progress.toFixed(0)}% to ${info.next.rank} · Score: ${rs.toLocaleString()}</span>`
    : `<span style="font-size:0.75rem;color:#ffd700">MAX RANK ACHIEVED · Score: ${rs.toLocaleString()}</span>`;

  el.innerHTML = `
    <div class="rank-badge-inner">
      <span class="rank-label">Rank</span>
      <span class="rank-value ${isSSSPlus ? 'rank-sss-plus' : ''}" style="${colorStyle}">${info.rank}</span>
      ${nextText}
    </div>
  `;

  return info;
}

// ── Session stats tracking ─────────────────────────────────────────────────
function recordSessionStats(deck, sessionNumStats) {
  if (!deckStats[deck]) deckStats[deck] = {};

  Object.entries(sessionNumStats).forEach(([num, stats]) => {
    if (!deckStats[deck][num]) {
      deckStats[deck][num] = { correct: 0, wrong: 0, totalTime: 0, attempts: 0 };
    }
    deckStats[deck][num].correct   += stats.correct;
    deckStats[deck][num].wrong     += stats.wrong;
    deckStats[deck][num].totalTime += stats.totalTime;
    deckStats[deck][num].attempts  += stats.attempts;
  });

  if (!allTimeStats[deck]) {
    allTimeStats[deck] = { totalSessions: 0, totalAttempts: 0, totalCorrect: 0, totalWrong: 0 };
  }
  const sessionTotal   = Object.values(sessionNumStats).reduce((s, x) => s + x.attempts, 0);
  const sessionCorrect = Object.values(sessionNumStats).reduce((s, x) => s + x.correct,  0);
  const sessionWrong   = Object.values(sessionNumStats).reduce((s, x) => s + x.wrong,    0);

  allTimeStats[deck].totalSessions++;
  allTimeStats[deck].totalAttempts += sessionTotal;
  allTimeStats[deck].totalCorrect  += sessionCorrect;
  allTimeStats[deck].totalWrong    += sessionWrong;

  logActivity('session');
  saveAnalytics();
}

// ── Deck stats helpers ─────────────────────────────────────────────────────
function getDeckStats(deck) {
  const stats = deckStats[deck] || {};
  const items = Object.entries(stats).map(([num, s]) => ({
    num,
    word: data[num],
    attempts: s.attempts,
    correct:  s.correct,
    wrong:    s.wrong,
    accuracy: s.attempts ? (s.correct / s.attempts * 100).toFixed(1) : '—',
    avgTime:  s.attempts ? (s.totalTime / s.attempts).toFixed(1) : '—',
    errorRate: s.attempts ? (s.wrong / s.attempts).toFixed(2) : 0,
  }));
  return items;
}

function calculateMastery(items) {
  if (items.length === 0) return { masteredCount: 0, weakCount: 0, needWorkCount: 0, score: 0 };

  const mastered  = items.filter(i => i.attempts >= 5 && i.accuracy >= 95);
  const weak      = items.filter(i => i.accuracy >= 75 && i.accuracy < 95);
  const needWork  = items.filter(i => i.accuracy < 75 || i.attempts < 5);

  const maxScore     = items.length * 10;
  const currentScore = mastered.length * 10 + weak.length * 5;
  const percentScore = (currentScore / maxScore) * 100;

  return { masteredCount: mastered.length, weakCount: weak.length, needWorkCount: needWork.length, score: percentScore, mastered, weak, needWork };
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function showDashboard(deck) {
  activeDeck = deck || activeDeck;
  loadAnalytics();

  const allTimeData = allTimeStats[activeDeck] || { totalSessions: 0, totalAttempts: 0, totalCorrect: 0, totalWrong: 0 };
  const deckItems   = getDeckStats(activeDeck);
  const mastery     = calculateMastery(deckItems);

  document.getElementById('dash-title').textContent = DECK_NAMES[activeDeck] || activeDeck;

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

  const weakItems = deckItems
    .filter(i => i.attempts > 0)
    .sort((a, b) => (a.correct / a.attempts) - (b.correct / b.attempts))
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

  // Speed Drill Records section
  const dr       = drillRecords[activeDeck];
  const dashDrill = document.getElementById('dash-drill');
  if (dashDrill) {
    if (!dr || dr.totalDrills === 0) {
      dashDrill.innerHTML = '<p style="color:#6b7280;font-size:0.9rem;padding:0.5rem 0">No speed drills yet for this deck.</p>';
    } else {
      const last10   = dr.history.slice(0, 10);
      const avgLast10 = last10.length
        ? Math.round(last10.reduce((s, e) => s + e.score, 0) / last10.length)
        : 0;

      const histRows = last10.map(e => {
        const d2    = new Date(e.ts);
        const dateStr = d2.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const tot   = e.correct + e.wrong;
        const acc   = tot > 0 ? (e.correct / tot * 100).toFixed(1) : '—';
        return `<tr>
          <td>${dateStr}</td>
          <td style="color:#f59e0b;font-weight:700">${e.score}</td>
          <td>${acc}%</td>
          <td style="color:#f59e0b">${e.maxStreak}</td>
          <td style="color:#10b981">${e.correct}</td>
          <td style="color:#ef4444">${e.wrong}</td>
        </tr>`;
      }).join('');

      dashDrill.innerHTML = `
        <div class="dashboard-grid" style="margin-bottom:1rem">
          <div class="stat-card">
            <div class="stat-num" style="color:#f59e0b">${dr.bestScore}</div>
            <div class="lbl">Best Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-num" style="color:#10b981">${dr.bestAccuracy}%</div>
            <div class="lbl">Best Accuracy</div>
          </div>
          <div class="stat-card">
            <div class="stat-num" style="color:#f59e0b">${dr.bestStreak}</div>
            <div class="lbl">Best Streak</div>
          </div>
          <div class="stat-card">
            <div class="stat-num" style="color:#10b981">${dr.mostCorrect}</div>
            <div class="lbl">Most Correct</div>
          </div>
          <div class="stat-card">
            <div class="stat-num" style="color:#a78bfa">${dr.totalDrills}</div>
            <div class="lbl">Total Drills</div>
          </div>
          <div class="stat-card">
            <div class="stat-num" style="color:#06b6d4">${avgLast10}</div>
            <div class="lbl">Avg (Last 10)</div>
          </div>
        </div>
        <table class="assoc-table" style="width:100%">
          <thead><tr>
            <th>Date</th><th>Score</th><th>Accuracy</th>
            <th>Streak</th><th style="color:#10b981">Correct</th><th style="color:#ef4444">Wrong</th>
          </tr></thead>
          <tbody>${histRows}</tbody>
        </table>
      `;
    }
  }

  setView('dashboard');
}

// ── Called after each quiz session ────────────────────────────────────────
function recordQuizSession(deck, sessionStats) {
  recordSessionStats(deck, sessionStats);
  refreshHomeMastery();
  refreshGlobalStats();
}

// ── Global stats bar ───────────────────────────────────────────────────────
function refreshGlobalStats() {
  const allDecks = ['major','sem3','months','clocks','pao','binary','calendar','bibleoverview','biblebooks','pegmatrix','pegmatrixru'];

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

  renderRankBadge();
  renderActivityHeatmap('activity-heatmap');

  const streak = getActivityStreak();
  const streakEl = document.getElementById('activity-streak');
  if (streakEl) {
    streakEl.textContent = streak > 0
      ? `🔥 ${streak} day streak`
      : 'Start your streak today!';
  }
}

// ── Cloud analytics sync ───────────────────────────────────────────────────
// Merges per deck: for each deck independently, the side with more attempts
// for that deck wins. This means Device A can be ahead on 'major' while
// Device B is ahead on 'sem3' — both sets of progress are preserved.
// fbSave is called at most once per data store after the full merge is done.
function loadAnalyticsFromCloud(cloudAll, cloudDeck) {
  // ── allTimeStats merge ────────────────────────────────────────────────────
  const allDecks = new Set([
    ...Object.keys(allTimeStats),
    ...Object.keys(cloudAll || {}),
  ]);
  let allChanged   = false;
  let allNeedsPush = false;

  allDecks.forEach(deck => {
    const local  = allTimeStats[deck];
    const cloud  = (cloudAll || {})[deck];
    const localA = local?.totalAttempts || 0;
    const cloudA = cloud?.totalAttempts || 0;

    if (cloud && cloudA > localA) {
      allTimeStats[deck] = cloud;
      allChanged = true;
    } else if (localA > cloudA) {
      allNeedsPush = true;
    }
  });

  if (allChanged)   localStorage.setItem(ANALYTICS_KEY, JSON.stringify(allTimeStats));
  if (allNeedsPush) window.fbSave?.('analytics', allTimeStats);

  // ── deckStats merge ───────────────────────────────────────────────────────
  const deckKeys = new Set([
    ...Object.keys(deckStats),
    ...Object.keys(cloudDeck || {}),
  ]);
  let deckChanged   = false;
  let deckNeedsPush = false;

  deckKeys.forEach(deck => {
    const localItems = deckStats[deck];
    const cloudItems = (cloudDeck || {})[deck];
    const localTotal = localItems ? Object.values(localItems).reduce((s, i) => s + i.attempts, 0) : 0;
    const cloudTotal = cloudItems ? Object.values(cloudItems).reduce((s, i) => s + i.attempts, 0) : 0;

    if (cloudItems && cloudTotal > localTotal) {
      deckStats[deck] = cloudItems;
      deckChanged = true;
    } else if (localTotal > cloudTotal) {
      deckNeedsPush = true;
    }
  });

  if (deckChanged)   localStorage.setItem(DECK_ANALYTICS_KEY, JSON.stringify(deckStats));
  if (deckNeedsPush) window.fbSave?.('deckStats', deckStats);

  refreshHomeMastery();
  refreshGlobalStats();
}
window.loadAnalyticsFromCloud = loadAnalyticsFromCloud;

// Merge drill records per deck: take the best records from each device,
// combine history by merging both arrays and deduplicating by timestamp.
// fbSave is called at most once after the full merge is complete.
function loadDrillRecordsFromCloud(cloudData) {
  if (!cloudData) {
    if (Object.keys(drillRecords).length > 0) window.fbSave?.('drillRecords', drillRecords);
    return;
  }

  const allDecks = new Set([...Object.keys(drillRecords), ...Object.keys(cloudData)]);
  let changed   = false;
  let needsPush = false;

  allDecks.forEach(deck => {
    const local = drillRecords[deck];
    const cloud = cloudData[deck];

    if (!local && cloud) { drillRecords[deck] = cloud; changed = true; return; }
    if (local && !cloud) { needsPush = true; return; }
    if (!local && !cloud) return;

    // Both exist — merge: take best of each field, combine histories
    const merged = {
      bestScore:    Math.max(local.bestScore    || 0, cloud.bestScore    || 0),
      bestAccuracy: Math.max(local.bestAccuracy || 0, cloud.bestAccuracy || 0),
      bestStreak:   Math.max(local.bestStreak   || 0, cloud.bestStreak   || 0),
      mostCorrect:  Math.max(local.mostCorrect  || 0, cloud.mostCorrect  || 0),
      totalDrills:  Math.max(local.totalDrills  || 0, cloud.totalDrills  || 0),
      totalScore:   Math.max(local.totalScore   || 0, cloud.totalScore   || 0),
      history: _mergeHistories(local.history || [], cloud.history || []),
    };

    if (JSON.stringify(merged) !== JSON.stringify(local)) {
      drillRecords[deck] = merged;
      changed = true;
    }
  });

  if (changed || needsPush) {
    localStorage.setItem(DRILL_RECORDS_KEY, JSON.stringify(drillRecords));
    window.fbSave?.('drillRecords', drillRecords);
  }
}

function _mergeHistories(a, b) {
  const seen = new Set();
  const combined = [...a, ...b].filter(entry => {
    if (seen.has(entry.ts)) return false;
    seen.add(entry.ts);
    return true;
  });
  combined.sort((x, y) => y.ts - x.ts);
  if (combined.length > 50) combined.length = 50;
  return combined;
}

window.loadDrillRecordsFromCloud = loadDrillRecordsFromCloud;

// ── Home mastery badges ────────────────────────────────────────────────────
function refreshHomeMastery() {
  const decks = ['major','sem3','months','clocks','pao','binary','calendar','bibleoverview','biblebooks','pegmatrix','pegmatrixru'];
  decks.forEach(deck => {
    const el = document.getElementById('mastery-' + deck);
    if (!el) return;
    const items   = getDeckStats(deck);
    const mastery = calculateMastery(items);
    const pct     = mastery.score.toFixed(0);
    const color   = mastery.score >= 80 ? '#10b981' : mastery.score >= 50 ? '#f59e0b' : '#ef4444';
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
