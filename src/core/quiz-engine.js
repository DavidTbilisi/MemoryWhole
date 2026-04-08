function shuffle(items) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function createQuizEngine(deck, dataMap) {
  const pool = Object.entries(dataMap || {})
    .filter(([, v]) => typeof v === 'string' && v.trim())
    .map(([k, v]) => ({ key: String(k), value: v.trim() }))

  if (pool.length < 6) {
    throw new Error(`Deck '${deck}' needs at least 6 items to run quiz`)
  }

  const state = {
    deck,
    pool: shuffle(pool),
    currentIndex: 0,
    currentNum: '—',
    currentAnswer: '',
    options: [],
    answered: false,
    feedback: '',
    score: { correct: 0, wrong: 0 },
    numStats: {},
  }

  function loadQuestion() {
    const item = state.pool[state.currentIndex % state.pool.length]
    state.currentNum = item.key
    state.currentAnswer = item.value
    const wrongs = shuffle(state.pool.filter((p) => p.key !== item.key).map((p) => p.value)).slice(0, 5)
    state.options = shuffle([item.value, ...wrongs])
    state.answered = false
    state.feedback = ''
  }

  function answer(opt) {
    if (state.answered) return false
    state.answered = true
    const isCorrect = opt === state.currentAnswer

    state.numStats[state.currentNum] = state.numStats[state.currentNum] || { attempts: 0, correct: 0, wrong: 0 }
    state.numStats[state.currentNum].attempts += 1

    if (isCorrect) {
      state.score.correct += 1
      state.numStats[state.currentNum].correct += 1
      state.feedback = 'Correct'
    } else {
      state.score.wrong += 1
      state.numStats[state.currentNum].wrong += 1
      state.feedback = `Wrong - ${state.currentAnswer}`
    }
    return isCorrect
  }

  function next() {
    state.currentIndex += 1
    loadQuestion()
  }

  loadQuestion()
  return { state, answer, next }
}
