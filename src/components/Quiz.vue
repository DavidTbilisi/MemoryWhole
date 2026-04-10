<template>
  <div class="w-full rounded-2xl border border-slate-700/70 bg-gradient-to-b from-[#0b1b2b] to-[#071421] p-4 text-sky-100 md:p-6">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-black tracking-tight md:text-2xl">
          {{ isDrillMode ? 'Speed Drill' : 'Quiz' }}: {{ deck }}
        </h2>
        <p class="mt-1 text-xs text-slate-400 md:text-sm">Use A/S/D then J/K (or Q/W/E then H/L). 1-6 also works. Enter for next.</p>
      </div>
      <div class="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
        6 options
      </div>
    </div>

    <div v-if="!running" class="rounded-2xl border border-slate-700/60 bg-slate-900/35 p-6">
      <template v-if="startupError">
        <p class="mb-4 text-sm text-rose-300">{{ startupError }}</p>
        <div class="flex flex-wrap gap-3">
          <button v-tooltip="'Retry Loading Quiz'" @click="startQuiz" class="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/30 transition hover:brightness-110">Retry</button>
          <button v-tooltip="'Return to Home'" @click="$emit('back')" class="rounded-xl border border-slate-600 bg-slate-900/50 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Back</button>
        </div>
      </template>
      <template v-else>
        <p class="text-sm text-slate-300">Preparing {{ isDrillMode ? 'speed drill' : 'quiz' }}...</p>
      </template>
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div class="rounded-2xl border border-cyan-500/30 bg-cyan-900/15 p-3">
          <div class="mb-2 text-xs uppercase tracking-wider text-cyan-200/80">Performance</div>
          <div class="flex items-center gap-3">
            <div class="relative h-16 w-16 rounded-full" :style="accuracyRingStyle">
              <div class="absolute inset-[6px] rounded-full bg-[#071421]"></div>
              <div class="absolute inset-0 grid place-items-center text-xs font-bold text-cyan-100">{{ accuracyPct }}%</div>
            </div>
            <div class="min-w-0 flex-1 space-y-1 text-xs text-slate-300">
              <div class="flex items-center justify-between"><span>Correct</span><strong class="text-emerald-300">{{ score.correct }}</strong></div>
              <div class="flex items-center justify-between"><span>Wrong</span><strong class="text-rose-300">{{ score.wrong }}</strong></div>
              <div class="flex items-center justify-between"><span>Streak</span><strong class="text-sky-300 tabular-nums inline-block min-w-8 text-right">{{ streak }}</strong></div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-violet-500/30 bg-violet-900/15 p-3 md:col-span-2">
          <div class="mb-2 text-xs uppercase tracking-wider text-violet-200/80">Session Progress</div>
          <div class="mb-2 flex items-center justify-between text-xs text-slate-300">
            <span>{{ questionLabel }}</span>
            <span>{{ isDrillMode ? `Score ${drillScore}` : `Avg ${avgLabel}` }}</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-800">
            <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-300" :style="{ width: progressPct + '%' }"></div>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-800/80">
            <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300" :style="{ width: accuracyPct + '%' }"></div>
          </div>
          <div class="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Deck loop</span>
            <span>Accuracy</span>
          </div>
        </div>
      </div>

      <div v-if="isDrillMode" class="rounded-2xl border border-amber-500/30 bg-amber-900/15 p-3">
        <div class="mb-2 text-xs uppercase tracking-wider text-amber-200/80">Drill Clock</div>
        <div class="flex items-center gap-4">
          <div class="relative h-20 w-20 rounded-full" :style="timerRingStyle">
            <div class="absolute inset-[7px] rounded-full bg-[#071421]"></div>
            <div class="absolute inset-0 grid place-items-center text-xs font-bold text-amber-100">{{ drillSecondsLabel }}s</div>
          </div>
          <div class="grid flex-1 grid-cols-3 gap-2 text-xs">
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/50 p-2 text-center text-slate-300">Score<br><strong class="text-amber-200">{{ drillScore }}</strong></div>
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/50 p-2 text-center text-slate-300">Multiplier<br><strong class="text-amber-200">×{{ drillMultiplier }}</strong></div>
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/50 p-2 text-center text-slate-300">Best Streak<br><strong class="text-amber-200">{{ drillMaxStreak }}</strong></div>
          </div>
        </div>
      </div>

      <div class="h-6 relative" aria-live="polite">
        <Transition name="streak-pop">
          <div v-if="streakPopVisible" class="absolute left-0 top-0 inline-flex w-fit rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">+1 streak</div>
        </Transition>
      </div>

      <div :class="['rounded-2xl border border-slate-700/70 bg-slate-900/35 p-4 md:p-6 transition-all duration-200', questionPulseClass]">
        <Transition name="qslide" mode="out-in">
          <div :key="`q-${questionIndex}-${currentNum}`">
            <div class="mb-4 flex items-start justify-between gap-3">
              <div>
                <div class="text-xs uppercase tracking-wider text-slate-400">Recall This Prompt</div>
                <div class="mt-1 text-4xl font-extrabold leading-none text-cyan-200 md:text-5xl">{{ currentNum }}</div>
              </div>
              <div class="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-400">
                Shortcut: rows A/S/D + cols J/K (or Q/W/E + H/L)
              </div>
            </div>

            <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
              <button
                v-for="(opt, idx) in options"
                :key="idx"
                :disabled="answered"
                @click="choose(opt)"
                :class="optionClass(opt, idx)"
              >
                <!-- Check if dual images (audio + visual) -->
                <template v-if="optionHasDualImages(opt)">
                  <img
                    :src="optionAudioImage(opt)"
                    :alt="`${opt} - Audio`"
                    class="absolute left-0 top-0 h-full w-1/2 object-contain p-1"
                    @error="onOptionImageError($event, opt)"
                  />
                  <img
                    :src="optionVisualImage(opt)"
                    :alt="`${opt} - Visual`"
                    class="absolute right-0 top-0 h-full w-1/2 object-contain p-1"
                    @error="onOptionImageError($event, opt)"
                  />
                </template>
                <!-- Single image fallback -->
                <img
                  v-else
                  :src="optionImage(opt)"
                  :alt="opt"
                  class="absolute inset-0 h-full w-full object-contain p-1"
                  @error="onOptionImageError($event, opt)"
                />
                <div class="absolute inset-0" :class="optionOverlayClass(opt, idx)"></div>
                <div class="relative z-10 flex h-full w-full items-end p-2">
                  <span class="truncate rounded bg-slate-900/70 px-2 py-1 text-xs md:text-sm">{{ opt }}</span>
                </div>
              </button>
            </div>

            <div class="mt-3 min-h-6 text-sm" :class="feedbackClass">{{ feedback || 'Choose the best answer.' }}</div>
          </div>
        </Transition>
      </div>

      <div class="flex flex-wrap gap-2">
        <button v-tooltip="'Return to Home'" class="rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800" @click="$emit('back')">Back</button>
        <button v-tooltip="'Next Question (Enter)'" class="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700" @click="nextQuestion">Next</button>
        <button v-tooltip="'Save Session Results'" class="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-400 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:brightness-110" @click="finish">Finish and Save</button>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500">
        <label v-tooltip="'Automatically advance to next question'" class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-2 py-1">
          <input v-model="autoAdvance" type="checkbox" class="h-4 w-4 accent-cyan-500" />
          <span class="text-slate-300">Auto-next ({{ autoAdvanceMs }}ms)</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import { getDeckEmojiMapSync, getDeckImagesSync, loadDeckData, makeEmojiFallbackDataUri, makeSimpleEmojiFallbackDataUri } from '../core/deck-loader'
import { createQuizEngine } from '../core/quiz-engine'
import { recordDrillResult, recordSession } from '../core/analytics'

export default {
  name: 'Quiz',
  props: {
    deck: { type: String, default: 'major' },
    subsetKeys: { type: Array, default: () => [] },
    mode: { type: String, default: 'quiz' },
    drillDuration: { type: Number, default: 60 }
  },
  data() {
    return {
      running: false,
      engine: null,
      currentNum: '-',
      currentAnswer: '',
      imageMap: {},
      emojiMap: {},
      valueToKey: {},
      options: [],
      answered: false,
      feedback: '',
      score: { correct: 0, wrong: 0 },
      streak: 0,
      attemptsAnswered: 0,
      numStats: {},
      selectedOption: '',
      loopSize: 0,
      questionIndex: 0,
      autoAdvance: true,
      autoAdvanceMs: 700,
      autoAdvanceTimer: null,
      questionPulseClass: '',
      streakPopVisible: false,
      streakTimer: null,
      drillTimeLeftMs: 0,
      drillTimer: null,
      drillScore: 0,
      drillMaxStreak: 0,
      answerTimeStartMs: 0,
      totalAnswerTimeMs: 0,
      answeredCount: 0,
      startupError: '',
      isFinishing: false,
      ergonomicRowIdx: null,
      ergonomicColIdx: null,
      ergonomicTimer: null,
    }
  },
  computed: {
    isDrillMode() {
      return this.mode === 'drill'
    },
    drillSecondsLabel() {
      return (Math.max(0, this.drillTimeLeftMs) / 1000).toFixed(1)
    },
    drillMultiplier() {
      if (this.streak >= 9) return 4
      if (this.streak >= 6) return 3
      if (this.streak >= 3) return 2
      return 1
    },
    accuracyPct() {
      const attempts = Number(this.score.correct || 0) + Number(this.score.wrong || 0)
      if (!attempts) return 0
      return Math.round((Number(this.score.correct || 0) / attempts) * 100)
    },
    accuracyRingStyle() {
      return {
        background: `conic-gradient(#22d3ee ${this.accuracyPct * 3.6}deg, rgba(15,23,42,0.9) 0deg)`
      }
    },
    timerPct() {
      const total = Math.max(1, Number(this.drillDuration || 60) * 1000)
      return Math.round((Math.max(0, this.drillTimeLeftMs) / total) * 100)
    },
    timerRingStyle() {
      return {
        background: `conic-gradient(#f59e0b ${this.timerPct * 3.6}deg, rgba(15,23,42,0.9) 0deg)`
      }
    },
    avgLabel() {
      if (!this.attemptsAnswered) return '-'
      return `${Math.round((this.score.correct / this.attemptsAnswered) * 100)}%`
    },
    progressPct() {
      if (!this.loopSize) return 0
      return Math.round(((this.questionIndex + 1) / this.loopSize) * 100)
    },
    questionLabel() {
      if (!this.loopSize) return '-'
      return `${this.questionIndex + 1} / ${this.loopSize}`
    },
    feedbackClass() {
      if (!this.feedback) return 'text-slate-400'
      if (this.feedback.startsWith('Correct')) return 'text-emerald-300'
      if (this.feedback.startsWith('Wrong')) return 'text-rose-300'
      return 'text-slate-300'
    }
  },
  methods: {
    clearTimers() {
      if (this.autoAdvanceTimer) {
        clearTimeout(this.autoAdvanceTimer)
        this.autoAdvanceTimer = null
      }
      if (this.streakTimer) {
        clearTimeout(this.streakTimer)
        this.streakTimer = null
      }
      if (this.drillTimer) {
        clearInterval(this.drillTimer)
        this.drillTimer = null
      }
      if (this.ergonomicTimer) {
        clearTimeout(this.ergonomicTimer)
        this.ergonomicTimer = null
      }
      this.ergonomicRowIdx = null
      this.ergonomicColIdx = null
    },
    rowIndexFromKey(key) {
      const map = {
        a: 0,
        s: 1,
        d: 2,
        q: 0,
        w: 1,
        e: 2,
      }
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null
    },
    colIndexFromKey(key) {
      const map = {
        j: 0,
        k: 1,
        h: 0,
        l: 1,
      }
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null
    },
    armErgonomicSelection() {
      if (this.ergonomicTimer) clearTimeout(this.ergonomicTimer)
      this.ergonomicTimer = setTimeout(() => {
        this.ergonomicTimer = null
        this.ergonomicRowIdx = null
        this.ergonomicColIdx = null
      }, 1100)
    },
    tryErgonomicChoice(key) {
      if (this.answered) return false
      const rowIdx = this.rowIndexFromKey(key)
      const colIdx = this.colIndexFromKey(key)
      if (rowIdx === null && colIdx === null) return false

      if (rowIdx !== null) this.ergonomicRowIdx = rowIdx
      if (colIdx !== null) this.ergonomicColIdx = colIdx
      this.armErgonomicSelection()

      if (this.ergonomicRowIdx === null || this.ergonomicColIdx === null) return true

      const idx = (this.ergonomicRowIdx * 2) + this.ergonomicColIdx
      this.ergonomicRowIdx = null
      this.ergonomicColIdx = null
      if (this.ergonomicTimer) {
        clearTimeout(this.ergonomicTimer)
        this.ergonomicTimer = null
      }

      if (idx >= 0 && idx < this.options.length) {
        this.choose(this.options[idx])
      }
      return true
    },
    syncFromEngine() {
      const st = this.engine?.state
      if (!st) return
      this.currentNum = st.currentNum
      this.currentAnswer = st.currentAnswer
      this.options = st.options
      this.answered = st.answered
      this.feedback = st.feedback
      this.score = { ...st.score }
      this.numStats = { ...st.numStats }
      this.loopSize = st.pool?.length || 0
      this.questionIndex = (st.currentIndex || 0) % (this.loopSize || 1)
      if (!this.answered) this.answerTimeStartMs = Date.now()
    },
    optionClass(opt, idx) {
      const base = 'relative h-28 overflow-hidden rounded-xl border text-left text-sm font-semibold transition duration-150 disabled:cursor-not-allowed md:h-36'
      if (!this.answered) {
        return `${base} border-slate-700 text-cyan-100 hover:border-cyan-500/60`
      }
      if (opt === this.currentAnswer) {
        return `${base} border-emerald-500 text-emerald-100 option-reveal-correct`
      }
      if (opt === this.selectedOption && opt !== this.currentAnswer) {
        return `${base} border-rose-500 text-rose-100 option-reveal-wrong`
      }
      return `${base} border-slate-700 text-slate-400`
    },
    optionOverlayClass(opt, idx) {
      if (!this.answered) return 'bg-slate-950/45'
      if (opt === this.currentAnswer) return 'bg-emerald-900/38'
      if (opt === this.selectedOption && opt !== this.currentAnswer) return 'bg-rose-900/42'
      return 'bg-slate-950/62'
    },
    optionKeyForLabel(opt) {
      return this.valueToKey[String(opt)] || ''
    },
    optionImage(opt) {
      const key = this.optionKeyForLabel(opt)
      if (!key) return makeEmojiFallbackDataUri('🧩')
      const img = this.imageMap[String(key)]
      const emoji = this.emojiMap[String(key)] || '🧩'
      
      // If image is a generated default (verbose SVG) and emoji exists, use simple emoji fallback
      if (img && typeof img === 'string' && img.includes('Replace via Editor') && emoji) {
        return makeSimpleEmojiFallbackDataUri(emoji)
      }
      return (typeof img === 'string' ? img : null) || makeEmojiFallbackDataUri(emoji)
    },
    optionHasDualImages(opt) {
      const key = this.optionKeyForLabel(opt)
      if (!key) return false
      const img = this.imageMap[String(key)]
      return img && typeof img === 'object' && img.audio && img.visual
    },
    optionAudioImage(opt) {
      const key = this.optionKeyForLabel(opt)
      if (!key) return makeEmojiFallbackDataUri('🔊')
      const img = this.imageMap[String(key)]
      if (img && typeof img === 'object' && img.audio) {
        return img.audio
      }
      return makeEmojiFallbackDataUri('🔊')
    },
    optionVisualImage(opt) {
      const key = this.optionKeyForLabel(opt)
      if (!key) return makeEmojiFallbackDataUri('👁️')
      const img = this.imageMap[String(key)]
      if (img && typeof img === 'object' && img.visual) {
        return img.visual
      }
      return makeEmojiFallbackDataUri('👁️')
    },
    buildValueToKeyMap(dataMap) {
      const out = {}
      for (const [key, value] of Object.entries(dataMap || {})) {
        const text = String(value || '').trim()
        if (!text) continue
        if (!(text in out)) out[text] = String(key)
      }
      return out
    },
    async startQuiz() {
      try {
        this.startupError = ''
        const data = await loadDeckData(this.deck)
        this.imageMap = getDeckImagesSync(this.deck)
        this.emojiMap = getDeckEmojiMapSync(this.deck)
        const scoped = this.subsetKeys.length
          ? Object.fromEntries(Object.entries(data).filter(([k]) => this.subsetKeys.includes(String(k)) || this.subsetKeys.includes(String(k).padStart(2, '0'))))
          : data
        this.valueToKey = this.buildValueToKeyMap(scoped)
        this.engine = createQuizEngine(this.deck, scoped)
        this.running = true
        this.streak = 0
        this.attemptsAnswered = 0
        this.selectedOption = ''
        this.streakPopVisible = false
        this.drillScore = 0
        this.drillMaxStreak = 0
        this.totalAnswerTimeMs = 0
        this.answeredCount = 0
        this.drillTimeLeftMs = Math.max(1, Number(this.drillDuration || 60)) * 1000
        this.clearTimers()
        if (this.isDrillMode) {
          this.drillTimer = setInterval(() => {
            this.drillTimeLeftMs = Math.max(0, this.drillTimeLeftMs - 100)
            if (this.drillTimeLeftMs <= 0 && !this.isFinishing) {
              this.drillTimeLeftMs = 0
              this.finish('timeout')
            }
          }, 100)
        }
        this.syncFromEngine()
      } catch (e) {
        console.error(e)
        this.startupError = e?.message || 'Failed to start quiz.'
      }
    },
    onOptionImageError(event, opt) {
      const img = event?.target
      if (!img || img.dataset.fallbackApplied === '1') return
      img.dataset.fallbackApplied = '1'
      const key = this.optionKeyForLabel(opt)
      const emoji = this.emojiMap[String(key)] || '🧩'
      img.src = makeEmojiFallbackDataUri(emoji)
    },
    choose(opt) {
      if (!this.engine) return
      if (this.autoAdvanceTimer) {
        clearTimeout(this.autoAdvanceTimer)
        this.autoAdvanceTimer = null
      }
      this.selectedOption = opt
      const elapsedMs = this.answerTimeStartMs ? Math.max(1, Date.now() - this.answerTimeStartMs) : 0
      const isCorrect = this.engine.answer(opt, elapsedMs)
      if (typeof isCorrect === 'boolean') {
        this.attemptsAnswered += 1
        this.answeredCount += 1
        this.totalAnswerTimeMs += elapsedMs
        this.streak = isCorrect ? this.streak + 1 : 0
        this.drillMaxStreak = Math.max(this.drillMaxStreak, this.streak)
        if (this.isDrillMode && isCorrect) this.drillScore += this.drillMultiplier
        this.questionPulseClass = isCorrect ? 'quiz-pulse-correct' : 'quiz-pulse-wrong'
        if (isCorrect) {
          this.streakPopVisible = true
          if (this.streakTimer) clearTimeout(this.streakTimer)
          this.streakTimer = setTimeout(() => {
            this.streakPopVisible = false
          }, 480)
        } else {
          this.streakPopVisible = false
          if (this.streakTimer) {
            clearTimeout(this.streakTimer)
            this.streakTimer = null
          }
        }
        if (this.autoAdvance) {
          this.autoAdvanceTimer = setTimeout(() => {
            if (this.running && this.answered) this.nextQuestion()
          }, this.autoAdvanceMs)
        }
      }
      this.syncFromEngine()
    },
    nextQuestion() {
      if (!this.engine) return
      if (this.autoAdvanceTimer) {
        clearTimeout(this.autoAdvanceTimer)
        this.autoAdvanceTimer = null
      }
      this.ergonomicRowIdx = null
      this.ergonomicColIdx = null
      if (this.ergonomicTimer) {
        clearTimeout(this.ergonomicTimer)
        this.ergonomicTimer = null
      }
      this.engine.next()
      this.selectedOption = ''
      this.questionPulseClass = ''
      this.syncFromEngine()
    },
    finish(reason = 'manual') {
      try {
        if (!this.engine || this.isFinishing) return
        this.isFinishing = true
        this.clearTimers()

        const saved = this.isDrillMode
          ? (() => {
              const avgResponseMs = this.answeredCount > 0 ? Math.round(this.totalAnswerTimeMs / this.answeredCount) : 0
              const totalMs = Number(this.drillDuration || 60) * 1000
              const timeUsedMs = reason === 'timeout'
                ? totalMs
                : Math.max(0, totalMs - this.drillTimeLeftMs)
              recordSession(this.deck, this.engine.state.numStats)
              const drillTotals = recordDrillResult(this.deck, {
                score: this.drillScore,
                correct: this.score.correct,
                wrong: this.score.wrong,
                maxStreak: this.drillMaxStreak,
                avgResponseMs,
                timeUsedMs,
              })
              return {
                mode: 'drill',
                attempts: this.score.correct + this.score.wrong,
                correct: this.score.correct,
                wrong: this.score.wrong,
                accuracy: this.accuracyPct,
                score: this.drillScore,
                maxStreak: this.drillMaxStreak,
                avgResponseMs,
                timeUsedMs,
                bestScore: drillTotals.bestScore,
                totalDrills: drillTotals.totalDrills,
                previousDrill: drillTotals.previousDrill,
                recentDrills: drillTotals.recentDrills,
                lastSavedTs: Date.now(),
              }
            })()
          : recordSession(this.deck, this.engine.state.numStats)

        this.running = false
        this.engine = null
        this.selectedOption = ''
        this.questionPulseClass = ''
        this.streakPopVisible = false
        this.isFinishing = false
        this.$emit('finished', { deck: this.deck, ...saved })
      } catch (e) {
        console.error(e)
        this.isFinishing = false
        alert('Save failed')
      }
    },
    onKeydown(e) {
      if (!this.running) return

      const activeEl = document.activeElement
      if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) return

      const key = String(e.key || '').toLowerCase()

      if (!this.answered && this.tryErgonomicChoice(key)) {
        e.preventDefault()
        return
      }

      if (!this.answered && /^[1-6]$/.test(key)) {
        const idx = Number(key) - 1
        if (idx >= 0 && idx < this.options.length) {
          this.choose(this.options[idx])
        }
        e.preventDefault()
        return
      }

      if (e.key === 'Enter') {
        if (this.answered) {
          this.nextQuestion()
          e.preventDefault()
          return
        }
      }
    }
  },
  mounted() {
    window.addEventListener('keydown', this.onKeydown)
    this.startQuiz()
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown)
    this.clearTimers()
  }
}
</script>

<style scoped>
@keyframes quizPulseCorrect {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.32); }
  100% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
}

@keyframes quizPulseWrong {
  0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.28); }
  100% { box-shadow: 0 0 0 12px rgba(244, 63, 94, 0); }
}

.quiz-pulse-correct {
  animation: quizPulseCorrect 520ms ease-out;
}

.quiz-pulse-wrong {
  animation: quizPulseWrong 520ms ease-out;
}

.qslide-enter-active,
.qslide-leave-active {
  transition: opacity 260ms ease, transform 260ms ease;
}

.qslide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.qslide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.streak-pop-enter-active,
.streak-pop-leave-active {
  transition: transform 160ms ease, opacity 160ms ease;
}

.streak-pop-enter-from,
.streak-pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.9);
}

@keyframes correctSweep {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }
  20% {
    opacity: 0.45;
  }
  100% {
    transform: translateX(120%);
    opacity: 0;
  }
}

@keyframes wrongNudge {
  0% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
  75% { transform: translateX(-1px); }
  100% { transform: translateX(0); }
}

.option-reveal-correct::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 42%;
  height: 100%;
  background: linear-gradient(90deg, rgba(16, 185, 129, 0), rgba(110, 231, 183, 0.35), rgba(16, 185, 129, 0));
  pointer-events: none;
  animation: correctSweep 900ms ease-out;
}

.option-reveal-wrong {
  animation: wrongNudge 320ms ease-out;
}
</style>
