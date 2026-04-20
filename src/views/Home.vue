<template>
  <div class="pb-20 md:pb-0">
    <div class="mb-3">
      <RankDisplay @view-ranking-info="onViewRankingInfo" @start-recommended="onStart" @dashboard-recommended="onDashboard" />
    </div>

    <!-- Champion + streak in one compact strip -->
    <div class="mb-3 rounded-xl border border-slate-700/60 bg-slate-900/50 p-3 sm:p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Champion track</span>
            <span class="text-base">{{ championTier.tier.icon }}</span>
            <span class="text-sm font-bold text-slate-100">{{ championTier.tier.name }}</span>
            <span v-if="championTier.bottleneck" class="text-xs text-amber-300/90 truncate max-w-full">{{ bottleneckLabel }}</span>
          </div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400" :style="{ width: `${nextTierProgress}%` }"></div>
          </div>
        </div>
        <div class="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center sm:text-right">
          <div class="text-xs text-slate-500">Next tier <span class="text-slate-400 font-medium">{{ nextTierProgress }}%</span></div>
          <div class="text-xs">
            <span v-if="dailyStreak.current > 0" class="font-semibold text-amber-400">🔥 {{ dailyStreak.current }}d</span>
            <span v-else class="text-slate-500">No streak yet</span>
          </div>
          <button type="button" class="rounded-lg border border-cyan-500/50 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/10 min-h-[40px] sm:min-h-0" @click="onOpenChampionEvaluation">
            Evaluation →
          </button>
        </div>
      </div>
    </div>

    <details
      class="mb-3 rounded-xl border border-slate-700/50 bg-slate-950/30 group"
      :open="coachingSectionOpen"
      @toggle="onCoachingDetailsToggle"
    >
      <summary class="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800/40 md:px-4 md:py-2.5 [&::-webkit-details-marker]:hidden">
        <span>Coaching & quests</span>
        <span class="shrink-0 text-xs font-normal tabular-nums text-slate-500" aria-hidden="true"><span class="group-open:hidden">Show</span><span class="hidden group-open:inline">Hide</span></span>
      </summary>
      <div class="space-y-2 border-t border-slate-700/40 px-2 pb-2 pt-2 sm:space-y-2 sm:px-3 sm:pb-3 sm:pt-3">
        <PriorityCoach @start-recommended="onStart" @dashboard-recommended="onDashboard" />
        <FantasyQuestPanel @start="onStart" @dashboard="onDashboard" />
      </div>
    </details>

    <div class="mb-4 flex flex-col gap-2 rounded-xl border border-violet-500/25 bg-slate-900/40 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <p class="text-sm text-slate-400">
        <span class="text-slate-300 font-medium">Stack library</span>
        — docs-linked drills (CAST, fundamentals).
        <span class="hidden sm:inline text-slate-500">Shortcuts: <kbd class="rounded border border-slate-600 bg-slate-800 px-1 py-0.5 font-mono text-[10px]">L</kbd> here, <kbd class="rounded border border-slate-600 bg-slate-800 px-1 py-0.5 font-mono text-[10px]">G</kbd><kbd class="rounded border border-slate-600 bg-slate-800 px-1 py-0.5 font-mono text-[10px] ml-0.5">L</kbd> elsewhere.</span>
      </p>
      <button
        type="button"
        class="shrink-0 rounded-lg border border-cyan-500/45 bg-cyan-950/35 px-4 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-900/40 min-h-[44px]"
        @click="$emit('open-stack-library')"
      >
        Open library
      </button>
    </div>

    <h2 class="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Decks</h2>
    <div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <DeckCard v-for="(d, index) in decks" :key="d.deck" :deck="d.deck" :name="d.name" :count-text="d.count" :icon="d.icon" :focused="index === cursorIndex"
        @start="onStart" @dashboard="onDashboard" @instant-start="onInstantStart" />
    </div>
  </div>
</template>

<script>
import DeckCard from '../components/DeckCard.vue'
import RankDisplay from '../components/RankDisplay.vue'
import PriorityCoach from '../components/PriorityCoach.vue'
import FantasyQuestPanel from '../components/FantasyQuestPanel.vue'
import { DECKS } from '../data/decks'
import { getDailyStreak } from '../core/analytics.js'
import { getChampionTier, getUserChampionMetrics, METRIC_DEFINITIONS } from '../core/champion-benchmarks'
export default {
  name: 'HomeView',
  components: { DeckCard, RankDisplay, PriorityCoach, FantasyQuestPanel },
  data(){
    return {
      decks: DECKS,
      cursorIndex: 0,
      dailyStreak: { current: 0, longest: 0 },
      championTier: getChampionTier(getUserChampionMetrics()),
      /** Coaching & quests starts collapsed on all viewports. */
      coachingSectionOpen: false,
    }
  },
  computed: {
    nextTierProgress() {
      const pct = Number(this.championTier?.bottleneck?.progress || 0)
      return Math.max(0, Math.min(100, Math.round(pct)))
    },
    bottleneckLabel() {
      const key = this.championTier?.bottleneck?.metric
      if (!key) return 'n/a'
      return METRIC_DEFINITIONS[key]?.label || key
    },
  },
  mounted() {
    this.dailyStreak = getDailyStreak()
    this.championTier = getChampionTier(getUserChampionMetrics())
    window.addEventListener('mnemonic-stats-updated', this.refreshChampionTier)
    window.addEventListener('storage', this.refreshChampionTier)
  },
  beforeUnmount() {
    window.removeEventListener('mnemonic-stats-updated', this.refreshChampionTier)
    window.removeEventListener('storage', this.refreshChampionTier)
  },
  methods:{
    onCoachingDetailsToggle(event) {
      const el = event?.target
      if (el && typeof el.open === 'boolean') this.coachingSectionOpen = el.open
    },
    refreshChampionTier() {
      this.championTier = getChampionTier(getUserChampionMetrics())
    },
    moveCursor(delta = 0) {
      const total = this.decks.length
      if (!total) return
      this.cursorIndex = (this.cursorIndex + Number(delta || 0) + total) % total
    },
    moveCursorToStart() {
      this.cursorIndex = 0
    },
    moveCursorToEnd() {
      this.cursorIndex = Math.max(0, this.decks.length - 1)
    },
    focusedDeck() {
      return this.decks[this.cursorIndex]?.deck || this.decks[0]?.deck || 'major'
    },
    openFocusedQuizConfig() {
      this.$emit('start', this.focusedDeck())
    },
    openFocusedDashboard() {
      this.$emit('dashboard', this.focusedDeck())
    },
    openFocusedPreview() {
      this.$emit('preview', this.focusedDeck())
    },
    openFocusedEditor() {
      this.$emit('edit', this.focusedDeck())
    },
    exportFocusedDeck() {
      this.$emit('export', this.focusedDeck())
    },
    onStart(deck){ this.$emit('start', deck); },
    onInstantStart(deck){ this.$emit('instant-start', deck); },
    onDashboard(deck){ this.$emit('dashboard', deck); },
    onPreview(deck){ this.$emit('preview', deck); },
    onEdit(deck){ this.$emit('edit', deck); },
    onExport(deck){ this.$emit('export', deck); },
    onViewRankingInfo(){ this.$emit('view-ranking-info'); },
    onOpenChampionEvaluation(){ this.$emit('open-champion-evaluation'); }
  }
}
</script>
