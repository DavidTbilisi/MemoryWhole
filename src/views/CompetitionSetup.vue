<template>
  <div id="competition-setup" class="rounded-xl bg-[#071421] p-4 text-sky-100">
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <h2 class="min-w-0 flex-1 truncate text-xl font-black tracking-tight sm:text-2xl">{{ titleShort }}</h2>
      <button
        type="button"
        v-tooltip="'Timed study → recall. Pick groups, size & speed, then 🏆 (or C).'"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/70 text-base leading-none text-slate-200 hover:bg-slate-700"
        aria-label="What is competition mode?"
      >❓</button>
      <button
        type="button"
        v-tooltip="'Quiz & drill setup (same deck)'"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/70 text-base hover:bg-slate-700"
        aria-label="Quiz and drill setup"
        @click="$emit('open-quiz-setup')"
      >📋</button>
      <button
        type="button"
        v-tooltip="'Back (B or H)'"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-950/50 text-lg hover:bg-cyan-900/40"
        aria-label="Back"
        @click="$emit('back')"
      >⬅️</button>
    </div>

    <div class="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
      <button
        v-for="(group, index) in groups"
        :key="group.label"
        v-tooltip="`Toggle ${group.label}`"
        type="button"
        class="rounded-xl border px-4 py-3 font-bold"
        :class="groupClass(group, index)"
        @click="toggle(group.label)"
      >
        {{ group.label }}
      </button>
    </div>

    <button
      type="button"
      v-tooltip="'Toggle all groups (A)'"
      class="mb-5 w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-base font-bold"
      @click="toggleAll"
    >
      🔁 All
    </button>

    <div class="rounded-xl border border-amber-500/40 bg-amber-900/10 p-3 sm:p-4">
      <div class="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300/80">COMPETITION MODE</div>
      <div class="mb-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-2">
        <div>
          <div class="mb-1 text-xs text-slate-500" title="Pool size">🎯</div>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="n in [10, 20, 50]"
              :key="n"
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors"
              :class="competitionItemCount === n
                ? 'border-amber-400 bg-amber-900/40 text-amber-100'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500'"
              @click="competitionItemCount = n"
            >{{ n }}</button>
          </div>
        </div>
        <div>
          <div class="mb-1 text-xs text-slate-500" title="Seconds per study card">⏱️</div>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="s in [2, 3, 5, 10]"
              :key="s"
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors"
              :class="competitionStudySpeed === s
                ? 'border-amber-400 bg-amber-900/40 text-amber-100'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500'"
              @click="competitionStudySpeed = s"
            >{{ s }}s</button>
          </div>
        </div>
      </div>
      <button
        type="button"
        v-tooltip="'Study phase then recall (C)'"
        aria-label="Start competition"
        class="w-full rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 py-3 text-base font-black"
        @click="startCompetition"
      >🏆</button>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-emerald-500/35 bg-emerald-950/20 px-2.5 py-2 text-xs text-slate-300">
      <span class="shrink-0 text-sm" title="Weak / due pool" aria-hidden="true">🩹</span>
      <span class="tabular-nums" v-tooltip="'Due now'">⏰ {{ recovery.dueCount }}</span>
      <span class="text-slate-600">·</span>
      <span class="tabular-nums" v-tooltip="'High risk'">⚠️ {{ recovery.highRiskCount }}</span>
      <span class="text-slate-600">·</span>
      <span class="tabular-nums" v-tooltip="'Low accuracy'">📉 {{ recovery.lowAccCount }}</span>
      <span class="text-slate-600">·</span>
      <span class="min-w-0 truncate text-slate-500" v-tooltip="'Keys in suggested pool'">🔑 {{ recovery.keys.length }}</span>
      <button
        type="button"
        v-tooltip="'Apply suggested groups (S)'"
        class="ml-auto flex h-8 min-w-[2rem] items-center justify-center rounded-md border border-emerald-400/45 bg-emerald-900/35 px-2 text-sm hover:bg-emerald-900/55"
        aria-label="Select suggested groups"
        @click="applyRecoverySelection"
      >✨</button>
    </div>
  </div>
</template>

<script>
import { loadDeckData } from '../core/deck-loader'
import { getChunkGroups } from '../core/chunk-groups'
import { getDeckReviewState, isItemDue } from '../core/spaced-repetition'
import { getDeckStatsMap } from '../core/analytics'
import { DECKS } from '../data/decks'

export default {
  name: 'CompetitionSetupView',
  props: {
    deck: { type: String, required: true },
    autoRecovery: { type: Boolean, default: false },
  },
  emits: ['back', 'start-competition', 'open-quiz-setup'],
  data() {
    return {
      groups: [],
      selected: new Set(),
      cursorIndex: 0,
      recovery: {
        keys: [],
        dueCount: 0,
        highRiskCount: 0,
        lowAccCount: 0,
      },
      competitionItemCount: 10,
      competitionStudySpeed: 3,
    }
  },
  computed: {
    deckMeta() {
      return DECKS.find((d) => d.deck === this.deck)
    },
    titleShort() {
      return this.deckMeta?.name || this.deck || 'Deck'
    },
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
      },
    },
    autoRecovery() {
      if (this.autoRecovery) this.applyRecoverySelection()
    },
  },
  methods: {
    groupClass(group, index) {
      const active = this.selected.has(group.label)
      const focused = index === this.cursorIndex
      if (active && focused) return 'bg-violet-600/45 border-cyan-300 text-white shadow-[0_0_0_2px_rgba(34,211,238,0.55)]'
      if (active) return 'bg-violet-700/40 border-violet-500 text-white'
      if (focused) return 'bg-slate-900/60 border-cyan-400 text-cyan-100 shadow-[0_0_0_2px_rgba(34,211,238,0.45)]'
      return 'bg-slate-900/40 border-slate-700 text-slate-300'
    },
    toggle(label) {
      if (this.selected.has(label)) this.selected.delete(label)
      else this.selected.add(label)
      this.selected = new Set(this.selected)
    },
    toggleFocusedGroup() {
      const focused = this.groups[this.cursorIndex]
      if (!focused) return
      this.toggle(focused.label)
    },
    moveCursor(delta = 0) {
      const total = this.groups.length
      if (!total) return
      this.cursorIndex = (this.cursorIndex + Number(delta || 0) + total) % total
    },
    moveCursorToStart() {
      this.cursorIndex = 0
    },
    moveCursorToEnd() {
      this.cursorIndex = Math.max(0, this.groups.length - 1)
    },
    toggleAll() {
      if (this.selected.size === this.groups.length) {
        this.selected = new Set()
      } else {
        this.selected = new Set(this.groups.map((g) => g.label))
      }
    },
    applyRecoverySelection() {
      const keySet = new Set(this.recovery.keys.map((k) => String(k)))
      const recoveredLabels = this.groups
        .filter((g) => g.keys.some((k) => keySet.has(String(k))))
        .map((g) => g.label)
      this.selected = new Set(recoveredLabels)
    },
    startCompetition() {
      const chosen = this.groups.filter((g) => this.selected.has(g.label))
      const keys = chosen.flatMap((g) => g.keys)
      if (keys.length < 6) {
        alert('Select at least 6 items for competition mode.')
        return
      }
      const itemCount = Math.min(this.competitionItemCount, keys.length)
      this.$emit('start-competition', { keys, itemCount, studySpeedSec: this.competitionStudySpeed })
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
      this.cursorIndex = 0
      this.buildRecoverySuggestion(data)
      if (this.autoRecovery) this.applyRecoverySelection()
    },
  },
}
</script>
