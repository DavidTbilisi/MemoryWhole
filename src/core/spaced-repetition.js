import { readJson, writeJson } from './storage'

export const REVIEW_STATE_KEY = 'reviewState_v1'
const DAY_MS = 24 * 60 * 60 * 1000

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value || 0)))
}

function normalizeItem(raw = {}, now = Date.now()) {
    const fallbackInterval = Math.max(0.2, Number(raw.intervalDays || 0))
    const intervalDays = Math.max(0, Number(raw.intervalDays || fallbackInterval))
    const stabilityDays = Math.max(0.2, Number(raw.stabilityDays || intervalDays || 0.5))
    return {
        ease: clamp(raw.ease || 2.3, 1.3, 3.2),
        reps: Math.max(0, Math.floor(Number(raw.reps || 0))),
        lapses: Math.max(0, Math.floor(Number(raw.lapses || 0))),
        intervalDays,
        stabilityDays,
        lastReviewedAt: Number(raw.lastReviewedAt || 0),
        nextDueAt: Number(raw.nextDueAt || now),
    }
}

function qualityFromAttempt(correct, responseMs = 0) {
    if (!correct) return 1
    if (responseMs > 7000) return 3
    if (responseMs > 3000) return 4
    return 5
}

export function getReviewStateRoot() {
    return readJson(REVIEW_STATE_KEY, {})
}

export function getDeckReviewState(deck) {
    return getReviewStateRoot()[deck] || {}
}

export function isItemDue(item, now = Date.now()) {
    const normalized = normalizeItem(item, now)
    return normalized.nextDueAt <= now
}

export function getItemRetention(item, now = Date.now()) {
    const normalized = normalizeItem(item, now)
    if (!normalized.lastReviewedAt) return 0.35
    const elapsedDays = Math.max(0, (now - normalized.lastReviewedAt) / DAY_MS)
    const retention = Math.exp(-elapsedDays / Math.max(0.2, normalized.stabilityDays))
    return clamp(retention, 0, 1)
}

function getItemUrgency(item, now = Date.now()) {
    const normalized = normalizeItem(item, now)
    const due = isItemDue(normalized, now)
    const overdueDays = due ? Math.max(0, (now - normalized.nextDueAt) / DAY_MS) : 0
    const retention = getItemRetention(normalized, now)
    return (due ? 2 : 0)
        + (overdueDays * 0.35)
        + ((1 - retention) * 1.6)
        + (normalized.lapses * 0.08)
        - (normalized.reps * 0.03)
}

export function sortPoolByReviewUrgency(pool, deck, now = Date.now()) {
    const deckState = getDeckReviewState(deck)
    return [...(pool || [])].sort((a, b) => {
        const aItem = deckState[String(a.key)] || {}
        const bItem = deckState[String(b.key)] || {}
        const scoreDelta = getItemUrgency(bItem, now) - getItemUrgency(aItem, now)
        if (scoreDelta !== 0) return scoreDelta
        return String(a.key).localeCompare(String(b.key), undefined, { numeric: true })
    })
}

export function updateReviewState(deck, key, payload = {}) {
    const now = Number(payload.now || Date.now())
    const correct = Boolean(payload.correct)
    const responseMs = Number(payload.responseMs || 0)

    const root = getReviewStateRoot()
    const deckState = { ...(root[deck] || {}) }
    const previous = normalizeItem(deckState[String(key)] || {}, now)
    const quality = qualityFromAttempt(correct, responseMs)

    let ease = previous.ease
    let reps = previous.reps
    let lapses = previous.lapses
    let intervalDays = previous.intervalDays
    let stabilityDays = previous.stabilityDays

    if (correct) {
        reps += 1
        ease = clamp(
            ease + (0.1 - ((5 - quality) * (0.08 + ((5 - quality) * 0.02)))),
            1.3,
            3.2
        )

        if (reps === 1) intervalDays = 1
        else if (reps === 2) intervalDays = 3
        else intervalDays = Math.max(1, previous.intervalDays * ease)

        stabilityDays = Math.max(0.5, Math.max(previous.stabilityDays * (1 + ((ease - 1.2) * 0.35)), intervalDays))
    } else {
        reps = 0
        lapses += 1
        ease = clamp(ease - 0.2, 1.3, 3.2)
        intervalDays = 0.2
        stabilityDays = Math.max(0.2, previous.stabilityDays * 0.55)
    }

    const next = {
        ease: Number(ease.toFixed(3)),
        reps,
        lapses,
        intervalDays: Number(intervalDays.toFixed(3)),
        stabilityDays: Number(stabilityDays.toFixed(3)),
        lastReviewedAt: now,
        nextDueAt: now + (intervalDays * DAY_MS),
    }

    deckState[String(key)] = next
    root[deck] = deckState
    writeJson(REVIEW_STATE_KEY, root)
    return next
}

export function getDeckPrognosis(deck, dataMap = {}, options = {}) {
    const now = Number(options.now || Date.now())
    const horizonDays = Math.max(1, Number(options.horizonDays || 7))
    const horizonMs = horizonDays * DAY_MS
    const keys = Object.keys(dataMap || {})
    const total = keys.length

    if (!total) {
        return {
            score: 0,
            retentionNowPct: 0,
            projectedRetentionPct: 0,
            coveragePct: 0,
            dueCount: 0,
            overdueCount: 0,
            riskCount: 0,
            dueSoonCount: 0,
            dailyLoad: 0,
            horizonDays,
        }
    }

    const deckState = getDeckReviewState(deck)
    let seenCount = 0
    let dueCount = 0
    let overdueCount = 0
    let riskCount = 0
    let dueSoonCount = 0
    let retentionNowTotal = 0
    let projectedRetentionTotal = 0

    for (const key of keys) {
        const item = normalizeItem(deckState[String(key)] || {}, now)
        const retentionNow = getItemRetention(item, now)
        const retentionProjected = item.lastReviewedAt
            ? Math.exp(-(((now - item.lastReviewedAt) + horizonMs) / DAY_MS) / Math.max(0.2, item.stabilityDays))
            : 0.2

        if (item.lastReviewedAt > 0) seenCount += 1
        if (isItemDue(item, now)) dueCount += 1
        if (item.nextDueAt < now) overdueCount += 1
        if (item.nextDueAt <= (now + horizonMs)) dueSoonCount += 1
        if (retentionNow < 0.6) riskCount += 1

        retentionNowTotal += retentionNow
        projectedRetentionTotal += clamp(retentionProjected, 0, 1)
    }

    const retentionNowPct = Math.round((retentionNowTotal / total) * 100)
    const projectedRetentionPct = Math.round((projectedRetentionTotal / total) * 100)
    const coveragePct = Math.round((seenCount / total) * 100)
    const overdueSafetyPct = Math.round((1 - (overdueCount / total)) * 100)
    const score = Math.round(clamp(
        (retentionNowPct * 0.55)
        + (coveragePct * 0.25)
        + (overdueSafetyPct * 0.2),
        0,
        100
    ))

    return {
        score,
        retentionNowPct,
        projectedRetentionPct,
        coveragePct,
        dueCount,
        overdueCount,
        riskCount,
        dueSoonCount,
        dailyLoad: Math.round(dueSoonCount / horizonDays),
        horizonDays,
    }
}
