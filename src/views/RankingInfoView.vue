<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-black text-slate-100">Ranking System</h1>
      <button @click="goBack" class="px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-slate-100 transition-colors font-medium" v-tooltip="'Return to home'">
        ← Back to Home
      </button>
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
