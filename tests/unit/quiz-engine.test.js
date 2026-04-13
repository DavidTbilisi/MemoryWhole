import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock spaced-repetition so tests are deterministic (no urgency sorting, no SR writes)
vi.mock('../../src/core/spaced-repetition', () => ({
  sortPoolByReviewUrgency: (_pool) => _pool,   // identity — preserve insertion order
  updateReviewState: vi.fn(),
}))

import { createQuizEngine } from '../../src/core/quiz-engine'
import { updateReviewState } from '../../src/core/spaced-repetition'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a dataMap with `n` entries keyed "0".."n-1". */
function makeMap(n, prefix = 'Val') {
  return Object.fromEntries(
    Array.from({ length: n }, (_, i) => [String(i), `${prefix}${i}`])
  )
}

// ── Pool construction ─────────────────────────────────────────────────────────
describe('createQuizEngine — pool construction', () => {
  it('throws when dataMap has fewer than 6 items', () => {
    expect(() => createQuizEngine('major', makeMap(5))).toThrow(/at least 6 items/)
  })

  it('throws on empty dataMap', () => {
    expect(() => createQuizEngine('major', {})).toThrow(/at least 6 items/)
  })

  it('throws when dataMap is null / undefined', () => {
    expect(() => createQuizEngine('major', null)).toThrow(/at least 6 items/)
  })

  it('does not throw with exactly 6 items', () => {
    expect(() => createQuizEngine('major', makeMap(6))).not.toThrow()
  })

  it('filters out entries with empty / whitespace values', () => {
    const map = { ...makeMap(6), bad1: '', bad2: '   ', bad3: null }
    // Should still work — only the 6 valid entries count
    expect(() => createQuizEngine('major', map)).not.toThrow()
  })

  it('trims whitespace from values', () => {
    const map = makeMap(6)
    map['0'] = '  Trimmed  '
    const { state } = createQuizEngine('major', map)
    const entry = state.pool.find((p) => p.key === '0')
    expect(entry.value).toBe('Trimmed')
  })
})

// ── Initial question ──────────────────────────────────────────────────────────
describe('createQuizEngine — initial question', () => {
  it('loads first question immediately after creation', () => {
    const { state } = createQuizEngine('major', makeMap(10))
    expect(state.currentNum).not.toBe('—')
    expect(state.currentAnswer).toBeTruthy()
  })

  it('options array has exactly 6 entries', () => {
    const { state } = createQuizEngine('major', makeMap(10))
    expect(state.options).toHaveLength(6)
  })

  it('correct answer is always among the options', () => {
    for (let run = 0; run < 20; run++) {
      const { state } = createQuizEngine('major', makeMap(10))
      expect(state.options).toContain(state.currentAnswer)
    }
  })

  it('options contains no duplicate values', () => {
    for (let run = 0; run < 20; run++) {
      const { state } = createQuizEngine('major', makeMap(10))
      expect(new Set(state.options).size).toBe(6)
    }
  })

  it('options never contain the same value as currentAnswer more than once', () => {
    const { state } = createQuizEngine('major', makeMap(10))
    const count = state.options.filter((o) => o === state.currentAnswer).length
    expect(count).toBe(1)
  })

  it('starts with answered = false', () => {
    const { state } = createQuizEngine('major', makeMap(10))
    expect(state.answered).toBe(false)
  })

  it('starts with score 0/0', () => {
    const { state } = createQuizEngine('major', makeMap(10))
    expect(state.score.correct).toBe(0)
    expect(state.score.wrong).toBe(0)
  })
})

// ── answer() — correct ────────────────────────────────────────────────────────
describe('createQuizEngine — answer() correct', () => {
  it('returns true for a correct answer', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    expect(answer(state.currentAnswer)).toBe(true)
  })

  it('increments score.correct', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    answer(state.currentAnswer)
    expect(state.score.correct).toBe(1)
    expect(state.score.wrong).toBe(0)
  })

  it('sets feedback to "Correct"', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    answer(state.currentAnswer)
    expect(state.feedback).toBe('Correct')
  })

  it('sets answered = true', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    answer(state.currentAnswer)
    expect(state.answered).toBe(true)
  })

  it('calling answer() again while answered is a no-op (returns false)', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    answer(state.currentAnswer)
    const result = answer(state.currentAnswer)
    expect(result).toBe(false)
    expect(state.score.correct).toBe(1)   // still 1, not 2
  })

  it('calls updateReviewState with correct=true', () => {
    vi.mocked(updateReviewState).mockClear()
    const { state, answer } = createQuizEngine('major', makeMap(10))
    answer(state.currentAnswer, 1500)
    expect(updateReviewState).toHaveBeenCalledWith(
      'major',
      state.currentNum,
      expect.objectContaining({ correct: true, responseMs: 1500 })
    )
  })
})

// ── answer() — wrong ──────────────────────────────────────────────────────────
describe('createQuizEngine — answer() wrong', () => {
  it('returns false for a wrong answer', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    const wrong = state.options.find((o) => o !== state.currentAnswer)
    expect(answer(wrong)).toBe(false)
  })

  it('increments score.wrong', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    const wrong = state.options.find((o) => o !== state.currentAnswer)
    answer(wrong)
    expect(state.score.wrong).toBe(1)
    expect(state.score.correct).toBe(0)
  })

  it('sets feedback to "Wrong - <correct answer>"', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    const correctAns = state.currentAnswer
    const wrong = state.options.find((o) => o !== correctAns)
    answer(wrong)
    expect(state.feedback).toBe(`Wrong - ${correctAns}`)
  })

  it('calls updateReviewState with correct=false', () => {
    vi.mocked(updateReviewState).mockClear()
    const { state, answer } = createQuizEngine('major', makeMap(10))
    const wrong = state.options.find((o) => o !== state.currentAnswer)
    answer(wrong)
    expect(updateReviewState).toHaveBeenCalledWith(
      'major',
      state.currentNum,
      expect.objectContaining({ correct: false })
    )
  })

  it('re-inserts failed item near the current position', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    const failedKey = state.currentNum
    const wrong = state.options.find((o) => o !== state.currentAnswer)
    answer(wrong)
    // Failed item should re-appear within the next 3 positions
    const upcoming = state.pool.slice(state.currentIndex, state.currentIndex + 4)
    expect(upcoming.some((p) => p.key === failedKey)).toBe(true)
  })
})

// ── next() ────────────────────────────────────────────────────────────────────
describe('createQuizEngine — next()', () => {
  it('advances to a new question', () => {
    const { state, answer, next } = createQuizEngine('major', makeMap(10))
    const firstKey = state.currentNum
    answer(state.currentAnswer)
    next()
    // With 10 items the second question is very likely different
    // (could theoretically be the same if re-inserted, but won't be here
    //  because the answer was correct and no reinsertion happens)
    expect(state.currentNum).not.toBe(firstKey)
  })

  it('resets answered to false after next()', () => {
    const { state, answer, next } = createQuizEngine('major', makeMap(10))
    answer(state.currentAnswer)
    next()
    expect(state.answered).toBe(false)
  })

  it('new options still contain the correct answer', () => {
    const { state, answer, next } = createQuizEngine('major', makeMap(10))
    answer(state.currentAnswer)
    next()
    expect(state.options).toContain(state.currentAnswer)
  })

  it('accumulates score across multiple questions', () => {
    const { state, answer, next } = createQuizEngine('major', makeMap(10))
    // Q1 correct
    answer(state.currentAnswer); next()
    // Q2 wrong
    const wrong = state.options.find((o) => o !== state.currentAnswer)
    answer(wrong); next()
    // Q3 correct
    answer(state.currentAnswer)
    expect(state.score.correct).toBe(2)
    expect(state.score.wrong).toBe(1)
  })
})

// ── numStats tracking ─────────────────────────────────────────────────────────
describe('createQuizEngine — numStats', () => {
  it('records attempt in numStats for the answered key', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    const key = state.currentNum
    answer(state.currentAnswer)
    expect(state.numStats[key].attempts).toBe(1)
    expect(state.numStats[key].correct).toBe(1)
    expect(state.numStats[key].wrong).toBe(0)
  })

  it('records wrong attempt in numStats', () => {
    const { state, answer } = createQuizEngine('major', makeMap(10))
    const key = state.currentNum
    const wrong = state.options.find((o) => o !== state.currentAnswer)
    answer(wrong)
    expect(state.numStats[key].wrong).toBe(1)
    expect(state.numStats[key].correct).toBe(0)
  })
})
