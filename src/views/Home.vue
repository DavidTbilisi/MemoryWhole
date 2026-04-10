<template>
  <div class="pb-20 md:pb-0">
    <div class="mb-4">
      <RankDisplay @view-ranking-info="onViewRankingInfo" @start-recommended="onStart" @dashboard-recommended="onDashboard" />
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
export default {
  name: 'HomeView',
  components: { DeckCard, RankDisplay, PriorityCoach, FantasyQuestPanel },
  data(){
    return {
      decks: DECKS,
      cursorIndex: 0,
      dailyStreak: { current: 0, longest: 0 },
    }
  },
  mounted() {
    this.dailyStreak = getDailyStreak()
  },
  methods:{
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
    onViewRankingInfo(){ this.$emit('view-ranking-info'); }
  }
}
</script>
