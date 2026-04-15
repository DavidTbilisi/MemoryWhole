<template>
  <div class="quiz-container w-full h-[calc(100dvh-56px)] md:h-[calc(100dvh-140px)] flex flex-col overflow-hidden rounded-2xl border p-2 sm:p-4 md:p-4">
    <!-- Header: mobile only — desktop shows title/stats in the right panel -->
    <div class="mb-1 flex items-center justify-between gap-2 md:hidden">
      <h2 class="text-sm font-bold tracking-tight truncate quiz-text-soft">
        {{ isDrillMode ? 'Drill' : 'Quiz' }}: {{ deck }}
      </h2>
      <div class="flex items-center gap-2 text-xs shrink-0 quiz-text-soft">
        <span class="text-emerald-400 font-bold">{{ score.correct }}</span>
        <span class="text-slate-600">/</span>
        <span class="text-rose-400 font-bold">{{ score.wrong }}</span>
        <span class="text-slate-600">·</span>
        <span class="font-semibold text-cyan-300">{{ accuracyPct }}%</span>
        <span v-if="streak >= 2" class="text-amber-300 font-bold">🔥{{ streak }}</span>
      </div>
    </div>

    <div v-if="!running" class="rounded-2xl border quiz-card p-6">
      <template v-if="startupError">
        <p class="mb-4 text-sm text-rose-300">{{ startupError }}</p>
        <div class="flex flex-wrap gap-3">
          <button v-tooltip="'Retry Loading Quiz'" @click="startQuiz" class="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/30 transition hover:brightness-110 min-h-[44px]">Retry</button>
          <button v-tooltip="'Return to Home (B)'" @click="$emit('back')" class="rounded-xl border border-slate-600 bg-slate-900/50 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 min-h-[44px]">Back</button>
        </div>
      </template>
      <template v-else>
        <p class="text-sm text-slate-300">Preparing {{ isDrillMode ? 'speed drill' : 'quiz' }}...</p>
      </template>
    </div>

    <div v-else class="flex-1 min-h-0 flex flex-col gap-1 md:gap-1.5">
      <!-- Not-due banner -->
      <div v-if="notDueBanner && !notDueBannerDismissed"
           class="shrink-0 flex items-center justify-between gap-2 rounded-xl border border-amber-500/50 bg-amber-900/20 px-3 py-2 text-xs">
        <span class="text-amber-200">⚠ {{ notDueBanner }}</span>
        <div class="flex gap-2 shrink-0">
          <button class="rounded border border-amber-500/60 px-2 py-0.5 text-amber-100 hover:bg-amber-800/40" @click="notDueBannerDismissed = true">Continue anyway</button>
          <button class="rounded border border-rose-500/60 bg-rose-900/30 px-2 py-0.5 text-rose-200 hover:bg-rose-800/40" @click="$emit('back')">Quit deck</button>
        </div>
      </div>

      <!-- Unified progress bar -->
      <div class="flex items-center gap-2 text-[10px] md:text-xs quiz-text-soft shrink-0">
        <span class="shrink-0">{{ questionLabel }}</span>
        <div class="flex-1 h-1 md:h-1.5 rounded-full quiz-progress-bg overflow-hidden">
          <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-300" :style="{ width: progressPct + '%' }"></div>
        </div>
        <span v-if="isDrillMode" class="text-amber-300 font-bold tabular-nums md:hidden">{{ drillSecondsLabel }}s</span>
        <span v-if="isDrillMode" class="text-slate-600 md:hidden">·</span>
        <span v-if="isDrillMode" class="text-amber-200 font-semibold md:hidden">{{ drillScore }}pts</span>
      </div>

      <!-- Main area: quiz card + right control panel (desktop) -->
      <div class="flex-1 min-h-0 flex gap-2 md:gap-3">

        <!-- Quiz card -->
        <div
          :class="['flex-1 min-h-0 rounded-2xl border quiz-card p-2 sm:p-4 md:p-5 transition-all duration-200 relative overflow-hidden flex flex-col', questionPulseClass]"
          :style="isDrillMode ? drillCardStyle : {}"
          @click="isDrillMode ? onDrillTap($event) : undefined"
          @touchstart.passive="isDrillMode ? onDrillTouchStart($event) : undefined"
          @touchmove="isDrillMode ? onDrillTouchMove($event) : undefined"
          @touchend="isDrillMode ? onDrillTouchEnd($event) : undefined"
        >
          <!-- Tap zone hints (mobile drill) -->
          <div v-if="isDrillMode && !answered && !drillSwipe.active"
               class="absolute inset-0 pointer-events-none z-10 flex md:hidden">
            <div class="w-1/2 flex items-center justify-center opacity-[0.08] text-rose-400 text-4xl font-black">✗</div>
            <div class="w-1/2 flex items-center justify-center opacity-[0.08] text-emerald-400 text-4xl font-black">✓</div>
          </div>
          <div v-if="isDrillMode && drillSwipeDirection === 'right'"
               class="absolute top-3 right-3 text-green-400 font-bold text-lg border-2 border-green-400 rounded px-2 py-0.5 rotate-12 pointer-events-none select-none z-20"
               :style="{ opacity: drillSwipeOverlayOpacity }">
            ✓ KNOW
          </div>
          <div v-if="isDrillMode && drillSwipeDirection === 'left'"
               class="absolute top-3 left-3 text-rose-400 font-bold text-lg border-2 border-rose-400 rounded px-2 py-0.5 -rotate-12 pointer-events-none select-none z-20"
               :style="{ opacity: drillSwipeOverlayOpacity }">
            ✗ SKIP
          </div>
          <Transition name="qslide" mode="out-in">
            <div :key="`q-${questionIndex}-${currentNum}`" class="flex flex-col h-full">
              <!-- Hero prompt -->
              <div class="flex items-center justify-center py-1 sm:py-2 md:py-2 shrink-0">
                <div class="text-center">
                  <div class="text-5xl sm:text-6xl md:text-7xl font-black leading-none quiz-prompt tabular-nums">{{ currentNum }}</div>
                  <div class="mt-1 text-[10px] uppercase tracking-widest" :class="feedbackClass">{{ feedback || 'match this' }}</div>
                </div>
              </div>

              <!-- Options grid -->
              <div class="flex-1 grid grid-cols-2 gap-1.5 sm:gap-2" style="grid-template-rows: repeat(3, 1fr)">
                <button
                  v-for="(opt, idx) in options"
                  :key="idx"
                  :disabled="answered"
                  @click="choose(opt)"
                  :class="optionBtnClass(opt, idx)"
                  @touchstart.passive="onOptionTouchStart($event, idx)"
                  @touchmove="onOptionTouchMove($event, idx)"
                  @touchend="onOptionTouchEnd($event, idx)"
                  :style="optionSwipeStyle(idx)"
                >
                  <!-- Image area -->
                  <div class="absolute inset-x-0 top-0 bottom-6 sm:bottom-7 overflow-hidden rounded-t-lg">
                    <template v-if="optionHasDualImages(opt)">
                      <img
                        :src="optionAudioImage(opt)"
                        :alt="`${opt} - Audio`"
                        class="absolute left-0 top-0 h-full w-1/2 object-contain p-0.5"
                        @error="onOptionImageError($event, opt)"
                      />
                      <img
                        :src="optionVisualImage(opt)"
                        :alt="`${opt} - Visual`"
                        class="absolute right-0 top-0 h-full w-1/2 object-contain p-0.5"
                        @error="onOptionImageError($event, opt)"
                      />
                    </template>
                    <img
                      v-else
                      :src="optionImage(opt)"
                      :alt="opt"
                      class="h-full w-full object-contain p-0.5"
                      @error="onOptionImageError($event, opt)"
                    />
                    <div class="absolute inset-0" :class="optionOverlayClass(opt, idx)"></div>
                  </div>
                  <!-- Label area -->
                  <div class="absolute inset-x-0 bottom-0 h-6 sm:h-7 flex items-center px-1.5 sm:px-2 gap-1 quiz-option-label rounded-b-lg">
                    <span class="text-[9px] font-bold shrink-0 hidden sm:inline quiz-text-muted">{{ idx + 1 }}</span>
                    <span class="truncate text-[11px] sm:text-xs font-semibold" :class="optionLabelClass(opt)">{{ opt }}</span>
                    <button v-if="optionDueLabel(opt)" class="ml-auto shrink-0 text-[10px] text-slate-500 hover:text-cyan-300 transition-colors" @click.stop="openSrModal(opt)">{{ optionDueLabel(opt) }}</button>
                  </div>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Right control panel (desktop only) -->
        <div class="hidden md:flex flex-col gap-2 w-44 shrink-0">
          <!-- Deck info + score -->
          <div class="rounded-xl border quiz-card p-3 shrink-0">
            <div class="text-[11px] font-bold truncate quiz-text-soft mb-2">{{ isDrillMode ? 'Drill' : 'Quiz' }}: {{ deck }}</div>
            <div class="flex items-center gap-2">
              <span class="text-emerald-400 font-bold text-sm">{{ score.correct }}<span class="text-[10px] ml-0.5 opacity-70">✓</span></span>
              <span class="text-rose-400 font-bold text-sm">{{ score.wrong }}<span class="text-[10px] ml-0.5 opacity-70">✗</span></span>
              <span class="font-semibold text-cyan-300 text-sm">{{ accuracyPct }}%</span>
            </div>
            <div v-if="streak >= 2" class="text-amber-300 font-semibold text-xs mt-1">🔥 {{ streak }} streak</div>
            <!-- Drill-specific stats -->
            <template v-if="isDrillMode">
              <div class="mt-2 pt-2 border-t border-slate-700/50">
                <div class="text-3xl font-black tabular-nums text-amber-300 leading-none">{{ drillSecondsLabel }}s</div>
                <div class="text-xs text-amber-200 mt-1">{{ drillScore }} pts · ×{{ drillMultiplier }}</div>
              </div>
            </template>
          </div>

          <!-- Navigation -->
          <div class="flex flex-col gap-1.5 shrink-0">
            <button v-tooltip="'Return to Home (B)'" class="quiz-btn-secondary rounded-xl border px-3 py-2 text-xs font-semibold transition w-full text-left" @click="$emit('back')">← Back</button>
            <button v-tooltip="'Next Question (Enter or N)'" class="quiz-btn-secondary rounded-xl border px-3 py-2 text-xs font-semibold transition w-full text-left" @click="nextQuestion">Next →</button>
            <button v-tooltip="'Save Session Results (F)'" class="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-400 px-3 py-2 text-xs font-bold text-white shadow-lg transition hover:brightness-110 w-full" @click="finish">Finish &amp; Save</button>
          </div>

          <!-- Auto-advance -->
          <div class="flex flex-col gap-1.5 shrink-0">
            <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-2 py-1.5">
              <input v-model="autoAdvance" type="checkbox" class="h-4 w-4 accent-cyan-500" />
              <span class="text-slate-300 text-xs">Auto-advance</span>
            </label>
            <div v-if="autoAdvance" class="flex flex-wrap gap-1">
              <button
                v-for="speed in speedOptions"
                :key="speed.ms"
                @click="autoAdvanceMs = speed.ms"
                class="flex-1 rounded-lg border px-1 py-1.5 text-xs font-semibold transition-colors"
                :class="autoAdvanceMs === speed.ms ? 'border-cyan-500 bg-cyan-900/30 text-cyan-200' : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:text-slate-200'"
              >{{ speed.label }}</button>
            </div>
          </div>
        </div>

      </div>

      <!-- Mobile footer -->
      <div class="md:hidden flex flex-wrap items-center gap-1 shrink-0">
        <button v-tooltip="'Return to Home (B)'" class="quiz-btn-secondary rounded-xl border px-3 py-1.5 text-xs font-semibold transition min-h-[36px]" @click="$emit('back')">Back</button>
        <button v-tooltip="'Next Question (Enter or N)'" class="quiz-btn-secondary rounded-xl border px-3 py-1.5 text-xs font-semibold transition min-h-[36px]" @click="nextQuestion">Next</button>
        <button v-tooltip="'Save Session Results (F)'" class="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-400 px-3 py-1.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110 min-h-[36px]" @click="finish">Finish</button>
        <div class="flex-1"></div>
        <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-2 py-1 min-h-[36px]">
          <input v-model="autoAdvance" type="checkbox" class="h-4 w-4 accent-cyan-500" />
          <span class="text-slate-300 text-xs">Auto</span>
        </label>
        <template v-if="autoAdvance">
          <button
            v-for="speed in speedOptions"
            :key="speed.ms"
            @click="autoAdvanceMs = speed.ms"
            class="rounded-lg border px-2 py-1 text-xs font-semibold min-h-[36px] transition-colors"
            :class="autoAdvanceMs === speed.ms ? 'border-cyan-500 bg-cyan-900/30 text-cyan-200' : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:text-slate-200'"
          >{{ speed.label }}</button>
        </template>
      </div>
    </div>

    <!-- SR item detail modal -->
    <Teleport to="body">
      <div v-if="srModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="srModal = null">
        <div class="absolute inset-0 bg-black/70" @click="srModal = null"></div>
        <div class="relative z-10 w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0d1b2b] p-5 shadow-2xl text-sky-100">
          <div class="mb-4 flex items-start justify-between gap-2">
            <div>
              <div class="text-xs uppercase tracking-widest text-slate-500">Item Review State</div>
              <div class="mt-1 text-xl font-black">{{ srModal.key }}</div>
              <div class="text-sm text-slate-400">{{ srModal.value }}</div>
            </div>
            <button class="shrink-0 text-slate-500 hover:text-white text-lg leading-none" @click="srModal = null">✕</button>
          </div>

          <div class="grid grid-cols-3 gap-2 mb-4 text-center">
            <div class="rounded-lg border border-slate-700 bg-slate-900/60 p-2">
              <div class="text-[10px] text-slate-500 uppercase">Reps</div>
              <div class="text-lg font-bold text-cyan-300">{{ srModal.item.reps }}</div>
            </div>
            <div class="rounded-lg border border-slate-700 bg-slate-900/60 p-2">
              <div class="text-[10px] text-slate-500 uppercase">Lapses</div>
              <div class="text-lg font-bold text-rose-300">{{ srModal.item.lapses }}</div>
            </div>
            <div class="rounded-lg border border-slate-700 bg-slate-900/60 p-2">
              <div class="text-[10px] text-slate-500 uppercase">Ease</div>
              <div class="text-lg font-bold text-amber-300">{{ srModal.item.ease?.toFixed(2) }}</div>
            </div>
          </div>

          <div class="mb-3 space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Interval</span>
              <span class="font-semibold">{{ srModal.item.intervalDays?.toFixed(1) }} days</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Last reviewed</span>
              <span class="font-semibold">{{ srModal.lastReviewedLabel }}</span>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Due date</label>
            <input
              v-model="srModal.dueDateInput"
              type="date"
              class="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
            />
          </div>

          <div class="flex gap-2">
            <button class="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-400 py-2 text-sm font-bold text-white" @click="saveSrOverride">Save</button>
            <button class="flex-1 rounded-lg border border-slate-600 bg-slate-900/60 py-2 text-sm font-semibold text-slate-300" @click="srModal = null">Cancel</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { getDeckEmojiMapSync, getDeckImagesSync, loadDeckData, makeEmojiFallbackDataUri, makeSimpleEmojiFallbackDataUri } from '../core/deck-loader'
import { createQuizEngine } from '../core/quiz-engine'
import { recordDrillResult, recordSession } from '../core/analytics'
import { getDeckReviewState, patchReviewItem } from '../core/spaced-repetition'

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
      reviewMap: {},
      srModal: null,
      notDueBannerDismissed: false,
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
      autoAdvanceMs: 400,
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
      optionTouch: { startX: 0, startY: 0, deltaX: 0, activeIndex: null },
      drillSwipe: { startX: 0, startY: 0, deltaX: 0, active: false },
      speedOptions: [
        { ms: 200, label: '⚡ 0.2s' },
        { ms: 400, label: '🔥 0.4s' },
        { ms: 800, label: '🐢 0.8s' },
      ],
    }
  },
  computed: {
    notDueBanner() {
      const vals = Object.values(this.reviewMap)
      if (!vals.length) return ''
      const now = Date.now()
      const monthMs = 30 * 24 * 60 * 60 * 1000
      const farCount = vals.filter(item => item && (Number(item.nextDueAt || 0) - now) > monthMs).length
      if (farCount === 0) return ''
      const total = vals.length
      const pct = Math.round((farCount / total) * 100)
      if (pct < 70) return ''
      return `${farCount} of ${total} items aren't due for 30+ days — this deck is well learned.`
    },
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
      if (!this.feedback) return 'quiz-text-muted'
      if (this.feedback.startsWith('Correct')) return 'quiz-feedback-correct'
      if (this.feedback.startsWith('Wrong')) return 'quiz-feedback-wrong'
      return 'quiz-text-soft'
    },
    drillSwipeDirection() {
      if (!this.drillSwipe.active) return null
      if (this.drillSwipe.deltaX > 20) return 'right'
      if (this.drillSwipe.deltaX < -20) return 'left'
      return null
    },
    drillCardStyle() {
      if (!this.drillSwipe.active) return {}
      const x = this.drillSwipe.deltaX
      return { transform: `translateX(${x}px) rotate(${x * 0.04}deg)`, transition: 'none' }
    },
    drillSwipeOverlayOpacity() {
      return Math.min(1, Math.abs(this.drillSwipe.deltaX) / 80)
    },
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
      this.reviewMap = getDeckReviewState(this.deck)
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
    optionBtnClass(opt, idx) {
      const base = 'relative h-full min-h-0 overflow-hidden rounded-lg border-2 transition duration-150 disabled:cursor-not-allowed'
      if (!this.answered) {
        return `${base} quiz-option-border hover:quiz-option-hover`
      }
      if (opt === this.currentAnswer) {
        return `${base} border-emerald-500 shadow-[0_0_16px_rgba(52,211,153,0.25)] option-reveal-correct`
      }
      if (opt === this.selectedOption && opt !== this.currentAnswer) {
        return `${base} border-rose-500 shadow-[0_0_16px_rgba(251,113,133,0.2)] option-reveal-wrong`
      }
      return `${base} quiz-option-border opacity-40`
    },
    optionLabelClass(opt) {
      if (!this.answered) return 'quiz-text-main'
      if (opt === this.currentAnswer) return 'text-emerald-600 dark:text-emerald-300'
      if (opt === this.selectedOption && opt !== this.currentAnswer) return 'text-rose-600 dark:text-rose-300'
      return 'quiz-text-muted'
    },
    optionOverlayClass(opt, idx) {
      if (!this.answered) return 'bg-slate-950/20'
      if (opt === this.currentAnswer) return 'bg-emerald-900/25'
      if (opt === this.selectedOption && opt !== this.currentAnswer) return 'bg-rose-900/30'
      return 'bg-slate-950/55'
    },
    optionKeyForLabel(opt) {
      return this.valueToKey[String(opt)] || ''
    },
    reviewItemForKey(rawKey) {
      const base = String(rawKey || '')
      if (!base) return null

      const numeric = Number(base)
      const normalized = Number.isFinite(numeric) ? String(Math.trunc(Math.abs(numeric))) : ''
      const stripLeading = base.replace(/^0+/, '') || '0'
      const candidates = [
        base,
        stripLeading,
        normalized,
        normalized ? normalized.padStart(2, '0') : '',
      ].filter(Boolean)

      for (const candidate of candidates) {
        const item = this.reviewMap[String(candidate)]
        if (item && (item.nextDueAt || item.intervalDays)) return item
      }
      return null
    },
    openSrModal(opt) {
      const key = this.optionKeyForLabel(opt)
      const rawItem = this.reviewItemForKey(key) || {}
      const reps = rawItem.reps || 0
      const lapses = rawItem.lapses || 0
      const ease = rawItem.ease || 2.3
      const intervalDays = rawItem.intervalDays || 0
      const lastReviewedAt = Number(rawItem.lastReviewedAt || 0)
      const nextDueAt = Number(rawItem.nextDueAt || Date.now())
      const lastReviewedLabel = lastReviewedAt
        ? new Date(lastReviewedAt).toLocaleDateString()
        : 'never'
      const dueDateInput = new Date(nextDueAt).toISOString().slice(0, 10)
      this.srModal = {
        key,
        value: opt,
        item: { reps, lapses, ease, intervalDays },
        lastReviewedLabel,
        dueDateInput,
        originalNextDueAt: nextDueAt,
      }
    },
    saveSrOverride() {
      if (!this.srModal) return
      const { key, dueDateInput } = this.srModal
      if (!key || !dueDateInput) return
      const newDueAt = new Date(dueDateInput + 'T00:00:00').getTime()
      if (!Number.isFinite(newDueAt)) return
      patchReviewItem(this.deck, key, { nextDueAt: newDueAt })
      this.reviewMap = getDeckReviewState(this.deck)
      this.srModal = null
    },
    optionDueLabel(opt) {
      const key = this.optionKeyForLabel(opt)
      if (!key) return 'new'
      const item = this.reviewItemForKey(key)
      if (!item) return 'new'
      const nextDueAt = Number(item.nextDueAt || 0)
      if (!nextDueAt) return 'new'
      const diffDays = Math.round((nextDueAt - Date.now()) / 86400000)
      if (diffDays <= 0) return 'due today'
      if (diffDays === 1) return 'due 1 day'
      return `due ${diffDays} days`
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
        this.reviewMap = getDeckReviewState(this.deck)
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
        this.haptic(isCorrect ? [15] : [40, 30, 40])
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
    onOptionTouchStart(e, idx) {
      const t = e.touches[0]
      this.optionTouch = { startX: t.clientX, startY: t.clientY, deltaX: 0, activeIndex: idx }
    },
    onOptionTouchMove(e, idx) {
      if (this.optionTouch.activeIndex !== idx) return
      const dx = e.touches[0].clientX - this.optionTouch.startX
      const dy = e.touches[0].clientY - this.optionTouch.startY
      if (Math.abs(dx) > Math.abs(dy)) {
        this.optionTouch.deltaX = dx
        e.preventDefault()
      }
    },
    onOptionTouchEnd(e, idx) {
      if (this.optionTouch.activeIndex !== idx) return
      const { deltaX } = this.optionTouch
      this.optionTouch = { startX: 0, startY: 0, deltaX: 0, activeIndex: null }
      if (deltaX > 60 && !this.answered) {
        this.choose(this.options[idx])
      }
    },
    optionSwipeStyle(idx) {
      if (this.optionTouch.activeIndex !== idx || this.optionTouch.deltaX <= 0) return { transition: 'transform 0.2s ease' }
      return { transform: `translateX(${this.optionTouch.deltaX}px)`, transition: 'none' }
    },
    onDrillTouchStart(e) {
      const t = e.touches[0]
      this.drillSwipe = { startX: t.clientX, startY: t.clientY, deltaX: 0, active: true }
    },
    onDrillTouchMove(e) {
      if (!this.drillSwipe.active) return
      const dx = e.touches[0].clientX - this.drillSwipe.startX
      const dy = e.touches[0].clientY - this.drillSwipe.startY
      if (Math.abs(dx) > Math.abs(dy)) {
        this.drillSwipe.deltaX = dx
        e.preventDefault()
      }
    },
    onDrillTouchEnd(e) {
      if (!this.drillSwipe.active) return
      const { deltaX } = this.drillSwipe
      this.drillSwipe = { startX: 0, startY: 0, deltaX: 0, active: false }
      if (this.answered) return
      if (deltaX > 80) {
        // Swipe right — mark correct (choose the correct answer)
        this.choose(this.currentAnswer)
      } else if (deltaX < -80) {
        // Swipe left — mark wrong (choose the first wrong option, or any non-correct option)
        const wrongOpt = this.options.find(o => o !== this.currentAnswer)
        if (wrongOpt !== undefined) this.choose(wrongOpt)
      }
    },
    haptic(pattern) {
      try { if (navigator.vibrate) navigator.vibrate(pattern) } catch (_) {}
    },
    onDrillTap(e) {
      if (!this.isDrillMode || this.answered) return
      if (e.target.closest('button')) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - rect.left
      const half = rect.width / 2
      if (x >= half) {
        this.haptic([15])
        this.choose(this.currentAnswer)
      } else {
        this.haptic([40, 30, 40])
        const wrongOpt = this.options.find(o => o !== this.currentAnswer)
        if (wrongOpt !== undefined) this.choose(wrongOpt)
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

      if (e.key === 'Enter' || e.key === ' ') {
        if (this.answered) {
          this.nextQuestion()
          e.preventDefault()
          return
        }
      }

      if (key === 'n') {
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
/* Theme-aware quiz styles using CSS variables */
.quiz-container {
  background: var(--surface-1);
  border-color: color-mix(in srgb, var(--text-soft) 25%, transparent);
  color: var(--text-main);
}

.quiz-card {
  background: color-mix(in srgb, var(--surface-2) 60%, transparent);
  border-color: color-mix(in srgb, var(--text-soft) 20%, transparent);
}

.quiz-prompt {
  color: var(--brand-1);
  text-shadow: 0 0 32px color-mix(in srgb, var(--brand-1) 35%, transparent),
               0 0 64px color-mix(in srgb, var(--brand-1) 12%, transparent);
}

.quiz-text-main { color: var(--text-main); }
.quiz-text-soft { color: var(--text-soft); }
.quiz-text-muted { color: color-mix(in srgb, var(--text-soft) 60%, transparent); }

.quiz-option-label {
  background: color-mix(in srgb, var(--surface-1) 92%, transparent);
}

.quiz-option-border {
  border-color: color-mix(in srgb, var(--text-soft) 30%, transparent);
}

.quiz-option-border:hover {
  border-color: var(--brand-2);
  box-shadow: 0 0 12px color-mix(in srgb, var(--brand-2) 20%, transparent);
}

.quiz-progress-bg {
  background: color-mix(in srgb, var(--surface-3) 80%, transparent);
}

.quiz-btn-secondary {
  background: color-mix(in srgb, var(--surface-2) 70%, transparent);
  border-color: color-mix(in srgb, var(--text-soft) 30%, transparent);
  color: var(--text-main);
}

.quiz-btn-secondary:hover {
  background: color-mix(in srgb, var(--surface-3) 80%, transparent);
}

.quiz-feedback-correct { color: #059669; }
.quiz-feedback-wrong { color: #e11d48; }

[data-theme^="dark"] .quiz-feedback-correct { color: #34d399; }
[data-theme^="dark"] .quiz-feedback-wrong { color: #fb7185; }

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
