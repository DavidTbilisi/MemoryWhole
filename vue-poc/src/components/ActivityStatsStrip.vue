<template>
  <section class="mb-5">
    <div class="text-xs font-bold tracking-[0.18em] text-slate-300 mb-2">ACTIVITY</div>
    <div class="w-full rounded-2xl border border-slate-700/80 bg-[#0f0f23] px-3 py-3 md:px-5 md:py-4">
      <div class="grid grid-cols-2 gap-y-3 md:grid-cols-4 md:gap-y-0">
        <div class="text-center md:border-r md:border-slate-700/80">
          <div class="text-4xl font-black leading-none bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">{{ totals.kp }}</div>
          <div class="mt-1 text-[12px] text-slate-400">🧠 Knowledge Pts</div>
        </div>

        <div class="text-center md:border-r md:border-slate-700/80">
          <div class="text-4xl font-black leading-none bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">{{ totals.acc }}</div>
          <div class="mt-1 text-[12px] text-slate-400">🎯 Accuracy</div>
        </div>

        <div class="text-center md:border-r md:border-slate-700/80">
          <div class="text-4xl font-black leading-none bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">{{ totals.sessions }}</div>
          <div class="mt-1 text-[12px] text-slate-400">🗓 Sessions</div>
        </div>

        <div class="text-center">
          <div class="text-4xl font-black leading-none bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">{{ totals.attempts }}</div>
          <div class="mt-1 text-[12px] text-slate-400">⚡ Attempts</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { readJson } from '../core/storage'

export default {
  name: 'ActivityStatsStrip',
  computed: {
    totals() {
      const analytics = readJson('analytics_v1', {})
      let sessions = 0
      let attempts = 0
      let correct = 0

      for (const deck of Object.values(analytics)) {
        sessions += Number(deck?.totalSessions || 0)
        attempts += Number(deck?.totalAttempts || 0)
        correct += Number(deck?.totalCorrect || 0)
      }

      const acc = attempts > 0 ? `${Math.round((correct / attempts) * 100)}%` : '—'
      const kp = correct
      return { kp, acc, sessions, attempts }
    }
  }
}
</script>
