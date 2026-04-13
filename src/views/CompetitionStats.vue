<template>
  <div class="rounded-2xl border border-slate-700/70 bg-gradient-to-b from-[#0b1b2b] to-[#071421] p-4 text-sky-100 md:p-6">
    <div class="mb-4 flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h2 class="text-2xl font-black tracking-tight">Competition Results</h2>
        <p class="mt-1 text-xs text-slate-400">{{ modeLabel }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-400 px-4 py-2 text-sm font-bold text-white shadow-lg hover:brightness-110 min-h-[44px]"
          @click="$emit('replay')"
          v-tooltip="'Play again (R)'"
        >🔁 Replay</button>
        <button
          class="rounded-xl border border-cyan-600/60 bg-cyan-900/20 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-800/30 min-h-[44px]"
          @click="$emit('dashboard', session && session.deck)"
          v-tooltip="'View analytics (D)'"
        >Dashboard</button>
        <button
          class="rounded-xl border border-cyan-400/70 bg-cyan-500/20 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/30 min-h-[44px]"
          @click="$emit('back')"
          v-tooltip="'Return to home (B or H)'"
        >⬅ Back</button>
      </div>
    </div>

    <div v-if="session" class="space-y-4">
      <!-- Personal best banner -->
      <div v-if="isPersonalBest" class="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-900/20 px-4 py-3 text-amber-200 font-semibold">
        <span class="text-xl">🏆</span>
        New personal best! {{ session.correct }} / {{ session.itemCount }} correct
      </div>

      <!-- Score + accuracy ring -->
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div class="rounded-2xl border border-cyan-500/35 bg-cyan-900/15 p-4 md:col-span-1">
          <div class="mb-2 text-xs uppercase tracking-wider text-cyan-200/80">Outcome</div>
          <div class="mx-auto mb-2 h-28 w-28 rounded-full" :style="outcomeRingStyle"></div>
          <div class="text-center text-3xl font-black text-cyan-200">{{ accuracyLabel }}</div>
          <div class="text-center text-xs text-slate-400">{{ session.correct }} / {{ session.itemCount }} correct</div>
        </div>

        <div class="rounded-2xl border border-violet-500/35 bg-violet-900/12 p-4 md:col-span-2">
          <div class="mb-3 text-xs uppercase tracking-wider text-violet-200/80">Session Details</div>
          <div class="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">Items <strong class="block text-white">{{ session.itemCount }}</strong></div>
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">Correct <strong class="block text-emerald-300">{{ session.correct }}</strong></div>
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">Wrong <strong class="block text-rose-300">{{ session.wrong }}</strong></div>
            <div class="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">Study speed <strong class="block text-amber-200">{{ session.studySpeedSec }}s/card</strong></div>
          </div>

          <div class="mt-3 rounded-xl border border-slate-700/70 bg-slate-900/35 p-3 text-sm text-slate-300">
            Best score <strong class="text-amber-200">{{ session.bestScore }}</strong> ·
            Best accuracy <strong class="text-cyan-200">{{ session.bestAccuracy }}%</strong> ·
            Total runs <strong class="text-emerald-200">{{ session.totalRuns }}</strong>
            <span v-if="previousRun">
              · vs last run <strong :class="trendClass">{{ trendLabel }}</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Accuracy trend sparkline -->
      <div v-if="recentRunValues.length > 1" class="rounded-xl border border-slate-700/70 bg-slate-900/35 p-4">
        <div class="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Accuracy trend (recent {{ recentRunValues.length }} runs)</span>
          <span>{{ recentRunValues[0] }}% → {{ recentRunValues[recentRunValues.length - 1] }}%</span>
        </div>
        <svg viewBox="0 0 100 22" preserveAspectRatio="none" class="h-10 w-full">
          <polyline
            fill="none"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :stroke="sparklineStroke"
            :points="sparklinePoints"
          />
        </svg>
      </div>

      <!-- Per-item results table -->
      <div class="rounded-xl border border-slate-700/70 bg-slate-900/35 p-4">
        <div class="mb-3 text-xs uppercase tracking-wider text-slate-400">Item-by-Item Results</div>
        <div class="space-y-1 text-sm max-h-96 overflow-y-auto">
          <div
            v-for="(row, i) in session.itemResults"
            :key="row.key"
            class="flex items-center gap-3 rounded-lg px-3 py-2 border"
            :class="row.isCorrect
              ? 'border-emerald-700/50 bg-emerald-950/25'
              : 'border-rose-700/50 bg-rose-950/25'"
          >
            <span class="text-base shrink-0" :class="row.isCorrect ? 'text-emerald-400' : 'text-rose-400'">
              {{ row.isCorrect ? '✓' : '✗' }}
            </span>
            <span class="font-mono font-bold shrink-0 w-8 text-slate-300">{{ row.key }}</span>
            <span class="text-slate-200 shrink-0">{{ row.correctValue }}</span>
            <span v-if="!row.isCorrect" class="ml-auto text-xs text-slate-500 truncate">
              you chose: <span class="text-rose-300">{{ row.chosenValue || '—' }}</span>
            </span>
            <span v-else class="ml-auto text-xs text-slate-600">#{{ i + 1 }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="py-16 text-center text-slate-400">No competition results yet.</div>
  </div>
</template>

<script>
export default {
  name: 'CompetitionStats',
  props: { session: { type: Object, default: null } },
  emits: ['back', 'replay', 'dashboard'],
  computed: {
    modeLabel() {
      const deck = this.session?.deck || ''
      return `Competition — ${deck.toUpperCase()} · ${this.session?.itemCount || 0} items · ${this.session?.studySpeedSec || 0}s/card`
    },
    accuracy() {
      const c = Number(this.session?.correct || 0)
      const t = Number(this.session?.itemCount || 0)
      if (!t) return 0
      return Math.round((c / t) * 100)
    },
    accuracyLabel() {
      return `${this.accuracy}%`
    },
    outcomeRingStyle() {
      return {
        background: `conic-gradient(#22d3ee ${this.accuracy * 3.6}deg, rgba(15,23,42,0.9) 0deg)`
      }
    },
    previousRun() {
      return this.session?.previousRun || null
    },
    isPersonalBest() {
      const prev = this.previousRun
      if (!prev) return this.session?.totalRuns === 1
      return Number(this.session?.correct || 0) > Number(prev.correct || 0) ||
        Number(this.session?.accuracy || 0) > Number(prev.accuracy || 0)
    },
    trendLabel() {
      const prev = this.previousRun
      if (!prev) return ''
      const delta = Number(this.session?.accuracy || 0) - Number(prev.accuracy || 0)
      if (delta === 0) return 'No change'
      const dir = delta > 0 ? '↑' : '↓'
      return `${dir} ${Math.abs(delta).toFixed(1)}%`
    },
    trendClass() {
      const prev = this.previousRun
      if (!prev) return 'text-slate-300'
      const delta = Number(this.session?.accuracy || 0) - Number(prev.accuracy || 0)
      if (delta > 0) return 'text-emerald-300'
      if (delta < 0) return 'text-rose-300'
      return 'text-slate-300'
    },
    recentRunValues() {
      const runs = Array.isArray(this.session?.recentRuns) ? this.session.recentRuns : []
      return [...runs].reverse().map(r => Number(r.accuracy || 0).toFixed(1))
    },
    sparklinePoints() {
      const values = this.recentRunValues.map(Number)
      if (values.length <= 1) return '0,16 100,16'
      const min = Math.min(...values)
      const max = Math.max(...values)
      const span = Math.max(1, max - min)
      return values.map((v, i) => {
        const x = (i / (values.length - 1)) * 100
        const y = 18 - ((v - min) / span) * 14
        return `${x.toFixed(1)},${y.toFixed(1)}`
      }).join(' ')
    },
    sparklineStroke() {
      const values = this.recentRunValues.map(Number)
      if (values.length < 2) return '#94a3b8'
      const last = values[values.length - 1]
      const first = values[0]
      if (last > first) return '#34d399'
      if (last < first) return '#fb7185'
      return '#94a3b8'
    },
  },
}
</script>
