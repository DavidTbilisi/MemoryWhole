import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Storage mock ────────────────────────────────────────────────────────────
// Hoist the store so the vi.mock factory can close over the same object
// that beforeEach clears between tests.
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

// window.dispatchEvent is called by notifyStatsUpdated()
vi.stubGlobal('window', { dispatchEvent: vi.fn() })

import {
  recordCompetitionResult,
  getDeckCompetitionRecords,
  COMPETITION_RECORDS_KEY,
} from '../../src/core/analytics'

// ── Helpers ─────────────────────────────────────────────────────────────────
function makePayload(overrides = {}) {
  return {
    itemCount: 10,
    studySpeedSec: 3,
    correct: 8,
    wrong: 2,
    itemResults: [
      { key: '0', correctValue: 'Saw',   chosenValue: 'Saw',  isCorrect: true },
      { key: '1', correctValue: 'Tie',   chosenValue: 'Day',  isCorrect: false },
    ],
    ...overrides,
  }
}

// ── getDeckCompetitionRecords ────────────────────────────────────────────────
describe('getDeckCompetitionRecords', () => {
  beforeEach(() => { for (const k in mockStore) delete mockStore[k] })

  it('returns zero-value default when no data stored', () => {
    const rec = getDeckCompetitionRecords('major')
    expect(rec.totalRuns).toBe(0)
    expect(rec.bestScore).toBe(0)
    expect(rec.bestAccuracy).toBe(0)
    expect(rec.bestItemCount).toBe(0)
    expect(rec.history).toEqual([])
  })

  it('returns stored data after a run is recorded', () => {
    recordCompetitionResult('major', makePayload())
    const rec = getDeckCompetitionRecords('major')
    expect(rec.totalRuns).toBe(1)
  })

  it('returns zero-value default for an unknown deck even when others have data', () => {
    recordCompetitionResult('major', makePayload())
    const rec = getDeckCompetitionRecords('pao')
    expect(rec.totalRuns).toBe(0)
  })
})

// ── recordCompetitionResult ──────────────────────────────────────────────────
describe('recordCompetitionResult — basic recording', () => {
  beforeEach(() => { for (const k in mockStore) delete mockStore[k] })

  it('returns stored record fields', () => {
    const r = recordCompetitionResult('major', makePayload())
    expect(r.totalRuns).toBe(1)
    expect(r.bestScore).toBe(8)
    expect(r.bestAccuracy).toBe(80)
    expect(r.bestItemCount).toBe(10)
  })

  it('stores one history entry on first run', () => {
    recordCompetitionResult('major', makePayload())
    const rec = getDeckCompetitionRecords('major')
    expect(rec.history).toHaveLength(1)
  })

  it('history entry contains all expected fields', () => {
    const p = makePayload({ correct: 7, wrong: 3, itemCount: 10, studySpeedSec: 5 })
    recordCompetitionResult('major', p)
    const entry = getDeckCompetitionRecords('major').history[0]
    expect(entry.correct).toBe(7)
    expect(entry.wrong).toBe(3)
    expect(entry.itemCount).toBe(10)
    expect(entry.studySpeedSec).toBe(5)
    expect(entry.score).toBe(7)           // score = correct count
    expect(entry.accuracy).toBeCloseTo(70.0, 1)
    expect(typeof entry.ts).toBe('number')
    expect(Array.isArray(entry.itemResults)).toBe(true)
  })

  it('increments totalRuns on each call', () => {
    recordCompetitionResult('major', makePayload())
    recordCompetitionResult('major', makePayload())
    recordCompetitionResult('major', makePayload())
    expect(getDeckCompetitionRecords('major').totalRuns).toBe(3)
  })

  it('prepends new entries (newest first in history)', () => {
    recordCompetitionResult('major', makePayload({ correct: 3 }))
    recordCompetitionResult('major', makePayload({ correct: 9 }))
    const { history } = getDeckCompetitionRecords('major')
    expect(history[0].correct).toBe(9)
    expect(history[1].correct).toBe(3)
  })

  it('is isolated per deck', () => {
    recordCompetitionResult('major', makePayload({ correct: 10 }))
    recordCompetitionResult('pao',   makePayload({ correct: 5  }))
    expect(getDeckCompetitionRecords('major').bestScore).toBe(10)
    expect(getDeckCompetitionRecords('pao').bestScore).toBe(5)
    expect(getDeckCompetitionRecords('major').totalRuns).toBe(1)
    expect(getDeckCompetitionRecords('pao').totalRuns).toBe(1)
  })
})

// ── bestScore / bestAccuracy / bestItemCount tracking ───────────────────────
describe('recordCompetitionResult — personal bests', () => {
  beforeEach(() => { for (const k in mockStore) delete mockStore[k] })

  it('updates bestScore when new score is higher', () => {
    recordCompetitionResult('major', makePayload({ correct: 6, wrong: 4 }))
    recordCompetitionResult('major', makePayload({ correct: 9, wrong: 1 }))
    expect(getDeckCompetitionRecords('major').bestScore).toBe(9)
  })

  it('keeps bestScore when new score is lower', () => {
    recordCompetitionResult('major', makePayload({ correct: 9, wrong: 1 }))
    recordCompetitionResult('major', makePayload({ correct: 4, wrong: 6 }))
    expect(getDeckCompetitionRecords('major').bestScore).toBe(9)
  })

  it('updates bestAccuracy when new accuracy is higher', () => {
    recordCompetitionResult('major', makePayload({ correct: 5, wrong: 5 }))  // 50%
    recordCompetitionResult('major', makePayload({ correct: 9, wrong: 1 }))  // 90%
    expect(getDeckCompetitionRecords('major').bestAccuracy).toBe(90)
  })

  it('keeps bestAccuracy when new accuracy is lower', () => {
    recordCompetitionResult('major', makePayload({ correct: 9, wrong: 1 }))  // 90%
    recordCompetitionResult('major', makePayload({ correct: 5, wrong: 5 }))  // 50%
    expect(getDeckCompetitionRecords('major').bestAccuracy).toBe(90)
  })

  it('updates bestItemCount when new itemCount is larger', () => {
    recordCompetitionResult('major', makePayload({ itemCount: 10 }))
    recordCompetitionResult('major', makePayload({ itemCount: 20 }))
    expect(getDeckCompetitionRecords('major').bestItemCount).toBe(20)
  })

  it('keeps bestItemCount when smaller', () => {
    recordCompetitionResult('major', makePayload({ itemCount: 50 }))
    recordCompetitionResult('major', makePayload({ itemCount: 10 }))
    expect(getDeckCompetitionRecords('major').bestItemCount).toBe(50)
  })
})

// ── accuracy calculation ─────────────────────────────────────────────────────
describe('recordCompetitionResult — accuracy', () => {
  beforeEach(() => { for (const k in mockStore) delete mockStore[k] })

  it('100% when all correct', () => {
    recordCompetitionResult('major', makePayload({ correct: 10, wrong: 0 }))
    expect(getDeckCompetitionRecords('major').bestAccuracy).toBe(100)
  })

  it('0% when all wrong', () => {
    recordCompetitionResult('major', makePayload({ correct: 0, wrong: 10 }))
    expect(getDeckCompetitionRecords('major').bestAccuracy).toBe(0)
  })

  it('0% when no attempts', () => {
    recordCompetitionResult('major', makePayload({ correct: 0, wrong: 0, itemCount: 0 }))
    expect(getDeckCompetitionRecords('major').bestAccuracy).toBe(0)
  })

  it('rounds to 2 decimal places', () => {
    // 1/3 = 33.33%
    recordCompetitionResult('major', makePayload({ correct: 1, wrong: 2 }))
    const entry = getDeckCompetitionRecords('major').history[0]
    expect(entry.accuracy).toBeCloseTo(33.33, 1)
  })
})

// ── history capping ──────────────────────────────────────────────────────────
describe('recordCompetitionResult — history cap', () => {
  beforeEach(() => { for (const k in mockStore) delete mockStore[k] })

  it('caps history at 100 entries', () => {
    for (let i = 0; i < 105; i++) {
      recordCompetitionResult('major', makePayload({ correct: i % 10 }))
    }
    expect(getDeckCompetitionRecords('major').history).toHaveLength(100)
  })

  it('newest entry is first after capping', () => {
    for (let i = 0; i < 105; i++) {
      recordCompetitionResult('major', makePayload({ correct: i % 10 }))
    }
    // The last run had correct = 104 % 10 = 4
    expect(getDeckCompetitionRecords('major').history[0].correct).toBe(4)
  })
})

// ── return value ─────────────────────────────────────────────────────────────
describe('recordCompetitionResult — return value', () => {
  beforeEach(() => { for (const k in mockStore) delete mockStore[k] })

  it('returns previousRun=null on first call', () => {
    const r = recordCompetitionResult('major', makePayload())
    expect(r.previousRun).toBeNull()
  })

  it('returns previousRun as first history entry on second call', () => {
    recordCompetitionResult('major', makePayload({ correct: 3 }))
    const r = recordCompetitionResult('major', makePayload({ correct: 8 }))
    expect(r.previousRun).not.toBeNull()
    expect(r.previousRun.correct).toBe(3)
  })

  it('returns recentRuns array (newest first)', () => {
    recordCompetitionResult('major', makePayload({ correct: 2 }))
    recordCompetitionResult('major', makePayload({ correct: 5 }))
    const r = recordCompetitionResult('major', makePayload({ correct: 9 }))
    expect(r.recentRuns[0].correct).toBe(9)
    expect(r.recentRuns[1].correct).toBe(5)
    expect(r.recentRuns[2].correct).toBe(2)
  })

  it('fires notifyStatsUpdated (window.dispatchEvent called)', () => {
    const spy = vi.mocked(window.dispatchEvent)
    spy.mockClear()
    recordCompetitionResult('major', makePayload())
    expect(spy).toHaveBeenCalled()
  })
})

// ── itemResults stored ───────────────────────────────────────────────────────
describe('recordCompetitionResult — itemResults', () => {
  beforeEach(() => { for (const k in mockStore) delete mockStore[k] })

  it('stores itemResults in history entry', () => {
    const results = [
      { key: '42', correctValue: 'Rain', chosenValue: 'Rain', isCorrect: true },
      { key: '07', correctValue: 'Cage', chosenValue: 'Hook', isCorrect: false },
    ]
    recordCompetitionResult('major', makePayload({ itemResults: results }))
    const entry = getDeckCompetitionRecords('major').history[0]
    expect(entry.itemResults).toHaveLength(2)
    expect(entry.itemResults[0].key).toBe('42')
    expect(entry.itemResults[1].isCorrect).toBe(false)
  })

  it('stores empty array when itemResults not provided', () => {
    const payload = makePayload()
    delete payload.itemResults
    recordCompetitionResult('major', payload)
    const entry = getDeckCompetitionRecords('major').history[0]
    expect(entry.itemResults).toEqual([])
  })
})
