import { readJson, writeJson } from './storage'

export const REVIEW_STATE_KEY = 'reviewState_v1'
const DAY_MS = 24 * 60 * 60 * 1000
const URGENCY_JITTER = 0.12

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value || 0)))
}

// FSRS-5 default parameters (w[0]..w[18])
const W = [
    0.4072, 1.1829, 3.1262, 15.4722, // initial stability: Again / Hard / Good / Easy
    7.2102, 0.5316, 1.0651, 0.0589,  // difficulty init params
    1.521, 0.1544, 0.9867, 1.9805,  // recall-stability params
    0.0953, 0.2975, 2.2042, 0.2407,  // forget-stability params
    2.9466, 0.5034, 0.6567,          // hard/easy modifiers + extra
]
const DECAY = -0.5
const FACTOR = 19 / 81              // ≈ 0.2346
const REQUESTED_RETENTION = 0.9     // target 90 % retention

/** FSRS power-law forgetting curve */
function retrievability(elapsedDays, stability) {
    if (!elapsedDays || !stability) return 1
    return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY)
}

function fsrsInitDifficulty(rating) {
    return clamp(W[4] - Math.exp(W[5] * (rating - 1)) + 1, 1, 10)
}

function fsrsInitStability(rating) {
    return Math.max(0.1, W[rating - 1])
}

function fsrsNextDifficulty(d, rating) {
    const raw = d - W[6] * (rating - 3)
    return clamp(W[7] * fsrsInitDifficulty(4) + (1 - W[7]) * raw, 1, 10)
}

function fsrsRecallStability(d, s, r, rating) {
    const hardPenalty = rating === 2 ? W[15] : 1
    const easyBonus = rating === 4 ? W[16] : 1
    return Math.max(s, s * (
        Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) *
        (Math.exp(W[10] * (1 - r)) - 1) *
        hardPenalty * easyBonus + 1
    ))
}

function fsrsForgetStability(d, s, r) {
    return Math.max(0.1,
        W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r))
    )
}

function fsrsInterval(stability) {
    return Math.max(1, Math.round(stability / FACTOR * (Math.pow(REQUESTED_RETENTION, 1 / DECAY) - 1)))
}

/** Map binary quiz result → FSRS rating 1-4 (Again/Hard/Good/Easy) */
function ratingFromAttempt(correct, responseMs = 0) {
    if (!correct) return 1 // Again
    if (responseMs > 7000) return 2 // Hard
    if (responseMs > 3000) return 3 // Good
    return 4                        // Easy
}

function normalizeItem(raw = {}, now = Date.now()) {
    // Migrate SM-2 data: ease was in [1.3, 3.2]; FSRS difficulty is [1, 10].
    // Values < 4 are treated as old SM-2 ease and defaulted to mid difficulty.
    const rawEase = Number(raw.ease || 0)
    const difficulty = rawEase >= 4 ? clamp(rawEase, 1, 10) : 5.0
    const stability = Math.max(0.1, Number(raw.stabilityDays || raw.intervalDays || 0.1))
    return {
        difficulty,
        reps: Math.max(0, Math.floor(Number(raw.reps || 0))),
        lapses: Math.max(0, Math.floor(Number(raw.lapses || 0))),
        intervalDays: Math.max(0, Number(raw.intervalDays || 0)),
        stabilityDays: stability,
        lastReviewedAt: Number(raw.lastReviewedAt || 0),
        nextDueAt: Number(raw.nextDueAt || now),
    }
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
    return clamp(retrievability(elapsedDays, normalized.stabilityDays), 0, 1)
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
    const prepared = [...(pool || [])].map((entry) => {
        const item = deckState[String(entry.key)] || {}
        const urgency = getItemUrgency(item, now)
        return {
            entry,
            urgency,
            // Small jitter avoids predictable runs for near-equal urgency items.
            randomizedUrgency: urgency + ((Math.random() - 0.5) * URGENCY_JITTER),
            tieBreak: Math.random(),
        }
    })

    prepared.sort((a, b) => {
        const scoreDelta = b.randomizedUrgency - a.randomizedUrgency
        if (scoreDelta !== 0) return scoreDelta
        return a.tieBreak - b.tieBreak
    })

    return prepared.map((row) => row.entry)
}

export function updateReviewState(deck, key, payload = {}) {
    const now = Number(payload.now || Date.now())
    const correct = Boolean(payload.correct)
    const responseMs = Number(payload.responseMs || 0)
    const rating = ratingFromAttempt(correct, responseMs)

    const root = getReviewStateRoot()
    const deckState = { ...(root[deck] || {}) }
    const prev = normalizeItem(deckState[String(key)] || {}, now)

    const elapsedDays = prev.lastReviewedAt
        ? Math.max(0, (now - prev.lastReviewedAt) / DAY_MS)
        : 0
    const r = retrievability(elapsedDays, prev.stabilityDays)

    let difficulty, stability, intervalDays

    if (!prev.lastReviewedAt) {
        // First-ever review for this item
        difficulty = fsrsInitDifficulty(rating)
        stability = fsrsInitStability(rating)
        intervalDays = fsrsInterval(stability)
    } else if (correct) {
        difficulty = fsrsNextDifficulty(prev.difficulty, rating)
        stability = fsrsRecallStability(prev.difficulty, prev.stabilityDays, r, rating)
        intervalDays = fsrsInterval(stability)
    } else {
        difficulty = fsrsNextDifficulty(prev.difficulty, rating)
        stability = fsrsForgetStability(prev.difficulty, prev.stabilityDays, r)
        intervalDays = fsrsInterval(stability)
    }

    const next = {
        ease: Number(difficulty.toFixed(3)), // 'ease' field kept for storage compat
        reps: correct ? prev.reps + 1 : 0,
        lapses: correct ? prev.lapses : prev.lapses + 1,
        intervalDays: Number(intervalDays.toFixed(3)),
        stabilityDays: Number(stability.toFixed(3)),
        lastReviewedAt: now,
        nextDueAt: now + intervalDays * DAY_MS,
    }

    deckState[String(key)] = next
    root[deck] = deckState
    writeJson(REVIEW_STATE_KEY, root)
    return next
}

export function patchReviewItem(deck, key, fields = {}) {
    const root = getReviewStateRoot()
    const deckState = { ...(root[deck] || {}) }
    const existing = normalizeItem(deckState[String(key)] || {})
    deckState[String(key)] = { ...existing, ...fields }
    root[deck] = deckState
    writeJson(REVIEW_STATE_KEY, root)
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
