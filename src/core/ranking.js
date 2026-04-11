import { readJson } from './storage'
import { ANALYTICS_KEY, MASTERY_PEAK_KEY, SESSION_HISTORY_KEY } from './analytics'
import { DECKS } from '../data/decks'

const WINDOW_ATTEMPTS = 200
const LEADERBOARD_RECENT_DAYS = 7

// Anime ranking system: SSS+ > SSS > SS+ > SS > S+ > S > A+ > A > B+ > B > C+ > C > D > F
const ANIME_RANKS = [
  { rank: 'SSS+', minScore: 95, color: '#ff006e', description: 'Legendary' },
  { rank: 'SSS', minScore: 92, color: '#ff006e', description: 'Mythical' },
  { rank: 'SS+', minScore: 89, color: '#b5179e', description: 'Divine' },
  { rank: 'SS', minScore: 86, color: '#b5179e', description: 'Supreme' },
  { rank: 'S+', minScore: 83, color: '#7209b7', description: 'Transcendent' },
  { rank: 'S', minScore: 80, color: '#7209b7', description: 'Exceptional' },
  { rank: 'A+', minScore: 75, color: '#3a0ca3', description: 'Outstanding' },
  { rank: 'A', minScore: 70, color: '#3a0ca3', description: 'Excellent' },
  { rank: 'B+', minScore: 60, color: '#4361ee', description: 'Good' },
  { rank: 'B', minScore: 50, color: '#4361ee', description: 'Fair' },
  { rank: 'C+', minScore: 40, color: '#4895ef', description: 'Acceptable' },
  { rank: 'C', minScore: 30, color: '#4895ef', description: 'Adequate' },
  { rank: 'D', minScore: 0, color: '#00b4d8', description: 'Poor' },
  { rank: 'F', minScore: -1, color: '#90e0ef', description: 'Incomplete' }
]

function getGlobalStats() {
  const analytics = readJson(ANALYTICS_KEY, {})
  const sessionHistory = readJson(SESSION_HISTORY_KEY, {})
  const totalDeckCount = Math.max(1, DECKS.length)

  // Coverage: all-time — have you ever practiced this deck?
  let practicedDeckCount = 0
  for (const [deck, deckAnalytics] of Object.entries(analytics)) {
    if (!DECKS.some((item) => item.deck === deck)) continue
    if (Number(deckAnalytics.totalAttempts || 0) > 0) practicedDeckCount += 1
  }

  // Accuracy: sliding window — most recent WINDOW_ATTEMPTS attempts across all decks
  const allSessions = []
  for (const sessions of Object.values(sessionHistory)) {
    if (!Array.isArray(sessions)) continue
    for (const s of sessions) {
      if (Number(s.attempts || 0) > 0) {
        allSessions.push({ ts: Number(s.ts || 0), attempts: Number(s.attempts || 0), correct: Number(s.correct || 0) })
      }
    }
  }
  allSessions.sort((a, b) => b.ts - a.ts)

  let totalAttempts = 0
  let totalCorrect = 0
  for (const s of allSessions) {
    totalAttempts += s.attempts
    totalCorrect += s.correct
    if (totalAttempts >= WINDOW_ATTEMPTS) break
  }

  // If session history doesn't cover the full window, fill the remainder
  // by scaling cumulative accuracy into the remaining slots
  if (totalAttempts < WINDOW_ATTEMPTS) {
    let cumAttempts = 0
    let cumCorrect = 0
    for (const [deck, deckAnalytics] of Object.entries(analytics)) {
      if (!DECKS.some((item) => item.deck === deck)) continue
      cumAttempts += Number(deckAnalytics.totalAttempts || 0)
      cumCorrect += Number(deckAnalytics.totalCorrect || 0)
    }
    if (cumAttempts > 0) {
      const cumAccuracy = cumCorrect / cumAttempts
      const remaining = WINDOW_ATTEMPTS - totalAttempts
      totalAttempts += remaining
      totalCorrect += Math.round(remaining * cumAccuracy)
    }
  }

  const globalAccuracy = totalAttempts > 0
    ? Math.round((totalCorrect / totalAttempts) * 100)
    : 0

  const coverageRatio = practicedDeckCount / totalDeckCount
  const coveragePct = Math.round(coverageRatio * 100)
  const globalScore = Math.round(globalAccuracy * coverageRatio)

  return {
    totalAttempts,
    totalCorrect,
    totalWrong: totalAttempts - totalCorrect,
    deckCount: practicedDeckCount,
    totalDeckCount,
    coverageRatio,
    coveragePct,
    globalAccuracy,
    globalScore,
  }
}

function getSyntheticScore() {
  const analytics = readJson(ANALYTICS_KEY, {})
  const peaks = readJson(MASTERY_PEAK_KEY, {})

  let totalAttempts = 0
  let totalCorrect = 0
  let masterySum = 0
  let deckCount = Object.keys(analytics).length

  for (const [deck, deckAnalytics] of Object.entries(analytics)) {
    totalAttempts += Number(deckAnalytics.totalAttempts || 0)
    totalCorrect += Number(deckAnalytics.totalCorrect || 0)
    masterySum += Number(peaks[deck] || 0)
  }

  if (deckCount === 0) {
    return {
      score: 0,
      accuracy: 0,
      averageMastery: 0,
      diversityBonus: 0,
      weightedMastery: 0,
      weightedAccuracy: 0,
    }
  }

  const accuracy = totalAttempts > 0
    ? (totalCorrect / totalAttempts) * 100
    : 0

  const averageMastery = masterySum / deckCount

  // Synthetic score: 60% from average mastery + 40% from global accuracy
  // with bonus for deck diversity
  const diversityBonus = Math.min(deckCount * 2, 10)
  const weightedMastery = averageMastery * 0.6
  const weightedAccuracy = accuracy * 0.4
  const syntheticScore = weightedMastery + weightedAccuracy + diversityBonus

  return {
    score: Math.min(syntheticScore, 100),
    accuracy,
    averageMastery,
    diversityBonus,
    weightedMastery,
    weightedAccuracy,
  }
}

function getRecentWindowCutoff(days = LEADERBOARD_RECENT_DAYS) {
  return Date.now() - (days * 24 * 60 * 60 * 1000)
}

function getRecentSessionMap(days = LEADERBOARD_RECENT_DAYS) {
  const sessionHistory = readJson(SESSION_HISTORY_KEY, {})
  const cutoff = getRecentWindowCutoff(days)
  const out = {}

  for (const deckMeta of DECKS) {
    const deck = deckMeta.deck
    const sessions = Array.isArray(sessionHistory[deck]) ? sessionHistory[deck] : []
    out[deck] = sessions.filter((entry) => Number(entry?.ts || 0) >= cutoff)
  }

  return out
}

function getRecentGlobalStats(days = LEADERBOARD_RECENT_DAYS) {
  const recentMap = getRecentSessionMap(days)
  const totalDeckCount = Math.max(1, DECKS.length)
  let totalAttempts = 0
  let totalCorrect = 0
  let deckCount = 0

  for (const deckMeta of DECKS) {
    const deckSessions = recentMap[deckMeta.deck] || []
    if (deckSessions.length) deckCount += 1
    for (const session of deckSessions) {
      totalAttempts += Number(session?.attempts || 0)
      totalCorrect += Number(session?.correct || 0)
    }
  }

  const coverageRatio = deckCount / totalDeckCount
  const globalAccuracy = totalAttempts > 0
    ? Math.round((totalCorrect / totalAttempts) * 100)
    : 0

  return {
    totalAttempts,
    totalCorrect,
    deckCount,
    totalDeckCount,
    coveragePct: Math.round(coverageRatio * 100),
    globalAccuracy,
    globalScore: Math.round(globalAccuracy * coverageRatio),
  }
}

function getRecentSyntheticScore(days = LEADERBOARD_RECENT_DAYS) {
  const recentMap = getRecentSessionMap(days)
  let totalAttempts = 0
  let totalCorrect = 0
  let masterySum = 0
  let deckCount = 0

  for (const deckMeta of DECKS) {
    const deckSessions = recentMap[deckMeta.deck] || []
    if (!deckSessions.length) continue
    deckCount += 1

    let deckPeak = 0
    for (const session of deckSessions) {
      totalAttempts += Number(session?.attempts || 0)
      totalCorrect += Number(session?.correct || 0)
      deckPeak = Math.max(deckPeak, Number(session?.peak || session?.mastery || 0))
    }
    masterySum += deckPeak
  }

  if (deckCount === 0) {
    return {
      score: 0,
      accuracy: 0,
      averageMastery: 0,
      diversityBonus: 0,
    }
  }

  const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0
  const averageMastery = masterySum / deckCount
  const diversityBonus = Math.min(deckCount * 2, 10)
  const syntheticScore = (averageMastery * 0.6) + (accuracy * 0.4) + diversityBonus

  return {
    score: Math.min(syntheticScore, 100),
    accuracy,
    averageMastery,
    diversityBonus,
    deckCount,
    totalAttempts,
  }
}

function getDeckLeaderboardStats() {
  const analytics = readJson(ANALYTICS_KEY, {})
  const peaks = readJson(MASTERY_PEAK_KEY, {})
  const recentMap = getRecentSessionMap(LEADERBOARD_RECENT_DAYS)
  const out = {}

  for (const deckMeta of DECKS) {
    const deck = deckMeta.deck
    const deckAnalytics = analytics[deck] || {}
    const attempts = Number(deckAnalytics.totalAttempts || 0)
    const correct = Number(deckAnalytics.totalCorrect || 0)
    const recentSessions = recentMap[deck] || []

    let recentAttempts = 0
    let recentCorrect = 0
    let recentPeak = 0

    for (const session of recentSessions) {
      recentAttempts += Number(session?.attempts || 0)
      recentCorrect += Number(session?.correct || 0)
      recentPeak = Math.max(recentPeak, Number(session?.peak || session?.mastery || 0))
    }

    out[deck] = {
      attempts,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      peak: Number(peaks[deck] || 0),
      recent7dAttempts: recentAttempts,
      recent7dAccuracy: recentAttempts > 0 ? Math.round((recentCorrect / recentAttempts) * 100) : 0,
      recent7dPeak: recentPeak,
    }
  }

  return out
}

export function getRankInfo(score) {
  const rankInfo = ANIME_RANKS.find(r => score >= r.minScore)
  return rankInfo || ANIME_RANKS[ANIME_RANKS.length - 1]
}

export function getNextRankInfo(score) {
  const candidates = ANIME_RANKS
    .filter((rank) => rank.minScore > score)
    .sort((a, b) => a.minScore - b.minScore)
  return candidates[0] || null
}

function estimatePerfectAnswersToTarget(totalAttempts, totalCorrect, targetPct) {
  const attempts = Number(totalAttempts || 0)
  const correct = Number(totalCorrect || 0)
  const target = Number(targetPct || 0) / 100
  if (target <= 0 || target >= 1) return 0
  const needed = Math.ceil(((target * attempts) - correct) / (1 - target))
  if (attempts === 0) return 1
  return Math.max(0, needed)
}

export function getGlobalRank() {
  const stats = getGlobalStats()
  const rankInfo = getRankInfo(stats.globalScore)
  const nextRank = getNextRankInfo(stats.globalScore)

  let perfectNeeded = 0
  let coverageDecksNeeded = 0

  if (nextRank) {
    const maxScoreAtCurrentCoverage = 100 * stats.coverageRatio
    if (nextRank.minScore > maxScoreAtCurrentCoverage) {
      const requiredCoverage = nextRank.minScore / 100
      const requiredDecks = Math.ceil(requiredCoverage * stats.totalDeckCount)
      coverageDecksNeeded = Math.max(0, requiredDecks - stats.deckCount)
      perfectNeeded = null
    } else {
      const requiredAccuracy = nextRank.minScore / Math.max(stats.coverageRatio, 0.0001)
      if (requiredAccuracy >= 100) {
        perfectNeeded = null
      } else {
        perfectNeeded = estimatePerfectAnswersToTarget(stats.totalAttempts, stats.totalCorrect, requiredAccuracy)
      }
    }
  }

  return {
    rank: rankInfo.rank,
    score: stats.globalScore,
    color: rankInfo.color,
    description: rankInfo.description,
    stats,
    nextRank,
    perfectNeeded,
    coverageDecksNeeded,
  }
}

export function getSyntheticRank() {
  const synthetic = getSyntheticScore()
  const rankInfo = getRankInfo(synthetic.score)
  return {
    rank: rankInfo.rank,
    score: Math.round(synthetic.score),
    color: rankInfo.color,
    description: rankInfo.description,
    components: {
      accuracy: Math.round(synthetic.accuracy),
      averageMastery: Math.round(synthetic.averageMastery),
      diversityBonus: Number(synthetic.diversityBonus.toFixed(1)),
      weightedMastery: Number(synthetic.weightedMastery.toFixed(1)),
      weightedAccuracy: Number(synthetic.weightedAccuracy.toFixed(1)),
    },
  }
}

export function getAllRankInfo() {
  return {
    global: getGlobalRank(),
    synthetic: getSyntheticRank()
  }
}

export function getLeaderboardSnapshot() {
  const rankInfo = getAllRankInfo()
  const recentGlobal = getRecentGlobalStats()
  const recentSynthetic = getRecentSyntheticScore()
  return {
    globalScore: Number(rankInfo.global?.score || 0),
    globalRank: String(rankInfo.global?.rank || 'F'),
    globalAccuracy: Number(rankInfo.global?.stats?.globalAccuracy || 0),
    totalAttempts: Number(rankInfo.global?.stats?.totalAttempts || 0),
    deckCount: Number(rankInfo.global?.stats?.deckCount || 0),
    totalDeckCount: Number(rankInfo.global?.stats?.totalDeckCount || DECKS.length || 0),
    coveragePct: Number(rankInfo.global?.stats?.coveragePct || 0),
    syntheticScore: Number(rankInfo.synthetic?.score || 0),
    syntheticRank: String(rankInfo.synthetic?.rank || 'F'),
    averageMastery: Number(rankInfo.synthetic?.components?.averageMastery || 0),
    diversityBonus: Number(rankInfo.synthetic?.components?.diversityBonus || 0),
    recent7dGlobalScore: Number(recentGlobal.globalScore || 0),
    recent7dGlobalAccuracy: Number(recentGlobal.globalAccuracy || 0),
    recent7dAttempts: Number(recentGlobal.totalAttempts || 0),
    recent7dDeckCount: Number(recentGlobal.deckCount || 0),
    recent7dCoveragePct: Number(recentGlobal.coveragePct || 0),
    recent7dSyntheticScore: Math.round(Number(recentSynthetic.score || 0)),
    recent7dAverageMastery: Math.round(Number(recentSynthetic.averageMastery || 0)),
    recent7dDiversityBonus: Number((recentSynthetic.diversityBonus || 0).toFixed(1)),
    deckStats: getDeckLeaderboardStats(),
  }
}
