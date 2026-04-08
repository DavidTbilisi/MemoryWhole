/**
 * Pure functions with no DOM/localStorage/global-state dependencies.
 * Exported as ES modules for unit testing.
 * The browser app also defines these functions in global scope (state.js,
 * analytics.js, quiz.js, router.js) so no browser-side import is needed.
 */

// ── quiz.js ────────────────────────────────────────────────────────────────
export function getMultiplier(streak) {
  if (streak >= 9) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

// ── state.js ───────────────────────────────────────────────────────────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {Array} pool   - array of [key, value] pairs
 * @param {Object} weights - { [key]: number }
 */
export function weightedRandom(pool, weights) {
  const total = pool.reduce((sum, [k]) => sum + (weights[k] || 1), 0);
  let r = Math.random() * total;
  for (const entry of pool) {
    r -= weights[entry[0]] || 1;
    if (r <= 0) return entry;
  }
  return pool[pool.length - 1];
}

/**
 * @param {string} key
 * @param {boolean} isCorrect
 * @param {number}  elapsed       - seconds
 * @param {Object}  weights       - mutated in place
 * @param {number[]} sessionTimes - response times so far
 */
export function updateWeight(key, isCorrect, elapsed, weights, sessionTimes) {
  const sessionAvg = sessionTimes.length
    ? sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length
    : 4;
  const slow = elapsed > sessionAvg * 1.5;
  const w = weights[key] || 1;

  if (!isCorrect)  weights[key] = Math.min(w * 2,   16);
  else if (slow)   weights[key] = Math.min(w * 1.3, 16);
  else             weights[key] = Math.max(w * 0.7,  1);
}

// ── analytics.js ───────────────────────────────────────────────────────────
/**
 * @param {{ attempts: number, accuracy: number }[]} items
 */
export function calculateMastery(items) {
  if (items.length === 0) return { masteredCount: 0, weakCount: 0, needWorkCount: 0, score: 0 };

  const mastered = items.filter(i => i.attempts >= 5 && i.accuracy >= 95);
  const weak     = items.filter(i => i.accuracy >= 75 && i.accuracy < 95);
  const needWork = items.filter(i => i.accuracy < 75 || i.attempts < 5);

  const maxScore     = items.length * 10;
  const currentScore = mastered.length * 10 + weak.length * 5;
  const percentScore = (currentScore / maxScore) * 100;

  return {
    masteredCount: mastered.length,
    weakCount:     weak.length,
    needWorkCount: needWork.length,
    score:         percentScore,
  };
}

/**
 * Mutates drillRecords in place. Returns { isNewBest, newRecords }.
 * @param {Object} drillRecords - the full records store (mutated)
 * @param {string} deck
 * @param {number} score
 * @param {number} correct
 * @param {number} wrong
 * @param {number} maxStreak
 */
export function recordDrillResult(drillRecords, deck, score, correct, wrong, maxStreak) {
  if (!drillRecords[deck]) {
    drillRecords[deck] = {
      bestScore: 0, bestAccuracy: 0, bestStreak: 0,
      mostCorrect: 0, totalDrills: 0, totalScore: 0,
      history: []
    };
  }

  const rec      = drillRecords[deck];
  const total    = correct + wrong;
  const accuracy = total > 0 ? parseFloat((correct / total * 100).toFixed(1)) : 0;
  const newRecords = [];

  if (score     > rec.bestScore)    { rec.bestScore    = score;    newRecords.push('score');    }
  if (accuracy  > rec.bestAccuracy) { rec.bestAccuracy = accuracy; newRecords.push('accuracy'); }
  if (maxStreak > rec.bestStreak)   { rec.bestStreak   = maxStreak; newRecords.push('streak'); }
  if (correct   > rec.mostCorrect)  { rec.mostCorrect  = correct;  newRecords.push('correct'); }

  rec.totalDrills++;
  rec.totalScore += score;
  rec.history.unshift({ ts: Date.now(), score, correct, wrong, maxStreak });
  if (rec.history.length > 50) rec.history.length = 50;

  return { isNewBest: newRecords.length > 0, newRecords };
}

export const RANK_TIERS = [
  { rank: 'F',    min: 0     },
  { rank: 'E',    min: 80    },
  { rank: 'D',    min: 250   },
  { rank: 'C',    min: 600   },
  { rank: 'B',    min: 1400  },
  { rank: 'A',    min: 3000  },
  { rank: 'S',    min: 6000  },
  { rank: 'SS',   min: 11000 },
  { rank: 'SSS',  min: 20000 },
  { rank: 'SSS+', min: 35000 },
];

export function getRankTier(rankScore) {
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

/**
 * @param {Object}  activityLog - { 'YYYY-MM-DD': { drills, sessions } }
 * @param {string}  today       - 'YYYY-MM-DD'
 */
export function getActivityStreak(activityLog, today) {
  const d = new Date(today);
  if (!activityLog[today] || (activityLog[today].drills + activityLog[today].sessions) === 0) {
    d.setDate(d.getDate() - 1);
  }
  let streak = 0;
  while (true) {
    const key = d.toISOString().slice(0, 10);
    const day = activityLog[key];
    if (!day || (day.drills + day.sessions) === 0) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/**
 * @param {'drill'|'session'} type
 * @param {Object} activityLog - mutated in place
 * @param {string} todayKey    - 'YYYY-MM-DD'
 */
export function logActivity(type, activityLog, todayKey) {
  if (!activityLog[todayKey]) activityLog[todayKey] = { drills: 0, sessions: 0, attempts: 0 };
  if (type === 'drill')   activityLog[todayKey].drills++;
  if (type === 'session') activityLog[todayKey].sessions++;
}

// ── Sync merge helpers ─────────────────────────────────────────────────────

/**
 * Merge allTimeStats per deck: for each deck, whichever side has more
 * totalAttempts wins for that deck. Returns { merged, needsPush }.
 * needsPush = true when local was ahead on at least one deck (should push to cloud).
 */
export function mergeAllTimeStats(local, cloud) {
  const merged = { ...local };
  let needsPush = false;
  let changed   = false;

  const allDecks = new Set([...Object.keys(local), ...Object.keys(cloud || {})]);
  allDecks.forEach(deck => {
    const l = local[deck];
    const c = (cloud || {})[deck];
    const lA = l?.totalAttempts || 0;
    const cA = c?.totalAttempts || 0;

    if (c && cA > lA) {
      merged[deck] = c;
      changed = true;
    } else if (lA > cA) {
      needsPush = true;
    }
  });

  return { merged, changed, needsPush };
}

/**
 * Merge deckStats per deck per item: for each deck, whichever side has more
 * total attempts for that deck wins. Returns { merged, needsPush }.
 */
export function mergeDeckStats(local, cloud) {
  const merged = { ...local };
  let needsPush = false;
  let changed   = false;

  const allDecks = new Set([...Object.keys(local), ...Object.keys(cloud || {})]);
  allDecks.forEach(deck => {
    const lItems = local[deck];
    const cItems = (cloud || {})[deck];
    const lTotal = lItems ? Object.values(lItems).reduce((s, i) => s + i.attempts, 0) : 0;
    const cTotal = cItems ? Object.values(cItems).reduce((s, i) => s + i.attempts, 0) : 0;

    if (cItems && cTotal > lTotal) {
      merged[deck] = cItems;
      changed = true;
    } else if (lTotal > cTotal) {
      needsPush = true;
    }
  });

  return { merged, changed, needsPush };
}

/**
 * Merge drill records per deck: take Math.max for all best-* fields,
 * combine histories (deduplicate by timestamp, newest first, cap 50).
 * Returns { merged, needsPush }.
 */
export function mergeDrillRecords(local, cloud) {
  const merged = { ...local };
  let needsPush = false;
  let changed   = false;

  const allDecks = new Set([...Object.keys(local), ...Object.keys(cloud || {})]);
  allDecks.forEach(deck => {
    const l = local[deck];
    const c = (cloud || {})[deck];

    if (!l && c)  { merged[deck] = c; changed = true; return; }
    if (l && !c)  { needsPush = true; return; }
    if (!l && !c) return;

    const mergedDeck = {
      bestScore:    Math.max(l.bestScore    || 0, c.bestScore    || 0),
      bestAccuracy: Math.max(l.bestAccuracy || 0, c.bestAccuracy || 0),
      bestStreak:   Math.max(l.bestStreak   || 0, c.bestStreak   || 0),
      mostCorrect:  Math.max(l.mostCorrect  || 0, c.mostCorrect  || 0),
      totalDrills:  Math.max(l.totalDrills  || 0, c.totalDrills  || 0),
      totalScore:   Math.max(l.totalScore   || 0, c.totalScore   || 0),
      history: mergeHistories(l.history || [], c.history || []),
    };

    if (JSON.stringify(mergedDeck) !== JSON.stringify(l)) {
      merged[deck] = mergedDeck;
      changed = true;
    }
  });

  return { merged, changed, needsPush: needsPush || changed };
}

/**
 * Merge two drill history arrays: deduplicate by ts, sort newest first, cap 50.
 */
export function mergeHistories(a, b) {
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

/**
 * Merge activity logs by date: for each date, take Math.max per counter.
 * This avoids double-counting when the same device syncs twice.
 * Returns merged log.
 */
export function mergeActivityLog(local, cloud) {
  const merged = { ...(cloud || {}) };

  for (const [date, day] of Object.entries(local)) {
    if (!merged[date]) {
      merged[date] = { ...day };
    } else {
      merged[date] = {
        drills:   Math.max(merged[date].drills   || 0, day.drills   || 0),
        sessions: Math.max(merged[date].sessions || 0, day.sessions || 0),
        attempts: Math.max(merged[date].attempts || 0, day.attempts || 0),
      };
    }
  }

  return merged;
}

// ── router.js ──────────────────────────────────────────────────────────────
export const ROUTES = [
  { pattern: /^\/home$/,               name: 'home'      },
  { pattern: /^\/dashboard\/([^/]+)$/, name: 'dashboard' },
  { pattern: /^\/quiz\/([^/]+)$/,      name: 'quiz'      },
  { pattern: /^\/stats$/,              name: 'stats'     },
  { pattern: /^\/editor\/([^/]+)$/,    name: 'editor'    },
  { pattern: /^\/preview\/([^/]+)$/,   name: 'preview'   },
];

export function matchRoute(hash) {
  const path = hash.replace(/^#/, '') || '/home';
  for (const route of ROUTES) {
    const m = path.match(route.pattern);
    if (m) return { name: route.name, deck: m[1] || null };
  }
  return null;
}

export function buildViewHash(viewName, deck) {
  const deckViews = ['dashboard', 'quiz-config', 'quiz', 'editor', 'preview'];
  if (deckViews.includes(viewName)) {
    const slug = viewName === 'quiz-config' ? 'quiz' : viewName;
    return '/' + slug + (deck ? '/' + deck : '');
  }
  return '/' + viewName;
}
