import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Storage mock ──────────────────────────────────────────────────────────────
const { mockStore } = vi.hoisted(() => {
  const mockStore = {}
  return { mockStore }
})

vi.mock('../../src/core/storage', () => ({
  readJson: (key, fallback) => {
    const raw = mockStore[key]
    if (raw === undefined || raw === null) return fallback
    try { return JSON.parse(raw) } catch { return fallback }
  },
  writeJson: (key, value) => { mockStore[key] = JSON.stringify(value) },
  readDeckMap: vi.fn(() => ({})),
  writeDeckMap: vi.fn(),
}))

import {
  updateReviewState,
  sortPoolByReviewUrgency,
  getDeckReviewState,
  getItemRetention,
  isItemDue,
  REVIEW_STATE_KEY,
} from '../../src/core/spaced-repetition'

const DAY_MS = 24 * 60 * 60 * 1000

function clearStore() {
  for (const k in mockStore) delete mockStore[k]
}

function makePool(keys) {
  return keys.map((k) => ({ key: String(k), value: `Val${k}` }))
}

// ── updateReviewState — correct answers ───────────────────────────────────────
describe('updateReviewState — correct answers', () => {
  beforeEach(clearStore)

  it('returns an object with all expected fields', () => {
    const r = updateReviewState('major', '42', { correct: true, responseMs: 1000, now: Date.now() })
    expect(typeof r.ease).toBe('number')
    expect(typeof r.reps).toBe('number')
    expect(typeof r.lapses).toBe('number')
    expect(typeof r.intervalDays).toBe('number')
    expect(typeof r.stabilityDays).toBe('number')
    expect(typeof r.lastReviewedAt).toBe('number')
    expect(typeof r.nextDueAt).toBe('number')
  })

  it('increments reps on first correct answer', () => {
    const r = updateReviewState('major', '42', { correct: true, now: Date.now() })
    expect(r.reps).toBe(1)
  })

  it('sets intervalDays to 1 after first correct answer', () => {
    const r = updateReviewState('major', '42', { correct: true, now: Date.now() })
    expect(r.intervalDays).toBeCloseTo(1, 3)
  })

  it('sets intervalDays to 3 after second correct answer', () => {
    const now = Date.now()
    updateReviewState('major', '42', { correct: true, now })
    const r = updateReviewState('major', '42', { correct: true, now: now + DAY_MS })
    expect(r.intervalDays).toBeCloseTo(3, 3)
  })

  it('uses ease factor to grow interval after 3+ correct answers', () => {
    const now = Date.now()
    updateReviewState('major', '42', { correct: true, now })
    updateReviewState('major', '42', { correct: true, now: now + DAY_MS })
    const r3 = updateReviewState('major', '42', { correct: true, now: now + 4 * DAY_MS })
    expect(r3.intervalDays).toBeGreaterThan(3)
  })

  it('does not decrease ease below 1.3', () => {
    const now = Date.now()
    // Many slow answers lower ease but it must stay >= 1.3
    for (let i = 0; i < 20; i++) {
      updateReviewState('major', '42', { correct: true, responseMs: 10000, now: now + i * DAY_MS })
    }
    const { ease } = getDeckReviewState('major')['42']
    expect(ease).toBeGreaterThanOrEqual(1.3)
  })

  it('does not increase ease above 3.2', () => {
    const now = Date.now()
    for (let i = 0; i < 20; i++) {
      updateReviewState('major', '42', { correct: true, responseMs: 100, now: now + i * DAY_MS })
    }
    const { ease } = getDeckReviewState('major')['42']
    expect(ease).toBeLessThanOrEqual(3.2)
  })

  it('sets nextDueAt in the future', () => {
    const now = Date.now()
    const r = updateReviewState('major', '42', { correct: true, now })
    expect(r.nextDueAt).toBeGreaterThan(now)
  })

  it('persists state to storage', () => {
    updateReviewState('major', '42', { correct: true, now: Date.now() })
    const stored = getDeckReviewState('major')
    expect(stored['42']).toBeDefined()
    expect(stored['42'].reps).toBe(1)
  })

  it('is isolated per deck', () => {
    const now = Date.now()
    updateReviewState('major', '42', { correct: true, now })
    updateReviewState('pao',   '42', { correct: true, now })
    updateReviewState('pao',   '42', { correct: true, now: now + DAY_MS })
    expect(getDeckReviewState('major')['42'].reps).toBe(1)
    expect(getDeckReviewState('pao')['42'].reps).toBe(2)
  })
})

// ── updateReviewState — wrong answers ─────────────────────────────────────────
describe('updateReviewState — wrong answers', () => {
  beforeEach(clearStore)

  it('resets reps to 0 on wrong answer', () => {
    const now = Date.now()
    updateReviewState('major', '1', { correct: true, now })
    updateReviewState('major', '1', { correct: true, now: now + DAY_MS })
    const r = updateReviewState('major', '1', { correct: false, now: now + 2 * DAY_MS })
    expect(r.reps).toBe(0)
  })

  it('increments lapses on wrong answer', () => {
    const now = Date.now()
    const r = updateReviewState('major', '1', { correct: false, now })
    expect(r.lapses).toBe(1)
  })

  it('decreases ease by 0.2 on wrong (clamped)', () => {
    const now = Date.now()
    // First answer sets ease from default 2.3
    const r1 = updateReviewState('major', '1', { correct: true, responseMs: 100, now })
    const easeBefore = r1.ease
    const r2 = updateReviewState('major', '1', { correct: false, now: now + DAY_MS })
    expect(r2.ease).toBeCloseTo(Math.max(1.3, easeBefore - 0.2), 1)
  })

  it('sets intervalDays to 0.2 (re-review tomorrow) on wrong', () => {
    const now = Date.now()
    updateReviewState('major', '1', { correct: true, now })
    const r = updateReviewState('major', '1', { correct: false, now: now + DAY_MS })
    expect(r.intervalDays).toBeCloseTo(0.2, 3)
  })

  it('reduces stabilityDays on wrong answer', () => {
    const now = Date.now()
    const r1 = updateReviewState('major', '1', { correct: true, now })
    const stab1 = r1.stabilityDays
    const r2 = updateReviewState('major', '1', { correct: false, now: now + DAY_MS })
    expect(r2.stabilityDays).toBeLessThan(stab1)
  })

  it('sets nextDueAt very soon (within 1 day) after wrong', () => {
    const now = Date.now()
    const r = updateReviewState('major', '1', { correct: false, now })
    expect(r.nextDueAt - now).toBeLessThanOrEqual(DAY_MS)
  })
})

// ── isItemDue ─────────────────────────────────────────────────────────────────
describe('isItemDue', () => {
  it('returns true for a brand-new item (nextDueAt defaults to now)', () => {
    const now = Date.now()
    expect(isItemDue({}, now)).toBe(true)
  })

  it('returns true when nextDueAt is in the past', () => {
    expect(isItemDue({ nextDueAt: Date.now() - 1000 })).toBe(true)
  })

  it('returns false when nextDueAt is in the future', () => {
    expect(isItemDue({ nextDueAt: Date.now() + DAY_MS })).toBe(false)
  })
})

// ── getItemRetention ──────────────────────────────────────────────────────────
describe('getItemRetention', () => {
  it('returns 0.35 for a brand-new item (never reviewed)', () => {
    expect(getItemRetention({})).toBeCloseTo(0.35, 5)
  })

  it('returns ~1 immediately after review', () => {
    const now = Date.now()
    const r = getItemRetention({ lastReviewedAt: now, stabilityDays: 10 }, now)
    expect(r).toBeCloseTo(1.0, 2)
  })

  it('decays over time', () => {
    const reviewedAt = Date.now() - 5 * DAY_MS
    const r = getItemRetention({ lastReviewedAt: reviewedAt, stabilityDays: 3 })
    expect(r).toBeLessThan(1)
    expect(r).toBeGreaterThan(0)
  })

  it('decays faster with low stabilityDays', () => {
    const reviewedAt = Date.now() - 3 * DAY_MS
    const rLow  = getItemRetention({ lastReviewedAt: reviewedAt, stabilityDays: 1 })
    const rHigh = getItemRetention({ lastReviewedAt: reviewedAt, stabilityDays: 10 })
    expect(rLow).toBeLessThan(rHigh)
  })

  it('clamps to [0, 1]', () => {
    const r = getItemRetention({ lastReviewedAt: 1, stabilityDays: 0.001 })
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThanOrEqual(1)
  })
})

// ── sortPoolByReviewUrgency ───────────────────────────────────────────────────
describe('sortPoolByReviewUrgency', () => {
  beforeEach(clearStore)

  it('returns same length as input', () => {
    const pool = makePool([0, 1, 2, 3, 4, 5])
    const sorted = sortPoolByReviewUrgency(pool, 'major')
    expect(sorted).toHaveLength(pool.length)
  })

  it('returns all original entries (no items lost)', () => {
    const pool = makePool([0, 1, 2, 3, 4, 5])
    const sorted = sortPoolByReviewUrgency(pool, 'major')
    const keys = sorted.map((p) => p.key).sort()
    expect(keys).toEqual(['0', '1', '2', '3', '4', '5'])
  })

  it('places overdue items before never-reviewed items on average', () => {
    const now = Date.now()
    // key "overdue" — reviewed 10 days ago, interval 1 day → very overdue
    updateReviewState('major', 'overdue', { correct: true, now: now - 10 * DAY_MS })
    // Force intervalDays to 1 by doing it fresh
    const root = JSON.parse(mockStore[REVIEW_STATE_KEY] || '{}')
    root['major']['overdue'].intervalDays = 1
    root['major']['overdue'].nextDueAt = (now - 10 * DAY_MS) + DAY_MS
    mockStore[REVIEW_STATE_KEY] = JSON.stringify(root)

    // key "fresh" — reviewed 1 hour ago, very long interval
    updateReviewState('major', 'fresh', { correct: true, now: now - 3600_000 })
    const root2 = JSON.parse(mockStore[REVIEW_STATE_KEY])
    root2['major']['fresh'].intervalDays = 30
    root2['major']['fresh'].nextDueAt = now + 29 * DAY_MS
    mockStore[REVIEW_STATE_KEY] = JSON.stringify(root2)

    const pool = makePool(['overdue', 'fresh', 'a', 'b', 'c', 'd'])
    // Run many times to average out jitter
    let overdueFirst = 0
    for (let i = 0; i < 50; i++) {
      const sorted = sortPoolByReviewUrgency(pool, 'major', now)
      if (sorted[0].key === 'overdue') overdueFirst++
    }
    // Overdue item should almost always sort first (>40 of 50 runs)
    expect(overdueFirst).toBeGreaterThan(40)
  })

  it('handles empty pool', () => {
    expect(sortPoolByReviewUrgency([], 'major')).toEqual([])
  })

  it('does not mutate the original pool array', () => {
    const pool = makePool([0, 1, 2, 3, 4, 5])
    const original = pool.map((p) => p.key)
    sortPoolByReviewUrgency(pool, 'major')
    expect(pool.map((p) => p.key)).toEqual(original)
  })
})
