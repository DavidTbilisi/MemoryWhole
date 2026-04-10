<template>
  <div class="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-[#0f0f1a] to-slate-950 p-5">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-lg">🎯</span>
        <span class="text-xs font-bold text-amber-300 uppercase tracking-widest">Priority Coach</span>
      </div>
      <span class="text-[10px] text-slate-500">Today's focus</span>
    </div>

    <div v-if="!hasPractice" class="text-center py-4 text-slate-500 text-xs">
      Complete at least one deck to get personalized priorities.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="(item, i) in priorities"
        :key="i"
        class="group flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer hover:brightness-110"
        :class="item.rowClass"
        @click="act(item)"
      >
        <div
          class="shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black mt-0.5"
          :class="item.badgeClass"
        >{{ i + 1 }}</div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-semibold leading-snug mb-0.5" :class="item.titleClass">{{ item.title }}</div>
          <div class="text-[11px] text-slate-400 leading-relaxed">{{ item.detail }}</div>
        </div>
        <div
          class="shrink-0 self-center text-[10px] font-bold px-2 py-0.5 rounded-full"
          :class="item.tagClass"
        >{{ item.tag }}</div>
      </div>
    </div>
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
          title: `Unlock ${coverageNeed} new deck${coverageNeed > 1 ? 's' : ''} — rank is gated`,
          detail: `Coverage is blocking ${nextRankName ? nextRankName : 'your next rank'}. Each new deck raises your score ceiling.`,
          tag: 'Coverage',
          action: { type: 'home' },
          ...URGENT,
        })
      } else if (weakest && weakest.acc < 75) {
        items.push({
          title: `Fix weak link: "${weakest.deck}" at ${weakest.acc}%`,
          detail: `Your lowest accuracy deck drags down global score. A 10-min recovery drill lifts it fast.`,
          tag: 'Accuracy',
          action: { type: 'recovery', deck: weakest.deck },
          ...URGENT,
        })
      } else if (nextRankName && perfectNeeded > 0 && perfectNeeded <= 30) {
        items.push({
          title: `Only ${perfectNeeded} perfect answers away from ${nextRankName}`,
          detail: `You're very close. Start a clean run on your best deck right now.`,
          tag: 'Rank Up',
          action: { type: 'start', deck: strongest?.deck },
          ...URGENT,
        })
      } else {
        items.push({
          title: `Drill your strongest deck for clean answers`,
          detail: `At ${score}% score, a focused accurate run is your fastest rank lever today.`,
          tag: 'Accuracy',
          action: { type: 'start', deck: strongest?.deck },
          ...URGENT,
        })
      }

      // ── Priority 2: Important ───────────────────────────────────────────
      if (nextRankName && perfectNeeded > 30) {
        items.push({
          title: `${perfectNeeded} perfect answers needed for ${nextRankName}`,
          detail: `Pick any deck you know well for steady accurate practice.`,
          tag: 'Rank Up',
          action: { type: 'start', deck: strongest?.deck },
          ...IMPORTANT,
        })
      } else if (avgMastery < 70) {
        items.push({
          title: `Raise average mastery (now ${avgMastery}%)`,
          detail: `Repeat any deck until it stays above 75% per-item mastery to boost synthetic rank.`,
          tag: 'Mastery',
          action: { type: 'recovery', deck: weakest?.deck },
          ...IMPORTANT,
        })
      } else if (second) {
        items.push({
          title: `Improve "${second.deck}" — currently ${second.acc}%`,
          detail: `Your second-weakest deck. A short drill today improves both accuracy and mastery metrics.`,
          tag: 'Accuracy',
          action: { type: 'recovery', deck: second.deck },
          ...IMPORTANT,
        })
      } else {
        items.push({
          title: `Do a second pass on today's deck`,
          detail: `Repeating the same deck within 24 h solidifies memory traces and raises mastery.`,
          tag: 'Mastery',
          action: { type: 'start', deck: strongest?.deck },
          ...IMPORTANT,
        })
      }

      // ── Priority 3: Growth ──────────────────────────────────────────────
      if (deckCount < 3) {
        items.push({
          title: `Try a new deck for a diversity bonus`,
          detail: `Each additional deck adds up to +2 pts to synthetic score. You can gain up to +10 total.`,
          tag: 'Diversity',
          action: { type: 'home' },
          ...GROWTH,
        })
      } else if (score > 82) {
        items.push({
          title: `Cycle all practiced decks this week`,
          detail: `At ${score}% you're consistent. Rotating through all decks prevents skill decay.`,
          tag: 'Consistency',
          action: { type: 'dashboard', deck: weakest?.deck },
          ...GROWTH,
        })
      } else {
        items.push({
          title: `Keep sessions short: 10-20 answers at high accuracy`,
          detail: `Shorter precise sessions beat longer sloppy ones. Quality over quantity in rank math.`,
          tag: 'Strategy',
          action: { type: 'start', deck: strongest?.deck },
          ...GROWTH,
        })
      }

      return items
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
