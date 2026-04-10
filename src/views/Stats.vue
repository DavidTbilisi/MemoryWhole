<template>
  <div class="rounded-2xl border border-slate-700/70 bg-gradient-to-b from-[#0b1b2b] to-[#071421] p-4 text-sky-100 md:p-6">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-black tracking-tight">Session Results</h2>
        <p class="mt-1 text-xs text-slate-400 md:text-sm">{{ modeLabel }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="rounded-xl border border-cyan-600/60 bg-cyan-900/20 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-800/30" @click="$emit('dashboard', session?.deck)" v-tooltip="'View analytics for this deck (D)'">Open Deck Dashboard</button>
        <button class="rounded-xl border border-cyan-400/70 bg-cyan-500/20 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/30" @click="$emit('back')" v-tooltip="'Return to home (B or H)'">⬅ Back</button>
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

      <div class="rounded-xl border border-slate-700/70 bg-slate-900/35 p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <div class="text-xs uppercase tracking-wider text-slate-400">7-Session Trend</div>
            <div class="text-sm text-slate-300">{{ trendIntroLabel }}</div>
          </div>
          <div v-if="comparisonTimestampLabel" class="text-[11px] text-slate-500">Baseline ending {{ comparisonTimestampLabel }}</div>
        </div>

        <div v-if="trendCards.length" class="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div v-for="card in trendCards" :key="card.label" class="rounded-lg border p-3" :class="card.cardClass">
            <div class="mb-1 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-slate-300">
              <span>{{ card.label }}</span>
              <span class="text-base leading-none">{{ card.icon }}</span>
            </div>
            <div class="flex items-end justify-between gap-3">
              <div>
                <div class="text-xl font-black text-slate-100">{{ card.currentLabel }}</div>
                <div class="text-[11px] text-slate-400">7-session avg {{ card.previousLabel }}</div>
              </div>
              <div class="rounded-full px-2 py-1 text-xs font-semibold" :class="card.deltaClass">{{ card.deltaArrow }} {{ card.deltaLabel }}</div>
            </div>
            <div class="mt-2">
              <div class="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>Recent 7 → Now</span>
                <span>{{ card.sparkSummary }}</span>
              </div>
              <svg viewBox="0 0 100 22" preserveAspectRatio="none" class="h-8 w-full">
                <polyline
                  fill="none"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :stroke="card.sparkStroke"
                  :points="card.sparkPoints"
                />
              </svg>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-slate-400">Complete at least 2 {{ isDrill ? 'drills' : 'quiz sessions' }} on this deck to unlock 7-session trends.</div>
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
    },
    comparisonSource() {
      return this.isDrill ? this.session?.previousDrill : this.session?.previousSession
    },
    previousSamples() {
      const raw = this.isDrill
        ? (this.session?.recentDrills || [])
        : (this.session?.recentSessions || [])
      if (!Array.isArray(raw)) return []
      return raw.slice(1, 8)
    },
    comparisonTimestampLabel() {
      const sample = this.previousSamples[0] || this.comparisonSource
      const ts = Number(sample?.ts || 0)
      if (!ts) return ''
      return new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    trendIntroLabel() {
      if (!this.previousSamples.length && !this.comparisonSource) return 'No previous comparable session saved yet.'
      const n = this.previousSamples.length || 1
      return this.isDrill
        ? `Current drill vs average of last ${n} drill${n === 1 ? '' : 's'}.`
        : `Current quiz vs average of last ${n} session${n === 1 ? '' : 's'}.`
    },
    trendCards() {
      const baseline = this.comparisonBaseline
      if (!baseline) return []

      if (this.isDrill) {
        const currentAvgMs = Number(this.session?.avgResponseMs || 0)
        const previousAvgMs = Number(baseline.avgResponseMs || 0)
        return [
          this.makeTrendCard('Score', Number(this.session?.score || 0), Number(baseline.score || 0), '', { icon: '⚡', historyField: 'score' }),
          this.makeTrendCard('Accuracy', this.accuracyPct, Number(baseline.accuracy || 0), '%', { icon: '🎯', historyField: 'accuracy' }),
          this.makeTrendCard('Avg Response', currentAvgMs, previousAvgMs, 'ms', { invert: true, formatter: this.formatResponseMs, historyField: 'avgResponseMs' }),
        ]
      }

      return [
        this.makeTrendCard('Accuracy', this.accuracyPct, Number(baseline.accuracy || 0), '%', { icon: '🎯', historyField: 'accuracy' }),
        this.makeTrendCard('Mastery', Number(this.session?.mastery || 0), Number(baseline.mastery || 0), '%', { icon: '🧠', historyField: 'mastery' }),
        this.makeTrendCard('Peak', Number(this.session?.peak || 0), Number(baseline.peak || 0), '%', { icon: '🏆', historyField: 'peak' }),
      ]
    },
    comparisonBaseline() {
      const prev = this.previousSamples
      if (prev.length) {
        if (this.isDrill) {
          return {
            score: this.avg(prev, 'score'),
            accuracy: this.avg(prev, 'accuracy'),
            avgResponseMs: this.avg(prev, 'avgResponseMs'),
          }
        }
        return {
          accuracy: this.avg(prev, 'accuracy'),
          mastery: this.avg(prev, 'mastery'),
          peak: this.avg(prev, 'peak'),
        }
      }

      const fallback = this.comparisonSource
      if (!fallback) return null
      if (this.isDrill) {
        return {
          score: Number(fallback.score || 0),
          accuracy: Number(fallback.accuracy || 0),
          avgResponseMs: Number(fallback.avgResponseMs || 0),
        }
      }
      return {
        accuracy: Number(fallback.accuracy || 0),
        mastery: Number(fallback.mastery || 0),
        peak: Number(fallback.peak || 0),
      }
    }
  },
  methods: {
    avg(rows, field) {
      if (!rows.length) return 0
      const sum = rows.reduce((acc, row) => acc + Number(row?.[field] || 0), 0)
      return sum / rows.length
    },
    formatResponseMs(value) {
      const ms = Number(value || 0)
      if (!ms) return '—'
      return `${(ms / 1000).toFixed(2)}s`
    },
    makeTrendCard(label, current, previous, unit = '', options = {}) {
      const invert = Boolean(options.invert)
      const formatter = options.formatter || ((value) => `${Math.round(Number(value || 0))}${unit}`)
      const icon = options.icon || (invert ? '⏱️' : '📈')
      const historyField = options.historyField || ''
      const safeCurrent = Number(current || 0)
      const safePrevious = Number(previous || 0)
      const delta = safeCurrent - safePrevious
      const improved = invert ? delta < 0 : delta > 0
      const isFlat = delta === 0
      const trendSeries = this.buildTrendSeries(historyField, safeCurrent)

      return {
        label,
        icon,
        currentLabel: formatter(safeCurrent),
        previousLabel: formatter(safePrevious),
        deltaLabel: this.formatDelta(delta, unit, { invert }),
        deltaArrow: isFlat ? '→' : (improved ? '↑' : '↓'),
        deltaClass: isFlat
          ? 'bg-slate-800 text-slate-300'
          : improved
            ? 'bg-emerald-500/15 text-emerald-300'
            : 'bg-rose-500/15 text-rose-300',
        cardClass: isFlat
          ? 'border-slate-700/70 bg-slate-950/45'
          : improved
            ? 'border-emerald-500/30 bg-emerald-950/20'
            : 'border-rose-500/30 bg-rose-950/20',
        sparkPoints: this.makeSparklinePoints(trendSeries),
        sparkStroke: isFlat ? '#94a3b8' : (improved ? '#34d399' : '#fb7185'),
        sparkSummary: `${trendSeries.length} pts`,
      }
    },
    buildTrendSeries(field, currentValue) {
      const prevChronological = [...this.previousSamples].reverse()
      const prevValues = prevChronological.map((row) => Number(row?.[field] || 0))
      return [...prevValues, Number(currentValue || 0)]
    },
    makeSparklinePoints(values) {
      if (!Array.isArray(values) || values.length <= 1) return '0,16 100,16'
      const min = Math.min(...values)
      const max = Math.max(...values)
      const span = Math.max(1, max - min)
      return values
        .map((value, idx) => {
          const x = (idx / (values.length - 1)) * 100
          const y = 18 - (((value - min) / span) * 14)
          return `${x.toFixed(2)},${y.toFixed(2)}`
        })
        .join(' ')
    },
    formatDelta(delta, unit = '', options = {}) {
      if (delta === 0) return 'No change'
      const invert = Boolean(options.invert)
      const direction = invert
        ? (delta < 0 ? 'Faster' : 'Slower')
        : (delta > 0 ? 'Up' : 'Down')

      if (unit === 'ms') {
        return `${direction} ${Math.abs(delta / 1000).toFixed(2)}s`
      }

      return `${direction} ${Math.abs(delta)}${unit}`
    }
  }
}
</script>
