import { readJson } from './storage'
import { DECKS } from '../data/decks'
import { getDeckDataSync } from './deck-loader'
import { getDeckPrognosis } from './spaced-repetition'
import {
  COMPETITION_RECORDS_KEY,
  DECK_STATS_KEY,
  DRILL_RECORDS_KEY,
} from './analytics'

function toNum(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function pickDeckByMastery(direction = 'lowest') {
  const rows = getDeckHealthRows().filter((row) => row.attemptedItems > 0)

  if (!rows.length) return 'major'
  rows.sort((a, b) => a.masteryPct - b.masteryPct)
  return direction === 'highest' ? rows[rows.length - 1].deck : rows[0].deck
}

function pickMostActiveDeck() {
  const records = readJson(COMPETITION_RECORDS_KEY, {})
  let bestDeck = 'major'
  let bestRuns = -1

  for (const deck of DECKS.map((d) => d.deck)) {
    const runs = toNum(records?.[deck]?.totalRuns, 0)
    if (runs > bestRuns) {
      bestDeck = deck
      bestRuns = runs
    }
  }

  return bestDeck
}

function getCompetitionHistory(deck) {
  const root = readJson(COMPETITION_RECORDS_KEY, {})
  return Array.isArray(root?.[deck]?.history) ? root[deck].history : []
}

function computeDeckMastery(itemMap = {}) {
  let attemptedItems = 0
  let masteredItems = 0
  let masterySum = 0

  for (const item of Object.values(itemMap || {})) {
    const attempts = toNum(item?.attempts, 0)
    if (attempts <= 0) continue
    const correct = toNum(item?.correct, 0)
    const acc = (correct / attempts) * 100
    attemptedItems += 1
    masterySum += acc
    if (acc >= 90) masteredItems += 1
  }

  return {
    attemptedItems,
    masteredItems,
    masteryPct: attemptedItems > 0 ? (masterySum / attemptedItems) : 0,
  }
}

function getDeckRetentionInfo(deck) {
  try {
    const dataMap = getDeckDataSync(deck)
    const prognosis = getDeckPrognosis(deck, dataMap)
    return {
      retentionNowPct: toNum(prognosis?.retentionNowPct, 0),
      overdueCount: toNum(prognosis?.overdueCount, 0),
      dueCount: toNum(prognosis?.dueCount, 0),
    }
  } catch {
    return {
      retentionNowPct: 0,
      overdueCount: 0,
      dueCount: 0,
    }
  }
}

function getBestAccuracyAtSpeed(history = [], speed = 3) {
  return history
    .filter((run) => toNum(run?.studySpeedSec, 0) === speed)
    .reduce((acc, run) => Math.max(acc, toNum(run?.accuracy, 0)), 0)
}

function getDeckHealthRows() {
  const deckStatsRoot = readJson(DECK_STATS_KEY, {})
  const competitionRoot = readJson(COMPETITION_RECORDS_KEY, {})
  const drillRoot = readJson(DRILL_RECORDS_KEY, {})

  return DECKS.map((deckMeta) => {
    const deck = deckMeta.deck
    const itemMap = deckStatsRoot[deck] || {}
    const competitionHistory = Array.isArray(competitionRoot?.[deck]?.history)
      ? competitionRoot[deck].history
      : []
    const drillHistory = Array.isArray(drillRoot?.[deck]?.history)
      ? drillRoot[deck].history
      : []

    const mastery = computeDeckMastery(itemMap)
    const bestDrillMs = drillHistory.reduce((acc, run) => {
      const ms = toNum(run?.avgResponseMs, 0)
      if (ms <= 0) return acc
      return acc > 0 ? Math.min(acc, ms) : ms
    }, toNum(drillRoot?.[deck]?.bestAvgResponseMs, 0))
    const bestVolume = competitionHistory.reduce((acc, run) => {
      return Math.max(acc, toNum(run?.correct, 0))
    }, 0)

    const retention = getDeckRetentionInfo(deck)

    return {
      deck,
      attemptedItems: mastery.attemptedItems,
      masteryPct: mastery.masteryPct,
      mastery90Pct: mastery.attemptedItems > 0 ? ((mastery.masteredItems / mastery.attemptedItems) * 100) : 0,
      competitionHistory,
      bestDrillMs,
      bestVolume,
      acc2s: getBestAccuracyAtSpeed(competitionHistory, 2),
      acc3s: getBestAccuracyAtSpeed(competitionHistory, 3),
      acc5s: getBestAccuracyAtSpeed(competitionHistory, 5),
      retentionNowPct: retention.retentionNowPct,
      overdueCount: retention.overdueCount,
      dueCount: retention.dueCount,
    }
  })
}

function pickDeckForBottleneck(metric = 'drillMs') {
  const rows = getDeckHealthRows()
  const practicedRows = rows.filter((row) => row.attemptedItems > 0 || row.competitionHistory.length > 0 || row.bestDrillMs > 0)
  if (!practicedRows.length) return 'major'

  if (metric === 'drillMs') {
    practicedRows.sort((a, b) => {
      const av = a.bestDrillMs > 0 ? a.bestDrillMs : 9999
      const bv = b.bestDrillMs > 0 ? b.bestDrillMs : 9999
      return bv - av
    })
    return practicedRows[0].deck
  }

  if (metric === 'acc2s') return practicedRows.sort((a, b) => a.acc2s - b.acc2s)[0].deck
  if (metric === 'acc3s') return practicedRows.sort((a, b) => a.acc3s - b.acc3s)[0].deck
  if (metric === 'acc5s') return practicedRows.sort((a, b) => a.acc5s - b.acc5s)[0].deck
  if (metric === 'volume') return practicedRows.sort((a, b) => a.bestVolume - b.bestVolume)[0].deck
  if (metric === 'mastery') return practicedRows.sort((a, b) => a.mastery90Pct - b.mastery90Pct)[0].deck
  if (metric === 'retention') return practicedRows.sort((a, b) => b.overdueCount - a.overdueCount || a.retentionNowPct - b.retentionNowPct)[0].deck

  return practicedRows[0].deck
}

export function getProgressiveOverload(metrics = {}, competitionHistory = []) {
  const history = Array.isArray(competitionHistory) ? competitionHistory : []
  if (!history.length) {
    return {
      suggestedSpeed: 5,
      suggestedItemCount: 10,
      suggestNewDeck: false,
    }
  }

  const latest = history[0]
  const currentSpeed = Math.max(2, toNum(latest?.studySpeedSec, 3))
  const currentItemCount = Math.max(5, toNum(latest?.itemCount, 10))

  const sameSpeedRuns = history
    .filter((run) => toNum(run?.studySpeedSec, 0) === currentSpeed)
    .slice(0, 5)

  const highAccRuns = sameSpeedRuns.filter((run) => toNum(run?.accuracy, 0) >= 90)
  const anyStrongRunAtSpeed = sameSpeedRuns.some((run) => toNum(run?.accuracy, 0) >= 85)

  let suggestedSpeed = currentSpeed
  let suggestedItemCount = currentItemCount

  if (highAccRuns.length >= 3) {
    suggestedSpeed = Math.max(2, currentSpeed - 1)
  }

  if (anyStrongRunAtSpeed) {
    suggestedItemCount = Math.min(50, currentItemCount + 5)
  }

  const rows = getDeckHealthRows().filter((row) => row.attemptedItems > 0)
  const suggestNewDeck = rows.length > 0 && rows.every((row) => row.mastery90Pct > 85)

  return {
    suggestedSpeed,
    suggestedItemCount,
    suggestNewDeck,
  }
}

export function getDailyGoals(tierInfo = {}, metrics = {}, bottleneck = null) {
  const bottleneckMetric = bottleneck?.dimension || bottleneck?.metric || 'drillMs'
  const tierThresholds = tierInfo?.nextTier?.thresholds || tierInfo?.tier?.thresholds || {}
  const strongDeck = pickDeckByMastery('highest')
  const weakDeck = pickDeckByMastery('lowest')
  const activeDeck = pickMostActiveDeck()
  const bottleneckDeck = pickDeckForBottleneck(bottleneckMetric)
  const overload = getProgressiveOverload(metrics, getCompetitionHistory(bottleneckDeck))

  const goals = []

  if (bottleneckMetric === 'drillMs') {
    goals.push({
      type: 'drill',
      deck: bottleneckDeck,
      config: { durationSec: 300, targetMs: toNum(tierThresholds.drillMs, 1500) },
      reason: `Speed bottleneck. Break ${toNum(tierThresholds.drillMs, 1500)}ms on ${bottleneckDeck}.`,
      priority: 1,
      durationMin: 5,
    })
  } else if (['acc2s', 'acc3s', 'acc5s', 'volume'].includes(bottleneckMetric)) {
    const speedMap = { acc2s: 2, acc3s: 3, acc5s: 5, volume: 5 }
    const speed = speedMap[bottleneckMetric] || 3
    const targetAcc = toNum(tierThresholds[bottleneckMetric], 85)
    goals.push({
      type: 'competition',
      deck: bottleneckDeck,
      config: { studySpeedSec: speed, itemCount: Math.max(overload.suggestedItemCount, bottleneckMetric === 'volume' ? 25 : 10) },
      reason: `Raise ${bottleneckMetric} above ${targetAcc}${bottleneckMetric.startsWith('acc') ? '%' : ''} on ${bottleneckDeck}.`,
      priority: 1,
      durationMin: 12,
    })
  } else if (bottleneckMetric === 'mastery') {
    goals.push({
      type: 'new-deck',
      deck: bottleneckDeck,
      config: { focus: 'weak-items', targetMastery: toNum(tierThresholds.mastery, 80) },
      reason: `Mastery depth is lagging. Fix weak associations in ${bottleneckDeck}.`,
      priority: 1,
      durationMin: 15,
    })
  } else if (bottleneckMetric === 'retention') {
    const retentionRow = getDeckHealthRows().find((row) => row.deck === bottleneckDeck)
    goals.push({
      type: 'review',
      deck: bottleneckDeck,
      config: { mode: 'recovery' },
      reason: `Retention health is low. Clear overdue items first (${toNum(retentionRow?.overdueCount, 0)} overdue).`,
      priority: 1,
      durationMin: 10,
    })
  }

  goals.push({
    type: 'competition',
    deck: bottleneckDeck || strongDeck,
    config: {
      studySpeedSec: overload.suggestedSpeed,
      itemCount: overload.suggestedItemCount,
    },
    reason: `Progressive overload: ${overload.suggestedSpeed}s pace, ${overload.suggestedItemCount} items on ${bottleneckDeck || strongDeck}.`,
    priority: 2,
    durationMin: 12,
  })

  goals.push({
    type: 'review',
    deck: activeDeck,
    config: { mode: 'recovery' },
    reason: `Retention pass on ${activeDeck} to keep gains stable over the next week.`,
    priority: 3,
    durationMin: 8,
  })

  return goals.slice(0, 3)
}

export function getSessionRecommendation(metrics = {}, availableMinutes = 15) {
  const minutes = Math.max(5, toNum(availableMinutes, 15))
  const rows = getDeckHealthRows()
  const weakDeck = pickDeckByMastery('lowest')
  const strongDeck = pickDeckByMastery('highest')
  const retentionDeck = pickDeckForBottleneck('retention')
  const speedDeck = pickDeckForBottleneck('drillMs')

  const retentionNow = toNum(metrics?.retention, 0)
  const drillMs = toNum(metrics?.drillMs, 0)

  if (retentionNow < 75) {
    const row = rows.find((item) => item.deck === retentionDeck)
    return {
      mode: 'review',
      deck: retentionDeck,
      config: { mode: 'recovery', minutes },
      reason: `Retention is lagging (${retentionNow}%). Recover ${toNum(row?.overdueCount, 0)} overdue items first.`,
    }
  }

  if (drillMs > 1200 || drillMs === 0) {
    return {
      mode: 'drill',
      deck: speedDeck,
      config: { durationSec: Math.min(600, minutes * 60) },
      reason: `Encoding speed is behind target (${Math.round(drillMs || 0)}ms). Run focused drill block on ${speedDeck}.`,
    }
  }

  const competitionHistory = getCompetitionHistory(strongDeck)
  const overload = getProgressiveOverload(metrics, competitionHistory)

  if (toNum(metrics?.acc3s, 0) < 85) {
    return {
      mode: 'competition',
      deck: strongDeck,
      config: { studySpeedSec: 3, itemCount: Math.max(15, Math.min(50, overload.suggestedItemCount)) },
      reason: `Raise medium-speed recall consistency on ${strongDeck} before pushing faster speeds.`,
    }
  }

  return {
    mode: 'competition',
    deck: strongDeck,
    config: { studySpeedSec: overload.suggestedSpeed, itemCount: Math.max(10, Math.min(50, overload.suggestedItemCount, 10 + (minutes * 2))) },
    reason: `Balanced progression on ${strongDeck}: push speed and volume while preserving precision.`,
  }
}
