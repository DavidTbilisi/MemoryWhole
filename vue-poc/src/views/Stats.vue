<template>
  <div class="rounded-2xl border border-slate-700/70 bg-gradient-to-b from-[#0b1b2b] to-[#071421] p-4 text-sky-100 md:p-6">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-black tracking-tight">Session Results</h2>
        <p class="mt-1 text-xs text-slate-400 md:text-sm">{{ modeLabel }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="rounded-xl border border-cyan-600/60 bg-cyan-900/20 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-800/30" @click="$emit('dashboard', session?.deck)" v-tooltip="'View analytics for this deck'">Open Deck Dashboard</button>
        <button class="rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800" @click="$emit('back')" v-tooltip="'Return to home'">Back</button>
      </div>
    </div>

    <div v-if="session" class="space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div class="rounded-2xl border border-cyan-500/35 bg-cyan-900/15 p-4 md:col-span-1">
          <div class="mb-2 text-xs uppercase tracking-wider text-cyan-200/80">Outcome</div>
          <div class="mx-auto mb-2 h-28 w-28 rounded-full" :style="outcomeRingStyle"></div>
          <div class="text-center text-3xl font-black text-cyan-200">{{ outcomeLabel }}</div>
          <div class="text-center text-xs text-slate-400">{{ subOutcomeLabel }}</div>
        </div>

        <div class="rounded-2xl border border-violet-500/35 bg-violet-900/12 p-4 md:col-span-2">
          <div class="mb-3 text-xs uppercase tracking-wider text-violet-200/80">Visual Summary</div>

          <div class="space-y-2">
            <div class="text-[11px] text-slate-400">Accuracy</div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-800">
              <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" :style="{ width: accuracyPct + '%' }"></div>
            </div>

            <div class="text-[11px] text-slate-400">Correct vs Wrong</div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-800">
              <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" :style="{ width: correctSharePct + '%' }"></div>
            </div>

            <div v-if="isDrill" class="text-[11px] text-slate-400">Time Used</div>
            <div v-if="isDrill" class="h-2 overflow-hidden rounded-full bg-slate-800">
              <div class="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-400" :style="{ width: timeUsedPct + '%' }"></div>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">Attempts <strong class="block text-white">{{ session.attempts || 0 }}</strong></div>
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">Correct <strong class="block text-emerald-300">{{ session.correct || 0 }}</strong></div>
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">Wrong <strong class="block text-rose-300">{{ session.wrong || 0 }}</strong></div>
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">
              {{ isDrill ? 'Score' : 'Peak' }}
              <strong class="block" :class="isDrill ? 'text-amber-200' : 'text-violet-200'">{{ isDrill ? (session.score || 0) : `${session.peak || 0}%` }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-700/70 bg-slate-900/35 p-4 text-sm text-slate-300">
        <template v-if="isDrill">
          Avg response <strong class="text-cyan-200">{{ avgResponseLabel }}</strong> ·
          Pace <strong class="text-cyan-200">{{ paceLabel }}</strong> ·
          Time used <strong class="text-cyan-200">{{ timeUsedLabel }}</strong> ·
          Best score <strong class="text-amber-200">{{ session.bestScore || session.score || 0 }}</strong>
          <span v-if="session.totalDrills"> · Saved drills <strong class="text-emerald-200">{{ session.totalDrills }}</strong></span>
        </template>
        <template v-else>
          Mastery <strong class="text-cyan-200">{{ session.mastery || 0 }}%</strong> ·
          Peak <strong class="text-violet-200">{{ session.peak || 0 }}%</strong> ·
          Accuracy <strong class="text-emerald-200">{{ regularAccuracyLabel }}</strong>
        </template>
      </div>
    </div>

    <div v-else class="text-sm text-slate-400">No session summary yet.</div>
  </div>
</template>

<script>
export default {
  name: 'StatsView',
  props: { session: Object },
  computed: {
    isDrill() {
      return this.session?.mode === 'drill'
    },
    modeLabel() {
      return this.session?.mode === 'drill' ? 'Speed Drill Complete' : 'Standard Quiz Complete'
    },
    attempts() {
      return Number(this.session?.attempts || 0)
    },
    correct() {
      return Number(this.session?.correct || 0)
    },
    wrong() {
      return Number(this.session?.wrong || 0)
    },
    accuracyPct() {
      if (!this.attempts) return 0
      return Math.round((this.correct / this.attempts) * 100)
    },
    correctSharePct() {
      if (!this.attempts) return 0
      return Math.round((this.correct / this.attempts) * 100)
    },
    timeUsedPct() {
      if (!this.isDrill) return 0
      const usedMs = Number(this.session?.timeUsedMs || 0)
      const totalMs = 60000
      return Math.max(0, Math.min(100, Math.round((usedMs / totalMs) * 100)))
    },
    outcomeRingStyle() {
      const pct = this.isDrill ? this.accuracyPct : Number(this.session?.mastery || 0)
      return {
        background: `conic-gradient(#22d3ee ${pct * 3.6}deg, rgba(15,23,42,0.9) 0deg)`
      }
    },
    outcomeLabel() {
      if (this.isDrill) return `${this.accuracyPct}%`
      return `${Number(this.session?.mastery || 0)}%`
    },
    subOutcomeLabel() {
      if (this.isDrill) return `Score ${Number(this.session?.score || 0)}`
      return `Peak ${Number(this.session?.peak || 0)}%`
    },
    drillAccuracyLabel() {
      const attempts = Number(this.session?.attempts || 0)
      const correct = Number(this.session?.correct || 0)
      if (!attempts) return '0%'
      return `${Math.round((correct / attempts) * 100)}%`
    },
    regularAccuracyLabel() {
      const attempts = Number(this.session?.attempts || 0)
      const correct = Number(this.session?.correct || 0)
      if (!attempts) return '0%'
      return `${Math.round((correct / attempts) * 100)}%`
    },
    avgResponseLabel() {
      const ms = Number(this.session?.avgResponseMs || 0)
      if (!ms) return '—'
      return `${(ms / 1000).toFixed(2)}s`
    },
    timeUsedLabel() {
      const ms = Number(this.session?.timeUsedMs || 0)
      if (!ms) return '—'
      return `${(ms / 1000).toFixed(1)}s`
    },
    paceLabel() {
      const attempts = Number(this.session?.attempts || 0)
      const usedMs = Number(this.session?.timeUsedMs || 0)
      if (!attempts || !usedMs) return '—'
      const perMin = (attempts / usedMs) * 60000
      return `${perMin.toFixed(1)} answers/min`
    }
  }
}
</script>
