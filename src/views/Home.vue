<template>
  <div>
    <ActivityStatsStrip />

    <div class="mb-4">
      <RankDisplay @view-ranking-info="onViewRankingInfo" @start-recommended="onStart" @dashboard-recommended="onDashboard" />
    </div>

    <div class="mb-4">
      <PriorityCoach @start-recommended="onStart" @dashboard-recommended="onDashboard" />
    </div>

    <div class="mb-4">
      <FantasyQuestPanel @start="onStart" @dashboard="onDashboard" />
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <DeckCard v-for="(d, index) in decks" :key="d.deck" :deck="d.deck" :name="d.name" :count-text="d.count" :icon="d.icon" :focused="index === cursorIndex"
        @start="onStart" @dashboard="onDashboard" @preview="onPreview" @edit="onEdit" @export="onExport"/>
    </div>
  </div>
</template>

<script>
import DeckCard from '../components/DeckCard.vue'
import ActivityStatsStrip from '../components/ActivityStatsStrip.vue'
import RankDisplay from '../components/RankDisplay.vue'
import PriorityCoach from '../components/PriorityCoach.vue'
import FantasyQuestPanel from '../components/FantasyQuestPanel.vue'
import { DECKS } from '../data/decks'
export default {
  name: 'HomeView',
  components: { DeckCard, ActivityStatsStrip, RankDisplay, PriorityCoach, FantasyQuestPanel },
  data(){
    return {
      decks: DECKS,
      cursorIndex: 0,
    }
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
    onDashboard(deck){ this.$emit('dashboard', deck); },
    onPreview(deck){ this.$emit('preview', deck); },
    onEdit(deck){ this.$emit('edit', deck); },
    onExport(deck){ this.$emit('export', deck); },
    onViewRankingInfo(){ this.$emit('view-ranking-info'); }
  }
}
</script>
