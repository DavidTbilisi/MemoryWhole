import { readJson } from './storage'
import { getDeckDataSync } from './deck-loader'
import { getDeckPrognosis } from './spaced-repetition'

const DRILL_RECORDS_KEY = 'drillRecords_v1'
const COMPETITION_RECORDS_KEY = 'competitionRecords_v1'
const DECK_STATS_KEY = 'deckStats_v1'
const REVIEW_STATE_KEY = 'reviewState_v1'

export const CHAMPION_TIERS = [
    {
        key: 'beginner',
        name: 'Beginner',
        icon: '🌱',
        description: 'Building foundations in speed and consistency.',
        thresholds: { drillMs: 5000, acc2s: 0, acc3s: 20, acc5s: 40, volume: 5, mastery: 10, retention: 0 },
    },
    {
        key: 'novice',
        name: 'Novice',
        icon: '🔰',
        description: 'Early control across recall speeds.',
        thresholds: { drillMs: 3000, acc2s: 30, acc3s: 50, acc5s: 70, volume: 10, mastery: 30, retention: 40 },
    },
    {
        key: 'intermediate',
        name: 'Intermediate',
        icon: '⚡',
        description: 'Reliable performance under moderate pressure.',
        thresholds: { drillMs: 2000, acc2s: 50, acc3s: 70, acc5s: 85, volume: 20, mastery: 50, retention: 55 },
    },
    {
        key: 'advanced',
        name: 'Advanced',
        icon: '🏅',
        description: 'Strong speed with high-quality recall.',
        thresholds: { drillMs: 1500, acc2s: 65, acc3s: 80, acc5s: 92, volume: 30, mastery: 70, retention: 65 },
    },
    {
        key: 'expert',
        name: 'Expert',
        icon: '💎',
        description: 'Near-elite control in all core dimensions.',
        thresholds: { drillMs: 1000, acc2s: 75, acc3s: 88, acc5s: 96, volume: 40, mastery: 85, retention: 75 },
    },
    {
        key: 'national',
        name: 'National',
        icon: '🏆',
        description: 'National-level readiness and discipline.',
        thresholds: { drillMs: 750, acc2s: 85, acc3s: 93, acc5s: 98, volume: 50, mastery: 92, retention: 82 },
    },
    {
        key: 'world',
        name: 'World',
        icon: '🌍',
        description: 'World-class consistency and speed.',
        thresholds: { drillMs: 500, acc2s: 92, acc3s: 97, acc5s: 100, volume: 50, mastery: 97, retention: 90 },
    },
    {
        key: 'legend',
        name: 'Legend',
        icon: '👑',
        description: 'Legend-tier mnemonic execution.',
        thresholds: { drillMs: 350, acc2s: 97, acc3s: 99, acc5s: 100, volume: 50, mastery: 99, retention: 95 },
    },
]

export const CHAMPION_PROFILES = {
    andrea_muzii: {
        name: 'Andrea Muzii',
        title: 'World Champion 2023',
        country: '🇮🇹',
        metrics: { drillMs: 350, acc2s: 95, acc3s: 98, acc5s: 100, volume: 50, mastery: 99, retention: 95 },
    },
    alex_mullen: {
        name: 'Alex Mullen',
        title: '3× World Champion',
        country: '🇺🇸',
        metrics: { drillMs: 400, acc2s: 93, acc3s: 97, acc5s: 100, volume: 50, mastery: 98, retention: 93 },
    },
    emma_alam: {
        name: 'Emma Alam',
        title: 'World Champion 2020',
        country: '🇵🇰',
        metrics: { drillMs: 450, acc2s: 90, acc3s: 95, acc5s: 99, volume: 50, mastery: 97, retention: 91 },
    },
    yanjaa_wintersoul: {
        name: 'Yanjaa Wintersoul',
        title: 'Grand Master of Memory',
        country: '🇸🇪',
        metrics: { drillMs: 480, acc2s: 88, acc3s: 94, acc5s: 98, volume: 50, mastery: 96, retention: 89 },
    },
}

export const METRIC_DEFINITIONS = {
    drillMs: {
        key: 'drillMs',
        label: 'Encoding Speed',
        shortLabel: 'Speed',
        unit: 'ms',
        direction: 'lower-is-better',
        actionType: 'drill',
        actionLabel: 'Run speed drills to lower response time.',
    },
    acc2s: {
        key: 'acc2s',
        label: '2s Recall',
        shortLabel: '2s',
        unit: '%',
        direction: 'higher-is-better',
        actionType: 'competition',
        actionLabel: 'Practice competition runs at 2 seconds per item.',
    },
    acc3s: {
        key: 'acc3s',
        label: '3s Recall',
        shortLabel: '3s',
        unit: '%',
        direction: 'higher-is-better',
        actionType: 'competition',
        actionLabel: 'Stabilize medium-speed recall at 3 seconds.',
    },
    acc5s: {
        key: 'acc5s',
        label: '5s Recall',
        shortLabel: '5s',
        unit: '%',
        direction: 'higher-is-better',
        actionType: 'competition',
        actionLabel: 'Build clean recall at 5 seconds with larger sets.',
    },
    volume: {
        key: 'volume',
        label: 'Recall Volume',
        shortLabel: 'Volume',
        unit: 'items',
        direction: 'higher-is-better',
        actionType: 'competition',
        actionLabel: 'Increase item volume while holding accuracy.',
    },
    mastery: {
        key: 'mastery',
        label: 'Mastery Depth',
        shortLabel: 'Mastery',
        unit: '%',
        direction: 'higher-is-better',
        actionType: 'new-deck',
        actionLabel: 'Fix weak associations and raise item mastery.',
    },
    retention: {
        key: 'retention',
        label: 'Retention Health',
        shortLabel: 'Retention',
        unit: '%',
        direction: 'higher-is-better',
        actionType: 'review',
        actionLabel: 'Review overdue material to keep long-term retention high.',
    },
}

function toNum(value, fallback = 0) {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

function round(value, digits = 2) {
    const n = toNum(value, 0)
    const mul = 10 ** digits
    return Math.round(n * mul) / mul
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, toNum(value, min)))
}

export function normalizeMetric(metricKey, value) {
    const n = toNum(value, 0)
    if (metricKey === 'drillMs') {
        return clamp(100 - ((n / 5000) * 100), 0, 100)
    }
    if (metricKey === 'volume') {
        return clamp((n / 50) * 100, 0, 100)
    }
    return clamp(n, 0, 100)
}

function metricProgress(metricKey, value, targetValue) {
    const direction = METRIC_DEFINITIONS[metricKey]?.direction
    const userValue = toNum(value, 0)
    const target = toNum(targetValue, 0)

    if (direction === 'lower-is-better') {
        if (target <= 0) return userValue <= 0 ? 100 : 0
        if (userValue <= target) return 100
        return clamp((target / Math.max(userValue, 1)) * 100, 0, 100)
    }

    if (target <= 0) return 100
    return clamp((userValue / target) * 100, 0, 100)
}

function meetsThreshold(metricKey, value, targetValue) {
    const direction = METRIC_DEFINITIONS[metricKey]?.direction
    if (direction === 'lower-is-better') return toNum(value, Infinity) <= toNum(targetValue, 0)
    return toNum(value, 0) >= toNum(targetValue, 0)
}

function computeBestDrillMs(drillRecords) {
    let best = 0
    for (const deckRecord of Object.values(drillRecords || {})) {
        const bestAvg = toNum(deckRecord?.bestAvgResponseMs, 0)
        if (bestAvg > 0) best = best > 0 ? Math.min(best, bestAvg) : bestAvg
        for (const run of deckRecord?.history || []) {
            const avg = toNum(run?.avgResponseMs, 0)
            if (avg <= 0) continue
            best = best > 0 ? Math.min(best, avg) : avg
        }
    }
    return round(best, 2)
}

function computeCompetitionMetrics(competitionRecords) {
    let acc2s = 0
    let acc3s = 0
    let acc5s = 0
    let volume = 0

    for (const deckRecord of Object.values(competitionRecords || {})) {
        const history = Array.isArray(deckRecord?.history) ? deckRecord.history : []
        for (const run of history) {
            const speed = toNum(run?.studySpeedSec, 0)
            const accuracy = toNum(run?.accuracy, 0)
            const correct = toNum(run?.correct, 0)

            if (speed === 2) acc2s = Math.max(acc2s, accuracy)
            if (speed === 3) acc3s = Math.max(acc3s, accuracy)
            if (speed === 5) acc5s = Math.max(acc5s, accuracy)

            volume = Math.max(volume, correct)
        }
    }

    return {
        acc2s: round(acc2s, 2),
        acc3s: round(acc3s, 2),
        acc5s: round(acc5s, 2),
        volume: round(volume, 2),
    }
}

function computeMastery(deckStatsRoot) {
    let practicedItems = 0
    let masteredItems = 0

    for (const itemMap of Object.values(deckStatsRoot || {})) {
        for (const itemStats of Object.values(itemMap || {})) {
            const attempts = toNum(itemStats?.attempts, 0)
            if (attempts <= 0) continue
            practicedItems += 1
            const correct = toNum(itemStats?.correct, 0)
            if ((correct / attempts) >= 0.9) masteredItems += 1
        }
    }

    if (!practicedItems) return 0
    return round((masteredItems / practicedItems) * 100, 2)
}

function computeRetention(reviewRoot, deckStatsRoot) {
    const candidateDecks = new Set([
        ...Object.keys(reviewRoot || {}),
        ...Object.keys(deckStatsRoot || {}),
    ])

    const retentionValues = []
    for (const deck of candidateDecks) {
        const statsMap = deckStatsRoot?.[deck] || {}
        const reviewMap = reviewRoot?.[deck] || {}
        if (!Object.keys(statsMap).length && !Object.keys(reviewMap).length) continue

        try {
            const dataMap = getDeckDataSync(deck)
            if (!Object.keys(dataMap || {}).length) continue
            const prognosis = getDeckPrognosis(deck, dataMap)
            retentionValues.push(toNum(prognosis?.retentionNowPct, 0))
        } catch {
            // Ignore unknown deck ids from stale local storage.
        }
    }

    if (!retentionValues.length) return 0
    const sum = retentionValues.reduce((acc, cur) => acc + toNum(cur, 0), 0)
    return round(sum / retentionValues.length, 2)
}

export function getUserChampionMetrics() {
    const drillRecords = readJson(DRILL_RECORDS_KEY, {})
    const competitionRecords = readJson(COMPETITION_RECORDS_KEY, {})
    const deckStats = readJson(DECK_STATS_KEY, {})
    const reviewState = readJson(REVIEW_STATE_KEY, {})

    const drillMs = computeBestDrillMs(drillRecords)
    const competition = computeCompetitionMetrics(competitionRecords)
    const mastery = computeMastery(deckStats)
    const retention = computeRetention(reviewState, deckStats)

    return {
        drillMs,
        acc2s: competition.acc2s,
        acc3s: competition.acc3s,
        acc5s: competition.acc5s,
        volume: competition.volume,
        mastery,
        retention,
    }
}

function getTierProgressForThreshold(metrics, thresholds) {
    const perDimensionProgress = {}
    for (const metricKey of Object.keys(METRIC_DEFINITIONS)) {
        const value = toNum(metrics?.[metricKey], 0)
        const target = toNum(thresholds?.[metricKey], 0)
        perDimensionProgress[metricKey] = round(metricProgress(metricKey, value, target), 1)
    }
    return perDimensionProgress
}

export function getChampionTier(metrics = {}) {
    let tierIndex = 0
    for (let i = 0; i < CHAMPION_TIERS.length; i += 1) {
        const tier = CHAMPION_TIERS[i]
        const passed = Object.keys(METRIC_DEFINITIONS).every((metricKey) => {
            const value = toNum(metrics?.[metricKey], 0)
            const target = toNum(tier.thresholds?.[metricKey], 0)
            return meetsThreshold(metricKey, value, target)
        })
        if (passed) tierIndex = i
    }

    const tier = CHAMPION_TIERS[tierIndex]
    const nextTier = CHAMPION_TIERS[tierIndex + 1] || null
    const targetThresholds = (nextTier || tier).thresholds
    const perDimensionProgress = getTierProgressForThreshold(metrics, targetThresholds)

    let bottleneck = null
    for (const metricKey of Object.keys(METRIC_DEFINITIONS)) {
        const progress = toNum(perDimensionProgress[metricKey], 0)
        if (!bottleneck || progress < bottleneck.progress) {
            bottleneck = {
                metric: metricKey,
                progress,
                target: toNum(targetThresholds?.[metricKey], 0),
            }
        }
    }

    return {
        tier,
        tierIndex,
        bottleneck,
        nextTier,
        perDimensionProgress,
    }
}

export function getChampionComparison(metrics = {}, profileKey = 'andrea_muzii') {
    const profile = CHAMPION_PROFILES[profileKey] || CHAMPION_PROFILES.andrea_muzii
    const dimensions = {}

    for (const metricKey of Object.keys(METRIC_DEFINITIONS)) {
        const user = toNum(metrics?.[metricKey], 0)
        const champion = toNum(profile.metrics?.[metricKey], 0)
        const direction = METRIC_DEFINITIONS[metricKey].direction
        const pct = direction === 'lower-is-better'
            ? (user > 0 ? (champion / user) * 100 : 0)
            : (champion > 0 ? (user / champion) * 100 : 0)

        dimensions[metricKey] = {
            user: round(user, 2),
            champion: round(champion, 2),
            pct: round(clamp(pct, 0, 140), 1),
            normalizedUser: round(normalizeMetric(metricKey, user), 1),
            normalizedChampion: round(normalizeMetric(metricKey, champion), 1),
        }
    }

    return {
        profile,
        dimensions,
    }
}

function getGapToTarget(metricKey, userValue, targetValue) {
    const direction = METRIC_DEFINITIONS[metricKey].direction
    const user = toNum(userValue, 0)
    const target = toNum(targetValue, 0)

    if (direction === 'lower-is-better') {
        return Math.max(0, round(user - target, 2))
    }
    return Math.max(0, round(target - user, 2))
}

export function getBottleneckAnalysis(metrics = {}) {
    const tierInfo = getChampionTier(metrics)
    const targetTier = tierInfo.nextTier || tierInfo.tier
    const targetThresholds = targetTier.thresholds

    const rows = Object.keys(METRIC_DEFINITIONS).map((metricKey) => {
        const def = METRIC_DEFINITIONS[metricKey]
        const user = toNum(metrics?.[metricKey], 0)
        const target = toNum(targetThresholds?.[metricKey], 0)
        const gap = getGapToTarget(metricKey, user, target)

        return {
            dimension: metricKey,
            label: def.label,
            gap,
            user,
            target,
            progress: round(metricProgress(metricKey, user, target), 1),
            actionLabel: def.actionLabel,
            actionType: def.actionType,
        }
    })

    return rows.sort((a, b) => {
        if (a.progress !== b.progress) return a.progress - b.progress
        return b.gap - a.gap
    })
}

export function estimateTimeToTier(targetTierIndex, snapshots = []) {
    const rows = Array.isArray(snapshots) ? snapshots : []
    if (rows.length < 7) {
        return {
            days: null,
            confidence: 'low',
            reason: 'Need at least 7 daily snapshots for trajectory estimation.',
        }
    }

    const points = rows
        .filter((row) => row && row.date && Number.isFinite(Number(row.tierIndex)))
        .map((row) => ({
            x: new Date(`${row.date}T00:00:00`).getTime() / (24 * 60 * 60 * 1000),
            y: Number(row.tierIndex),
        }))
        .sort((a, b) => a.x - b.x)

    if (points.length < 7) {
        return {
            days: null,
            confidence: 'low',
            reason: 'Need at least 7 valid trajectory points.',
        }
    }

    const n = points.length
    const sumX = points.reduce((acc, p) => acc + p.x, 0)
    const sumY = points.reduce((acc, p) => acc + p.y, 0)
    const sumXY = points.reduce((acc, p) => acc + (p.x * p.y), 0)
    const sumX2 = points.reduce((acc, p) => acc + (p.x * p.x), 0)

    const denom = (n * sumX2) - (sumX * sumX)
    if (!denom) {
        return {
            days: null,
            confidence: 'low',
            reason: 'Trajectory slope is undefined.',
        }
    }

    const slope = ((n * sumXY) - (sumX * sumY)) / denom
    const latest = points[points.length - 1]
    const target = toNum(targetTierIndex, latest.y)

    if (target <= latest.y) {
        return { days: 0, confidence: 'high', reason: 'Target tier already reached.' }
    }

    if (slope <= 0.0001) {
        return {
            days: null,
            confidence: 'low',
            reason: 'Current trend is flat. Improve bottleneck consistency for a better estimate.',
        }
    }

    const days = Math.max(0, Math.ceil((target - latest.y) / slope))
    let confidence = 'medium'
    if (n >= 21) confidence = 'high'
    if (days > 180) confidence = 'low'

    return {
        days,
        confidence,
        slope: round(slope, 4),
        reason: 'Estimated using linear regression on daily tier snapshots.',
    }
}
