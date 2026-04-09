import { readJson } from './storage'
import { ANALYTICS_KEY, MASTERY_PEAK_KEY } from './analytics'
import { DECKS } from '../data/decks'

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
  let totalAttempts = 0
  let totalCorrect = 0
  let practicedDeckCount = 0
  const totalDeckCount = Math.max(1, DECKS.length)

  for (const [deck, deckAnalytics] of Object.entries(analytics)) {
    if (!DECKS.some((item) => item.deck === deck)) continue
    const attempts = Number(deckAnalytics.totalAttempts || 0)
    const correct = Number(deckAnalytics.totalCorrect || 0)
    totalAttempts += attempts
    totalCorrect += correct
    if (attempts > 0) practicedDeckCount += 1
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
