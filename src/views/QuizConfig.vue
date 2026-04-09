<template>
  <div class="bg-[#071421] p-4 rounded-xl text-sky-100">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-3xl font-black">{{ title }}</h2>
      <button v-tooltip="'Return to Home'" class="px-5 py-2 rounded-xl border border-slate-600 bg-slate-900/40" @click="$emit('back')">← Back</button>
    </div>

    <div class="grid grid-cols-2 gap-2 md:grid-cols-4 mb-6">
      <button
        v-for="group in groups"
        :key="group.label"
        v-tooltip="`Toggle ${group.label}`"
        @click="toggle(group.label)"
        class="px-4 py-3 rounded-xl font-bold border"
        :class="selected.has(group.label) ? 'bg-violet-700/40 border-violet-500 text-white' : 'bg-slate-900/40 border-slate-700 text-slate-300'"
      >
        {{ group.label }}
      </button>
    </div>

    <button v-tooltip="'Select or deselect all items'" class="w-full mb-4 rounded-xl py-3 bg-slate-800 border border-slate-700 text-lg font-bold" @click="toggleAll">Toggle All</button>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <button v-tooltip="'Start standard quiz mode'" class="rounded-xl py-4 text-xl font-black bg-gradient-to-r from-violet-600 to-cyan-400" @click="startQuiz">▶ Start Quiz</button>
      <button v-tooltip="'Start timed speed drill mode'" class="rounded-xl py-4 text-xl font-black bg-gradient-to-r from-amber-500 to-rose-500" @click="startDrill">⚡ Speed Drill</button>
    </div>

    <div class="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-900/15 p-4">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="text-xs uppercase tracking-wider text-emerald-200/80">Recovery Suggestion</div>
          <div class="text-sm text-slate-300">
            Focus on {{ recovery.keys.length }} weak/due items to recover rank faster.
          </div>
        </div>
        <button
          v-tooltip="'Select suggested weak groups'"
          class="rounded-lg border border-emerald-400/50 bg-emerald-900/30 px-3 py-1.5 text-xs font-semibold text-emerald-100"
          @click="applyRecoverySelection"
        >
          Select Suggested
        </button>
      </div>

      <div class="mb-2 grid grid-cols-3 gap-2 text-xs">
        <div class="rounded border border-slate-700/70 bg-slate-900/45 p-2 text-slate-300">Due now <strong class="block text-amber-200">{{ recovery.dueCount }}</strong></div>
        <div class="rounded border border-slate-700/70 bg-slate-900/45 p-2 text-slate-300">High risk <strong class="block text-rose-300">{{ recovery.highRiskCount }}</strong></div>
        <div class="rounded border border-slate-700/70 bg-slate-900/45 p-2 text-slate-300">Low acc <strong class="block text-cyan-200">{{ recovery.lowAccCount }}</strong></div>
      </div>

      <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
        <button
          v-tooltip="'Start quiz with weak-item subset'"
          class="rounded-lg py-2.5 text-sm font-bold bg-gradient-to-r from-emerald-600 to-cyan-500 text-white"
          @click="startRecoveryQuiz"
        >
          Start Recovery Quiz
        </button>
        <button
          v-tooltip="'Start drill with weak-item subset'"
          class="rounded-lg py-2.5 text-sm font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-white"
          @click="startRecoveryDrill"
        >
          Recovery Drill
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { loadDeckData } from '../core/deck-loader'
import { getChunkGroups } from '../core/chunk-groups'
import { getDeckReviewState, isItemDue } from '../core/spaced-repetition'
import { getDeckStatsMap } from '../core/analytics'

export default {
  name: 'QuizConfigView',
  props: {
    deck: { type: String, required: true },
    autoRecovery: { type: Boolean, default: false }
  },
  data() {
    return {
      groups: [],
      selected: new Set(),
      recovery: {
        keys: [],
        dueCount: 0,
        highRiskCount: 0,
        lowAccCount: 0,
      },
    }
  },
  computed: {
    title() {
      return (this.deck || '').toUpperCase()
    }
  },
  methods: {
    toggle(label) {
      if (this.selected.has(label)) this.selected.delete(label)
      else this.selected.add(label)
      this.selected = new Set(this.selected)
    },
    toggleAll() {
      if (this.selected.size === this.groups.length) {
        this.selected = new Set()
      } else {
        this.selected = new Set(this.groups.map((g) => g.label))
      }
    },
    startQuiz() {
      const chosen = this.groups.filter((g) => this.selected.has(g.label))
      const keys = chosen.flatMap((g) => g.keys)
      if (keys.length < 6) {
        alert('Select at least 6 items to quiz.')
        return
      }
      this.$emit('start', keys)
    },
    startDrill() {
      const chosen = this.groups.filter((g) => this.selected.has(g.label))
      const keys = chosen.flatMap((g) => g.keys)
      if (keys.length < 6) {
        alert('Select at least 6 items to drill.')
        return
      }
      this.$emit('start-drill', keys)
    },
    applyRecoverySelection() {
      const keySet = new Set(this.recovery.keys.map((k) => String(k)))
      const recoveredLabels = this.groups
        .filter((g) => g.keys.some((k) => keySet.has(String(k))))
        .map((g) => g.label)
      this.selected = new Set(recoveredLabels)
    },
    startRecoveryQuiz() {
      const keys = this.recovery.keys
      if (keys.length < 6) {
        alert('Need at least 6 weak items for recovery mode.')
        return
      }
      this.$emit('start', keys)
    },
    startRecoveryDrill() {
      const keys = this.recovery.keys
      if (keys.length < 6) {
        alert('Need at least 6 weak items for recovery mode.')
        return
      }
      this.$emit('start-drill', keys)
    },
    buildRecoverySuggestion(data) {
      const entries = Object.entries(data || {}).map(([key, value]) => ({
        key: String(key),
        value: String(value || '').trim(),
      })).filter((row) => row.value)

      const deckState = getDeckReviewState(this.deck)
      const deckStats = getDeckStatsMap(this.deck)
      const now = Date.now()

      const dueCount = entries.filter((row) => isItemDue(deckState[row.key] || {}, now)).length
      const scored = entries.map((row, index) => {
        const item = deckState[row.key] || {}
        const stats = deckStats[row.key] || {}
        const attempts = Number(stats.attempts || 0)
        const correct = Number(stats.correct || 0)
        const acc = attempts > 0 ? (correct / attempts) : 0.5
        const due = isItemDue(item, now) ? 1 : 0
        const overdueMs = Math.max(0, now - Number(item.nextDueAt || now))
        const overdueDays = overdueMs / (24 * 60 * 60 * 1000)
        const lapses = Number(item.lapses || 0)
        const risk = attempts > 0 && acc < 0.7 ? 1 : 0
        const urgency = (due * 2.2) + (overdueDays * 0.85) + ((1 - acc) * 1.6) + (lapses * 0.16)
        return { key: row.key, urgency, risk, lowAcc: attempts > 0 && acc < 0.75 ? 1 : 0, index }
      })

      scored.sort((a, b) => b.urgency - a.urgency || a.index - b.index)
      const limit = Math.max(16, Math.min(60, Math.ceil(entries.length * 0.5)))
      const keys = scored.slice(0, limit).map((row) => row.key)

      this.recovery = {
        keys,
        dueCount,
        highRiskCount: scored.filter((row) => row.risk).length,
        lowAccCount: scored.filter((row) => row.lowAcc).length,
      }
    },
    async setup() {
      const data = await loadDeckData(this.deck)
      this.groups = getChunkGroups(this.deck, data).filter((g) => g.keys.length > 0)
      this.selected = new Set(this.groups.map((g) => g.label))
      this.buildRecoverySuggestion(data)
      if (this.autoRecovery) this.applyRecoverySelection()
    }
  },
  watch: {
    deck: {
      immediate: true,
      handler() {
        this.setup().catch((e) => {
          console.error(e)
          this.groups = []
          this.selected = new Set()
        })
      }
    },
    autoRecovery() {
      if (this.autoRecovery) this.applyRecoverySelection()
    }
  }
}
</script>
