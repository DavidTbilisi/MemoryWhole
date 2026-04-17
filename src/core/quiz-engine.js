import { getPaoSceneImagesSync } from './deck-loader'
import { sortPoolByReviewUrgency, updateReviewState } from './spaced-repetition'

function shuffle(items) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function createQuizEngine(deck, dataMap) {
  let pool = []

  if (deck === 'pao') {
    pool = Object.entries(dataMap || {})
      .filter(([, v]) => typeof v === 'string' && v.trim())
      .map(([k, v]) => ({
        key: String(k).padStart(3, '0'),
        value: v.trim(),
        images: getPaoSceneImagesSync(k),
      }))
  } else {
    pool = Object.entries(dataMap || {})
      .filter(([, v]) => typeof v === 'string' && v.trim())
      .map(([k, v]) => ({ key: String(k), value: v.trim() }))
  }

  if (pool.length < 6) {
    throw new Error(`Deck '${deck}' needs at least 6 items to run quiz`)
  }

  const state = {
    deck,
    pool: sortPoolByReviewUrgency(shuffle(pool), deck),
    currentIndex: 0,
    currentNum: '—',
    currentAnswer: null,
    currentImages: {},
    options: [],
    answered: false,
    feedback: '',
    score: { correct: 0, wrong: 0 },
    numStats: {},
  }

  function loadQuestion() {
    const item = state.pool[state.currentIndex % state.pool.length]
    state.currentNum = item.key
    state.currentAnswer = deck === 'pao' ? item : item.value
    state.currentImages = item.images || {}

    if (deck === 'pao') {
      const wrongs = shuffle(state.pool.filter((p) => p.key !== item.key)).slice(0, 5)
      state.options = shuffle([item, ...wrongs])
    } else {
      const wrongs = shuffle(state.pool.filter((p) => p.key !== item.key).map((p) => p.value)).slice(0, 5)
      state.options = shuffle([item.value, ...wrongs])
    }

    state.answered = false
    state.feedback = ''
  }

  function answer(opt, responseMs = 0) {
    if (state.answered) return false

    state.answered = true
    const isCorrect = deck === 'pao'
      ? opt?.key === state.currentNum
      : opt === state.currentAnswer

    state.numStats[state.currentNum] = state.numStats[state.currentNum] || { attempts: 0, correct: 0, wrong: 0 }
    state.numStats[state.currentNum].attempts += 1

    if (isCorrect) {
      state.score.correct += 1
      state.numStats[state.currentNum].correct += 1
      state.feedback = 'Correct'
    } else {
      state.score.wrong += 1
      state.numStats[state.currentNum].wrong += 1
      state.feedback = `Wrong - ${deck === 'pao' ? state.currentAnswer?.value || '' : state.currentAnswer}`

      const itemIdx = state.pool.findIndex((item) => item.key === state.currentNum)
      if (itemIdx >= 0) {
        const [failedItem] = state.pool.splice(itemIdx, 1)
        const insertAt = Math.min(state.currentIndex + 3, state.pool.length)
        state.pool.splice(insertAt, 0, failedItem)
      }
    }

    updateReviewState(state.deck, state.currentNum, { correct: isCorrect, responseMs })
    return isCorrect
  }

  function next() {
    state.currentIndex += 1
    loadQuestion()
  }

  loadQuestion()
  return { state, answer, next }
}
