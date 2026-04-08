<template>
  <div>
    <ActivityStatsStrip />

    <div class="mb-4">
      <RankDisplay @view-ranking-info="onViewRankingInfo" @start-recommended="onStart" @dashboard-recommended="onDashboard" />
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <DeckCard v-for="d in decks" :key="d.deck" :deck="d.deck" :name="d.name" :count-text="d.count" :icon="d.icon"
        @start="onStart" @dashboard="onDashboard" @preview="onPreview" @edit="onEdit" @export="onExport"/>
    </div>
  </div>
</template>

<script>
import DeckCard from '../components/DeckCard.vue'
import ActivityStatsStrip from '../components/ActivityStatsStrip.vue'
import RankDisplay from '../components/RankDisplay.vue'
import { DECKS } from '../data/decks'
export default {
  name: 'HomeView',
  components: { DeckCard, ActivityStatsStrip, RankDisplay },
  data(){
    return {
      decks: DECKS
    }
  },
  methods:{
    onStart(deck){ this.$emit('start', deck); },
    onDashboard(deck){ this.$emit('dashboard', deck); },
    onPreview(deck){ this.$emit('preview', deck); },
    onEdit(deck){ this.$emit('edit', deck); },
    onExport(deck){ this.$emit('export', deck); },
    onViewRankingInfo(){ this.$emit('view-ranking-info'); }
  }
}
</script>
