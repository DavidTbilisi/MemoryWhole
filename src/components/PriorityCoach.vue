<template>
  <div class="rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-[#0f0f1a] to-slate-950 p-2 sm:p-3">
    <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-1.5">
        <span class="text-sm">🎯</span>
        <span class="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Priority coach</span>
      </div>
      <details v-if="hasPractice" class="group text-left">
        <summary class="cursor-pointer list-none text-[10px] text-slate-500 hover:text-slate-300 [&::-webkit-details-marker]:hidden inline-flex items-center gap-1">
          Mistake cost <span class="text-slate-600">·</span>
          <span class="font-bold" :class="mistakeCost >= 9 ? 'text-rose-400' : mistakeCost >= 4 ? 'text-amber-400' : 'text-slate-400'">~{{ mistakeCost }}×</span>
          <span class="text-slate-600 group-open:hidden">▸</span>
        </summary>
        <p class="mt-1.5 max-w-xs text-[10px] leading-snug text-slate-500">Roughly how many clean answers balance one wrong answer in the rank window.</p>
      </details>
      <span v-else class="text-[10px] text-slate-500">After first session</span>
    </div>

    <div v-if="!hasPractice" class="py-2 text-center text-[11px] text-slate-500">
      Practice any deck once for tailored tips.
    </div>

    <details v-else class="group/coach rounded-lg border border-slate-700/45 bg-slate-950/25">
      <summary class="flex min-h-[40px] cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 hover:bg-slate-800/25 [&::-webkit-details-marker]:hidden sm:min-h-[44px] sm:px-2.5 sm:py-2">
        <div class="min-w-0 flex-1 text-left">
          <div v-if="topPriority" class="truncate text-[11px] font-semibold leading-snug" :class="topPriority.titleClass">{{ topPriority.title }}</div>
          <div v-else class="text-[11px] text-slate-500">Tips loading…</div>
          <div v-if="topPriority" class="truncate text-[10px] text-slate-500">{{ topPriority.detail }}</div>
        </div>
        <div class="flex shrink-0 items-center gap-1.5">
          <span
            v-if="topPriority"
            class="hidden rounded-full px-1.5 py-0.5 text-[9px] font-bold sm:inline"
            :class="topPriority.tagClass"
          >{{ topPriority.tag }}</span>
          <span class="text-[10px] text-slate-500" aria-hidden="true"><span class="group-open/coach:hidden">Show</span><span class="hidden group-open/coach:inline">Hide</span></span>
        </div>
      </summary>
      <div class="space-y-2 border-t border-slate-700/40 p-2">
        <div
          v-if="topPriority"
          class="flex cursor-pointer items-start gap-2 rounded-lg border p-2 transition-all hover:brightness-110 sm:gap-3 sm:p-3"
          :class="topPriority.rowClass"
          @click="act(topPriority)"
        >
          <div
            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black sm:h-6 sm:w-6 sm:text-[10px]"
            :class="topPriority.badgeClass"
          >1</div>
          <div class="min-w-0 flex-1">
            <div class="text-xs font-semibold leading-snug" :class="topPriority.titleClass">{{ topPriority.title }}</div>
            <div class="mt-0.5 text-[11px] leading-snug text-slate-400">{{ topPriority.detail }}</div>
          </div>
          <div
            class="shrink-0 self-center rounded-full px-2 py-0.5 text-[10px] font-bold"
            :class="topPriority.tagClass"
          >{{ topPriority.tag }}</div>
        </div>

        <details v-if="morePriorities.length" class="group/more rounded-lg border border-slate-700/50 bg-slate-950/25">
          <summary class="flex min-h-[40px] cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/30 [&::-webkit-details-marker]:hidden sm:min-h-[44px] sm:px-3 sm:py-2">
            <span>{{ morePriorities.length }} more tip{{ morePriorities.length > 1 ? 's' : '' }}</span>
            <span class="text-slate-500 tabular-nums" aria-hidden="true"><span class="group-open/more:hidden">Show</span><span class="hidden group-open/more:inline">Hide</span></span>
          </summary>
          <div class="space-y-2 border-t border-slate-700/40 p-2">
            <div
              v-for="(item, i) in morePriorities"
              :key="i"
              class="flex cursor-pointer items-start gap-2 rounded-lg border p-2 transition-all hover:brightness-110 sm:gap-3 sm:p-2.5"
              :class="item.rowClass"
              @click="act(item)"
            >
              <div
                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                :class="item.badgeClass"
              >{{ i + 2 }}</div>
              <div class="min-w-0 flex-1">
                <div class="text-[11px] font-semibold leading-snug" :class="item.titleClass">{{ item.title }}</div>
                <div class="mt-0.5 text-[10px] leading-snug text-slate-400">{{ item.detail }}</div>
              </div>
              <div
                class="shrink-0 self-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                :class="item.tagClass"
              >{{ item.tag }}</div>
            </div>
          </div>
        </details>
      </div>
    </details>
  </div>
</template>

<script>
import { getAllRankInfo } from '../core/ranking'
import { getAllDeckAnalytics } from '../core/analytics'

const URGENT = {
  rowClass: 'border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/30',
  badgeClass: 'bg-rose-600 text-white',
  titleClass: 'text-rose-300',
  tagClass: 'bg-rose-900/60 text-rose-300',
}
const IMPORTANT = {
  rowClass: 'border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/30',
  badgeClass: 'bg-amber-500 text-slate-950',
  titleClass: 'text-amber-300',
  tagClass: 'bg-amber-900/60 text-amber-300',
}
const GROWTH = {
  rowClass: 'border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/30',
  badgeClass: 'bg-cyan-600 text-white',
  titleClass: 'text-cyan-300',
  tagClass: 'bg-cyan-900/60 text-cyan-300',
}

export default {
  name: 'PriorityCoach',
  emits: ['start-recommended', 'dashboard-recommended'],
  data() {
    return {
      rankInfo: null,
      analytics: {},
    }
  },
  computed: {
    rows() {
      return Object.entries(this.analytics || {})
        .map(([deck, stats]) => {
          const attempts = Number(stats.totalAttempts || 0)
          const correct = Number(stats.totalCorrect || 0)
          const acc = attempts > 0 ? Math.round((correct / attempts) * 100) : 0
          return { deck, attempts, acc }
        })
        .filter((r) => r.attempts > 0)
        .sort((a, b) => a.acc - b.acc || b.attempts - a.attempts)
    },
    hasPractice() {
      return this.rows.length > 0
    },
    mistakeCost() {
      const stats = this.rankInfo?.global?.stats || {}
      const attempts = Number(stats.totalAttempts || 0)
      const correct = Number(stats.totalCorrect || 0)
      const wrong = attempts - correct
      if (wrong <= 0 || attempts <= 0) return 1
      const acc = correct / attempts
      const cost = acc / (1 - acc)
      return cost < 1.5 ? Math.round(cost * 10) / 10 : Math.round(cost)
    },
    priorities() {
      if (!this.hasPractice || !this.rankInfo) return []

      const global = this.rankInfo.global
      const synthetic = this.rankInfo.synthetic
      const rows = this.rows
      const weakest = rows[0] || null
      const strongest = rows[rows.length - 1] || null
      const second = rows.length >= 2 ? rows[1] : null

      const coverageNeed = Number(global.coverageDecksNeeded || 0)
      const perfectNeeded = Number(global.perfectNeeded || 0)
      const avgMastery = Number(synthetic.components?.averageMastery || 0)
      const deckCount = rows.length
      const score = Number(global.score || 0)
      const nextRankName = global.nextRank?.rank || null

      const items = []

      // ── Priority 1: Urgent ──────────────────────────────────────────────
      if (coverageNeed > 0) {
        items.push({
          title: `Unlock ${coverageNeed} deck${coverageNeed > 1 ? 's' : ''} for next rank`,
          detail: `Coverage caps score until you practice more decks.`,
          tag: 'Coverage',
          action: { type: 'home' },
          ...URGENT,
        })
      } else if (weakest && weakest.acc < 75) {
        items.push({
          title: `"${weakest.deck}" at ${weakest.acc}% — weakest`,
          detail: `Short recovery drill helps global score most.`,
          tag: 'Accuracy',
          action: { type: 'recovery', deck: weakest.deck },
          ...URGENT,
        })
      } else if (nextRankName && perfectNeeded > 0 && perfectNeeded <= 30) {
        items.push({
          title: `~${perfectNeeded} clean answers to ${nextRankName}`,
          detail: `Run a tight session on a deck you know well.`,
          tag: 'Rank Up',
          action: { type: 'start', deck: strongest?.deck },
          ...URGENT,
        })
      } else {
        items.push({
          title: `Clean run on your strongest deck`,
          detail: `At ${score}%, accuracy moves the needle fastest.`,
          tag: 'Accuracy',
          action: { type: 'start', deck: strongest?.deck },
          ...URGENT,
        })
      }

      // ── Priority 2: Important ───────────────────────────────────────────
      if (nextRankName && perfectNeeded > 30) {
        items.push({
          title: `${perfectNeeded} clean answers for ${nextRankName}`,
          detail: `Use a familiar deck; steady beats rushed.`,
          tag: 'Rank Up',
          action: { type: 'start', deck: strongest?.deck },
          ...IMPORTANT,
        })
      } else if (avgMastery < 70) {
        items.push({
          title: `Mastery avg ${avgMastery}% — push higher`,
          detail: `Revisit weak items until decks sit ~75%+ mastery.`,
          tag: 'Mastery',
          action: { type: 'recovery', deck: weakest?.deck },
          ...IMPORTANT,
        })
      } else if (second) {
        items.push({
          title: `Second-weakest: "${second.deck}" (${second.acc}%)`,
          detail: `Quick drill here lifts both rank signals.`,
          tag: 'Accuracy',
          action: { type: 'recovery', deck: second.deck },
          ...IMPORTANT,
        })
      } else {
        items.push({
          title: `Second pass on today's deck`,
          detail: `Same-day repeats boost mastery.`,
          tag: 'Mastery',
          action: { type: 'start', deck: strongest?.deck },
          ...IMPORTANT,
        })
      }

      // ── Priority 3: Growth ──────────────────────────────────────────────
      if (deckCount < 3) {
        items.push({
          title: `New deck → diversity bonus`,
          detail: `More practiced decks raise synthetic score (up to +10).`,
          tag: 'Diversity',
          action: { type: 'home' },
          ...GROWTH,
        })
      } else if (score > 82) {
        items.push({
          title: `Rotate decks this week`,
          detail: `At ${score}%, variety keeps skills sharp.`,
          tag: 'Consistency',
          action: { type: 'dashboard', deck: weakest?.deck },
          ...GROWTH,
        })
      } else {
        items.push({
          title: `Short sessions, high accuracy`,
          detail: `10–20 clean answers beat long sloppy runs.`,
          tag: 'Strategy',
          action: { type: 'start', deck: strongest?.deck },
          ...GROWTH,
        })
      }

      return items
    },
    topPriority() {
      const list = this.priorities
      return list.length ? list[0] : null
    },
    morePriorities() {
      return this.priorities.slice(1)
    },
  },
  mounted() {
    this.refresh()
    window.addEventListener('mnemonic-stats-updated', this.refresh)
  },
  beforeUnmount() {
    window.removeEventListener('mnemonic-stats-updated', this.refresh)
  },
  methods: {
    refresh() {
      this.rankInfo = getAllRankInfo()
      this.analytics = getAllDeckAnalytics()
    },
    act(item) {
      const { type, deck } = item.action || {}
      if (type === 'recovery') {
        this.$emit('start-recommended', { deck: deck || 'major', mode: 'recovery' })
      } else if (type === 'start') {
        this.$emit('start-recommended', { deck: deck || 'major', mode: 'default' })
      } else if (type === 'dashboard') {
        this.$emit('dashboard-recommended', deck || 'major')
      }
      // 'home' type: no action, just visual nudge
    },
  },
}
</script>
