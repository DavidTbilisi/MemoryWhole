<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-black text-slate-100">Ranking System</h1>
      <div class="flex flex-wrap items-center gap-2">
        <button @click="$emit('view-leaderboard')" class="px-4 py-2 rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 transition-colors font-medium" v-tooltip="'Open leaderboard page'">
          View Leaderboard
        </button>
        <button @click="goBack" class="px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-slate-100 transition-colors font-medium" v-tooltip="'Return to home (B or H)'">
          ← Back to Home
        </button>
      </div>
    </div>

    <!-- Content -->
    <RankingInfo />
  </div>
</template>

<script>
import RankingInfo from '../components/RankingInfo.vue'

export default {
  name: 'RankingInfoView',
  components: { RankingInfo },
  methods: {
    goBack() {
      this.$emit('back')
    }
  }
}
</script>

<style scoped>
</style>
