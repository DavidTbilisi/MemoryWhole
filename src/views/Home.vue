<template>
  <div class="pb-20 md:pb-0">
    <div class="mb-4">
      <RankDisplay @view-ranking-info="onViewRankingInfo" @start-recommended="onStart" @dashboard-recommended="onDashboard" />
    </div>

    <div class="mb-4 rounded-2xl border border-slate-700/70 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] uppercase tracking-widest text-slate-500">Champion Track</div>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-lg">{{ championTier.tier.icon }}</span>
            <span class="text-base font-bold text-slate-100">{{ championTier.tier.name }}</span>
            <span v-if="championTier.bottleneck" class="text-xs text-amber-300">Bottleneck: {{ bottleneckLabel }}</span>
          </div>
        </div>
        <button class="rounded-lg border border-cyan-500/60 px-3 py-1.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10" @click="onOpenChampionEvaluation">
          View full evaluation →
        </button>
      </div>
      <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400" :style="{ width: `${nextTierProgress}%` }"></div>
      </div>
      <div class="mt-1 text-xs text-slate-500">Progress to next tier: {{ nextTierProgress }}%</div>
    </div>

    <div class="px-4 py-3 mb-2 border-t border-slate-700/40">
      <span v-if="dailyStreak.current > 0" class="text-amber-400 font-semibold">
        🔥 {{ dailyStreak.current }}-day streak
      </span>
      <span v-else class="text-slate-500 text-sm">
        — Start your streak today
      </span>
    </div>

    <div class="mb-4">
      <PriorityCoach @start-recommended="onStart" @dashboard-recommended="onDashboard" />
    </div>

    <div class="mb-4">
      <FantasyQuestPanel @start="onStart" @dashboard="onDashboard" />
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
