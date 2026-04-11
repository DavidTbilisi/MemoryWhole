<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div class="text-xs font-black uppercase tracking-[0.28em] text-cyan-300/80">Competitive View</div>
        <h1 class="mt-1 text-3xl font-black text-slate-100">Leaderboard</h1>
      </div>
      <button
        @click="$emit('back')"
        class="rounded-lg border border-slate-600 px-4 py-2 font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
        v-tooltip="'Return to previous page'"
      >
        ← Back
      </button>
    </div>

    <LeaderboardPanel />
  </div>
</template>

<script>
import LeaderboardPanel from '../components/LeaderboardPanel.vue'

export default {
  name: 'LeaderboardView',
  components: { LeaderboardPanel },
}
</script>

<style scoped>
</style>
