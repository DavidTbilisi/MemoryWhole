import { readJson, writeJson } from './storage'

export const ANALYTICS_KEY = 'analytics_v1'
export const DECK_STATS_KEY = 'deckStats_v1'
export const MASTERY_PEAK_KEY = 'masteryPeak_v1'
export const ACTIVITY_LOG_KEY = 'activityLog_v1'
export const DRILL_RECORDS_KEY = 'drillRecords_v1'

function sumBy(items, field) {
  return Object.values(items || {}).reduce((acc, cur) => acc + Number(cur?.[field] || 0), 0)
}

export function recordSession(deck, numStats) {
  const analytics = readJson(ANALYTICS_KEY, {})
  const deckAnalytics = analytics[deck] || { totalSessions: 0, totalAttempts: 0, totalCorrect: 0, totalWrong: 0 }

  const attempts = sumBy(numStats, 'attempts')
  const correct = sumBy(numStats, 'correct')
  const wrong = sumBy(numStats, 'wrong')

  deckAnalytics.totalSessions += 1
  deckAnalytics.totalAttempts += attempts
  deckAnalytics.totalCorrect += correct
  deckAnalytics.totalWrong += wrong
  analytics[deck] = deckAnalytics
  writeJson(ANALYTICS_KEY, analytics)

  const deckStats = readJson(DECK_STATS_KEY, {})
  deckStats[deck] = deckStats[deck] || {}
  for (const [num, stats] of Object.entries(numStats || {})) {
    deckStats[deck][num] = deckStats[deck][num] || { attempts: 0, correct: 0, wrong: 0, totalTime: 0 }
    deckStats[deck][num].attempts += Number(stats.attempts || 0)
    deckStats[deck][num].correct += Number(stats.correct || 0)
    deckStats[deck][num].wrong += Number(stats.wrong || 0)
  }
  writeJson(DECK_STATS_KEY, deckStats)

  const peaks = readJson(MASTERY_PEAK_KEY, {})
  const mastery = deckAnalytics.totalAttempts > 0
    ? Math.round((deckAnalytics.totalCorrect / deckAnalytics.totalAttempts) * 100)
    : 0
  peaks[deck] = Math.max(Number(peaks[deck] || 0), mastery)
  writeJson(MASTERY_PEAK_KEY, peaks)

  logActivity('session', attempts)

  notifyStatsUpdated()

  return {
    attempts,
    correct,
    wrong,
    mastery,
    peak: peaks[deck],
    totals: deckAnalytics,
  }
}

export function logActivity(kind = 'session', attempts = 0) {
  const log = readJson(ACTIVITY_LOG_KEY, {})
  const key = new Date().toISOString().slice(0, 10)
  const day = log[key] || { drills: 0, sessions: 0, attempts: 0 }
  if (kind === 'drill') day.drills += 1
  else day.sessions += 1
  day.attempts += Number(attempts || 0)
  log[key] = day
  writeJson(ACTIVITY_LOG_KEY, log)
}

export function recordDrillResult(deck, payload = {}) {
  const records = readJson(DRILL_RECORDS_KEY, {})
  const cur = records[deck] || {
    totalDrills: 0,
    bestScore: 0,
    bestAccuracy: 0,
    bestStreak: 0,
    mostCorrect: 0,
    bestAvgResponseMs: 0,
    history: [],
  }

  const score = Number(payload.score || 0)
  const correct = Number(payload.correct || 0)
  const wrong = Number(payload.wrong || 0)
  const maxStreak = Number(payload.maxStreak || 0)
  const attempts = correct + wrong
  const accuracy = attempts > 0 ? Number(((correct / attempts) * 100).toFixed(2)) : 0
  const avgResponseMs = Number(payload.avgResponseMs || 0)
  const timeUsedMs = Number(payload.timeUsedMs || 0)

  cur.totalDrills += 1
  cur.bestScore = Math.max(Number(cur.bestScore || 0), score)
  cur.bestAccuracy = Math.max(Number(cur.bestAccuracy || 0), accuracy)
  cur.bestStreak = Math.max(Number(cur.bestStreak || 0), maxStreak)
  cur.mostCorrect = Math.max(Number(cur.mostCorrect || 0), correct)
  if (avgResponseMs > 0) {
    const prev = Number(cur.bestAvgResponseMs || 0)
    cur.bestAvgResponseMs = prev > 0 ? Math.min(prev, avgResponseMs) : avgResponseMs
  }

  cur.history = [
    {
      ts: Date.now(),
      score,
      correct,
      wrong,
      maxStreak,
      accuracy,
      avgResponseMs,
      timeUsedMs,
    },
    ...(cur.history || []),
  ].slice(0, 100)

  records[deck] = cur
  writeJson(DRILL_RECORDS_KEY, records)
  logActivity('drill', attempts)
  notifyStatsUpdated()

  return { ...cur }
}

export function notifyStatsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mnemonic-stats-updated'))
  }
}

export function getDeckAnalytics(deck) {
  const analytics = readJson(ANALYTICS_KEY, {})
  return analytics[deck] || { totalSessions: 0, totalAttempts: 0, totalCorrect: 0, totalWrong: 0 }
}

export function getDeckPeak(deck) {
  const peaks = readJson(MASTERY_PEAK_KEY, {})
  return Number(peaks[deck] || 0)
}

export function getDeckWeakItems(deck, limit = 10) {
  const deckStats = readJson(DECK_STATS_KEY, {})[deck] || {}
  const rows = Object.entries(deckStats).map(([key, v]) => {
    const attempts = Number(v.attempts || 0)
    const correct = Number(v.correct || 0)
    const acc = attempts ? Math.round((correct / attempts) * 100) : 0
    return { key, attempts, correct, wrong: Number(v.wrong || 0), acc }
  })
  return rows.sort((a, b) => a.acc - b.acc || b.attempts - a.attempts).slice(0, limit)
}

export function getDeckStatsMap(deck) {
  return readJson(DECK_STATS_KEY, {})[deck] || {}
}

export function getAllDeckAnalytics() {
  return readJson(ANALYTICS_KEY, {})
}

export function getDeckDrillRecords(deck) {
  const all = readJson(DRILL_RECORDS_KEY, {})
  return all[deck] || {
    totalDrills: 0,
    bestScore: 0,
    bestAccuracy: 0,
    bestStreak: 0,
    mostCorrect: 0,
    bestAvgResponseMs: 0,
    history: [],
  }
}
