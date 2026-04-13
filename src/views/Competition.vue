<template>
  <div class="rounded-2xl border border-slate-700/70 bg-gradient-to-b from-[#0b1b2b] to-[#071421] p-4 text-sky-100 md:p-6">

    <!-- Loading -->
    <div v-if="!isReady" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="text-4xl">🏆</div>
      <div class="text-slate-400 text-sm">Preparing competition…</div>
    </div>

    <!-- Error -->
    <div v-else-if="startupError" class="py-16 text-center text-rose-400">{{ startupError }}</div>

    <!-- STUDY PHASE -->
    <div v-else-if="phase === 'study'">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <div class="text-xs uppercase tracking-wider text-amber-300/80">Study Phase</div>
          <div class="text-sm text-slate-400">Memorize each card — recall comes next</div>
        </div>
        <button
          class="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700/60"
          @click="$emit('back')"
        >
          Abort
        </button>
      </div>

      <!-- Overall progress -->
      <div class="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>Card {{ studyIndex + 1 }} of {{ items.length }}</span>
        <span>{{ studySpeedSec }}s per card</span>
      </div>
      <div class="mb-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          class="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-400 transition-all duration-300"
          :style="{ width: `${((studyIndex) / items.length) * 100}%` }"
        ></div>
      </div>

      <!-- Per-card timer bar -->
      <div class="mb-4 h-1 overflow-hidden rounded-full bg-slate-700">
        <div
          class="h-full rounded-full bg-amber-400 transition-none"
          :style="{ width: `${cardTimerPct}%` }"
        ></div>
      </div>

      <!-- Card -->
      <div class="rounded-2xl border border-amber-500/30 bg-amber-900/10 p-6 text-center">
        <div class="mb-2 text-6xl font-black tracking-tight text-amber-100">{{ currentStudyItem.key }}</div>

        <div v-if="currentStudyItemImage" class="mx-auto mb-3 h-32 w-32 overflow-hidden rounded-xl border border-slate-700/70">
          <img :src="currentStudyItemImage" class="h-full w-full object-cover" @error="onStudyImgError" />
        </div>
        <div v-else-if="currentStudyItemEmoji" class="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-800/50 text-5xl">
          {{ currentStudyItemEmoji }}
        </div>

        <div class="text-3xl font-bold text-white">{{ currentStudyItem.value }}</div>
      </div>
    </div>

    <!-- RECALL PHASE -->
    <div v-else-if="phase === 'recall'">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <div class="text-xs uppercase tracking-wider text-cyan-300/80">Recall Phase</div>
          <div class="text-sm text-slate-400">Select the correct association from memory</div>
        </div>
        <div class="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs text-slate-400">
          {{ recallIndex + 1 }} / {{ items.length }}
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mb-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-400 transition-all duration-200"
          :style="{ width: `${(recallIndex / items.length) * 100}%` }"
        ></div>
      </div>

      <!-- Prompt -->
      <div class="mb-6 rounded-2xl border border-cyan-500/30 bg-cyan-900/10 p-6 text-center">
        <div class="mb-1 text-xs uppercase tracking-wider text-cyan-400/70">What is the association for…</div>
        <div class="text-6xl font-black tracking-tight text-cyan-100">{{ currentRecallItem.key }}</div>
      </div>

      <!-- Options grid -->
      <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
        <button
          v-for="opt in currentRecallItem.options"
          :key="opt"
          :disabled="recallAnswered"
          @click="chooseRecall(opt)"
          class="min-h-[52px] rounded-xl border px-3 py-3 text-sm font-semibold transition-colors"
          :class="recallAnswered
            ? 'border-slate-700 bg-slate-800/40 text-slate-500 cursor-not-allowed'
            : 'border-slate-600 bg-slate-800/60 text-slate-100 hover:border-cyan-400 hover:bg-cyan-900/20 active:scale-95'"
        >
          {{ opt }}
        </button>
      </div>
    </div>

    <!-- DONE (brief spinner before emit) -->
    <div v-else-if="phase === 'done'" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="text-4xl">✅</div>
      <div class="text-slate-400 text-sm">Saving results…</div>
    </div>
  </div>
</template>

<script>
import { getDeckDataSync, getDeckImagesSync, getDeckEmojiMapSync } from '../core/deck-loader'
import { recordCompetitionResult } from '../core/analytics'

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default {
  name: 'CompetitionView',
  props: {
    deck: { type: String, required: true },
    subsetKeys: { type: Array, default: () => [] },
    itemCount: { type: Number, default: 10 },
    studySpeedSec: { type: Number, default: 3 },
  },
  emits: ['back', 'finished'],
  data() {
    return {
      phase: 'study',
      items: [],
      studyIndex: 0,
      studyElapsedMs: 0,
      studyTimer: null,
      recallIndex: 0,
      recallAnswers: [],
      recallAnswered: false,
      imageMap: {},
      emojiMap: {},
      isReady: false,
      startupError: '',
      brokenImages: new Set(),
    }
  },
  computed: {
    currentStudyItem() {
      return this.items[this.studyIndex] || { key: '', value: '', options: [] }
    },
    currentStudyItemImage() {
      const key = this.currentStudyItem.key
      if (this.brokenImages.has(key)) return null
      return this.imageMap[key] || null
    },
    currentStudyItemEmoji() {
      return this.emojiMap[this.currentStudyItem.key] || null
    },
    currentRecallItem() {
      return this.items[this.recallIndex] || { key: '', value: '', options: [] }
    },
    cardTimerPct() {
      const total = this.studySpeedSec * 1000
      return Math.min(100, Math.round((this.studyElapsedMs / total) * 100))
    },
  },
  mounted() {
    this.setup()
  },
  beforeUnmount() {
    this.clearStudyTimer()
  },
  methods: {
    onStudyImgError() {
      this.brokenImages = new Set([...this.brokenImages, this.currentStudyItem.key])
    },
    clearStudyTimer() {
      if (this.studyTimer) {
        clearInterval(this.studyTimer)
        this.studyTimer = null
      }
    },
    async setup() {
      try {
        const dataMap = getDeckDataSync(this.deck)
        this.imageMap = getDeckImagesSync(this.deck) || {}
        this.emojiMap = getDeckEmojiMapSync(this.deck) || {}

        // Build full pool of valid entries
        const fullPool = Object.entries(dataMap || {})
          .map(([key, value]) => ({ key: String(key), value: String(value || '').trim() }))
          .filter(p => p.value)

        if (fullPool.length < 6) {
          this.startupError = 'Not enough items in this deck (need at least 6).'
          this.isReady = true
          return
        }

        // Filter to subset if provided, otherwise use full pool
        let candidatePool = fullPool
        if (Array.isArray(this.subsetKeys) && this.subsetKeys.length > 0) {
          const keySet = new Set(this.subsetKeys.map(String))
          const filtered = fullPool.filter(p => keySet.has(p.key))
          if (filtered.length >= 6) candidatePool = filtered
        }

        // Shuffle and take itemCount items
        const count = Math.min(this.itemCount, candidatePool.length)
        const selected = shuffle(candidatePool).slice(0, count)

        // Pre-generate distractors for each item using the full pool for variety
        const fullValues = fullPool.map(p => p.value)
        this.items = selected.map(item => {
          const wrongs = shuffle(
            fullValues.filter(v => v !== item.value)
          ).slice(0, 5)
          const options = shuffle([item.value, ...wrongs])
          return { ...item, options }
        })

        // Initialize recall answers
        this.recallAnswers = this.items.map(() => ({ chosenValue: null }))

        this.isReady = true
        this.startStudyPhase()
      } catch (err) {
        console.error('Competition setup error', err)
        this.startupError = 'Failed to load deck data.'
        this.isReady = true
      }
    },
    startStudyPhase() {
      this.phase = 'study'
      this.studyIndex = 0
      this.studyElapsedMs = 0
      this.clearStudyTimer()
      this.studyTimer = setInterval(() => {
        this.studyElapsedMs += 100
        if (this.studyElapsedMs >= this.studySpeedSec * 1000) {
          this.advanceStudy()
        }
      }, 100)
    },
    advanceStudy() {
      this.studyElapsedMs = 0
      this.studyIndex++
      if (this.studyIndex >= this.items.length) {
        this.clearStudyTimer()
        this.startRecallPhase()
      }
    },
    startRecallPhase() {
      this.phase = 'recall'
      this.recallIndex = 0
      this.recallAnswered = false
    },
    chooseRecall(opt) {
      if (this.recallAnswered) return
      this.recallAnswers[this.recallIndex].chosenValue = opt
      this.recallAnswered = true
      setTimeout(() => this.advanceRecall(), 300)
    },
    advanceRecall() {
      this.recallIndex++
      if (this.recallIndex >= this.items.length) {
        this.finishCompetition()
      } else {
        this.recallAnswered = false
      }
    },
    finishCompetition() {
      this.phase = 'done'

      const itemResults = this.items.map((item, i) => {
        const chosenValue = this.recallAnswers[i]?.chosenValue || null
        const isCorrect = chosenValue === item.value
        return { key: item.key, correctValue: item.value, chosenValue, isCorrect }
      })

      const correct = itemResults.filter(r => r.isCorrect).length
      const wrong = itemResults.length - correct

      const stored = recordCompetitionResult(this.deck, {
        itemCount: this.items.length,
        studySpeedSec: this.studySpeedSec,
        correct,
        wrong,
        itemResults,
      })

      this.$emit('finished', {
        deck: this.deck,
        mode: 'competition',
        itemCount: this.items.length,
        studySpeedSec: this.studySpeedSec,
        correct,
        wrong,
        accuracy: stored.history[0]?.accuracy ?? 0,
        itemResults,
        bestScore: stored.bestScore,
        bestAccuracy: stored.bestAccuracy,
        totalRuns: stored.totalRuns,
        previousRun: stored.previousRun,
        recentRuns: stored.recentRuns,
      })
    },
  },
}
</script>
