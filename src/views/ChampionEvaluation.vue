<template>
  <div class="space-y-5 pb-20 md:pb-4">
    <section class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#121729] to-slate-950 p-5">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Champion Evaluation</div>
          <div class="mt-2 flex items-center gap-3">
            <span class="text-3xl">{{ tierInfo.tier.icon }}</span>
            <div>
              <div class="text-2xl font-black text-slate-100">{{ tierInfo.tier.name }}</div>
              <div class="text-sm text-slate-400">{{ tierInfo.tier.description }}</div>
            </div>
          </div>
          <div class="mt-2 text-xs text-slate-500">
            Estimated performance in this app format derived from public memory sport encoding speeds.
          </div>
        </div>

        <div class="flex items-center gap-5">
          <div class="relative h-24 w-24 shrink-0 rounded-full" :style="ringStyle">
            <div class="absolute inset-[7px] rounded-full border border-slate-700/70 bg-slate-900"></div>
            <div class="absolute inset-0 grid place-items-center text-center">
              <div>
                <div class="text-xl font-black text-cyan-300 leading-none">{{ progressToNext }}%</div>
                <div class="mt-1 text-[10px] uppercase tracking-wider text-slate-500">to next</div>
              </div>
            </div>
          </div>
          <div class="min-w-[180px]">
            <div class="text-xs uppercase tracking-widest text-slate-500">Trajectory</div>
            <div class="mt-1 text-sm text-slate-200">{{ trajectoryText }}</div>
            <div class="mt-1 text-xs text-slate-500">{{ trajectoryReason }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div class="text-xs font-semibold tracking-widest text-slate-400">CHAMPION COMPARISON RADAR</div>
        <select v-model="selectedChampionKey" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200">
          <option v-for="row in championOptions" :key="row.key" :value="row.key">
            {{ row.label }}
          </option>
        </select>
      </div>
      <div ref="radarEl" class="h-[280px] w-full"></div>
    </section>

    <section class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
      <div class="mb-3 text-xs font-semibold tracking-widest text-slate-400">DIMENSION PROGRESS</div>
      <div class="space-y-3">
        <div
          v-for="row in dimensionRows"
          :key="row.key"
          class="rounded-xl border px-3 py-2"
          :class="row.isBottleneck ? 'border-amber-500/80 shadow-[0_0_0_1px_rgba(245,158,11,0.3)]' : 'border-slate-700/70'"
        >
          <div class="mb-1 flex items-center justify-between gap-2 text-xs">
            <div class="text-slate-200">{{ row.label }}</div>
            <div class="text-slate-400">{{ row.detail }}</div>
          </div>
          <div class="relative h-2.5 overflow-hidden rounded-full bg-slate-800">
            <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400" :style="{ width: `${row.barPct}%` }"></div>
            <div v-for="(marker, idx) in row.tierMarkers" :key="`tier-${row.key}-${idx}`" class="absolute top-0 h-full w-[1px] bg-slate-500/50" :style="{ left: `${marker}%` }"></div>
            <div v-for="marker in row.championMarkers" :key="`${row.key}-${marker.key}`" class="absolute top-[-2px] h-[12px] w-[2px] bg-amber-300" :style="{ left: `${marker.pct}%` }"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
        <div class="text-xs font-semibold tracking-widest text-slate-400">BOTTLENECK ANALYSIS</div>
        <div v-if="topBottleneck" class="mt-3">
          <div class="text-base font-bold text-amber-300">Your bottleneck: {{ topBottleneck.label }}</div>
          <div class="mt-1 text-sm text-slate-300">
            {{ topBottleneck.actionLabel }}
          </div>
          <div class="mt-1 text-xs text-slate-500">
            Current {{ formatMetric(topBottleneck.dimension, topBottleneck.user) }}
            | Target {{ formatMetric(topBottleneck.dimension, topBottleneck.target) }}
          </div>
          <button class="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400" @click="startBottleneckAction">
            Start Focus Block
          </button>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
        <div class="text-xs font-semibold tracking-widest text-slate-400">TODAY'S REGIMEN</div>
        <div class="mt-3 space-y-2">
          <button
            v-for="(goal, idx) in goals"
            :key="`goal-${idx}`"
            class="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-left hover:border-cyan-400/70"
            @click="startGoal(goal)"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="text-sm font-semibold text-slate-200">{{ goalTitle(goal) }}</div>
              <div class="text-xs text-slate-500">~{{ goal.durationMin || 10 }} min</div>
            </div>
            <div class="mt-1 text-xs text-slate-400">{{ goal.reason }}</div>
          </button>
        </div>

        <div class="mt-4 border-t border-slate-700/60 pt-3">
          <div class="text-[11px] uppercase tracking-widest text-slate-500">Weekly Trained Dimensions</div>
          <div class="mt-2 grid grid-cols-7 gap-1">
            <div v-for="cell in weekCells" :key="cell.date" class="rounded-md border border-slate-700/60 bg-slate-950/70 p-1.5 text-center">
              <div class="text-[10px] text-slate-500">{{ cell.label }}</div>
              <div class="mt-1 text-[11px] text-slate-200">{{ cell.token }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs font-semibold tracking-widest text-slate-400">HISTORICAL PROGRESS</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="metricKey in trendMetricKeys"
            :key="metricKey"
            class="rounded-md border px-2 py-1 text-xs"
            :class="activeTrendMetrics.includes(metricKey) ? 'border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-400'"
            @click="toggleTrendMetric(metricKey)"
          >
            {{ metricLabel(metricKey) }}
          </button>
        </div>
      </div>
      <div ref="historyEl" class="h-[300px] w-full"></div>
    </section>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { readJson } from '../core/storage'
import {
  CHAMPION_PROFILES,
  CHAMPION_TIERS,
  METRIC_DEFINITIONS,
  estimateTimeToTier,
  getBottleneckAnalysis,
  getChampionComparison,
  getChampionTier,
  getUserChampionMetrics,
  normalizeMetric,
} from '../core/champion-benchmarks'
import { ACTIVITY_LOG_KEY, EVALUATION_SNAPSHOTS_KEY } from '../core/analytics'
import { getDailyGoals } from '../core/training-regimen'

const METRIC_KEYS = ['drillMs', 'acc2s', 'acc3s', 'acc5s', 'volume', 'mastery', 'retention']

function toNum(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export default {
  name: 'ChampionEvaluation',
  emits: ['launch-goal'],
  data() {
    return {
      metrics: getUserChampionMetrics(),
      tierInfo: getChampionTier(getUserChampionMetrics()),
      selectedChampionKey: 'andrea_muzii',
      snapshots: readJson(EVALUATION_SNAPSHOTS_KEY, []),
      bottlenecks: [],
      goals: [],
      radarChart: null,
      historyChart: null,
      activeTrendMetrics: ['tierIndex', 'drillMs', 'acc3s', 'mastery'],
    }
  },
  computed: {
    championOptions() {
      return Object.entries(CHAMPION_PROFILES).map(([key, profile]) => ({
        key,
        label: `${profile.name} (${profile.title})`,
      }))
    },
    progressToNext() {
      if (!this.tierInfo?.bottleneck) return 100
      return Math.max(0, Math.min(100, Math.round(toNum(this.tierInfo.bottleneck.progress, 100))))
    },
    ringStyle() {
      const pct = this.progressToNext
      return {
        background: `conic-gradient(#22d3ee 0deg, #22d3ee ${pct * 3.6}deg, rgba(51,65,85,0.75) ${pct * 3.6}deg, rgba(51,65,85,0.75) 360deg)`,
      }
    },
    trajectory() {
      const targetIdx = this.tierInfo?.nextTier
        ? (this.tierInfo.tierIndex + 1)
        : this.tierInfo.tierIndex
      return estimateTimeToTier(targetIdx, this.snapshots)
    },
    trajectoryText() {
      if (!this.tierInfo?.nextTier) return 'Top tier reached. Maintain and refine.'
      if (this.trajectory?.days === 0) return `Ready to cross into ${this.tierInfo.nextTier.name}.`
      if (this.trajectory?.days) return `Time to ${this.tierInfo.nextTier.name}: ~${this.trajectory.days} days`
      return 'Time to next tier: not enough data yet'
    },
    trajectoryReason() {
      return this.trajectory?.reason || ''
    },
    comparison() {
      return getChampionComparison(this.metrics, this.selectedChampionKey)
    },
    topBottleneck() {
      return this.bottlenecks[0] || null
    },
    dimensionRows() {
      const nextThresholds = this.tierInfo?.nextTier?.thresholds || this.tierInfo?.tier?.thresholds || {}

      return METRIC_KEYS.map((metricKey) => {
        const userValue = toNum(this.metrics?.[metricKey], 0)
        const target = toNum(nextThresholds?.[metricKey], 0)
        const barPct = normalizeMetric(metricKey, userValue)
        const championMarkers = Object.entries(CHAMPION_PROFILES).map(([key, profile]) => ({
          key,
          pct: normalizeMetric(metricKey, profile.metrics[metricKey]),
        }))

        const tierMarkers = CHAMPION_TIERS.map((tier) => normalizeMetric(metricKey, tier.thresholds[metricKey]))

        return {
          key: metricKey,
          label: METRIC_DEFINITIONS[metricKey].label,
          barPct,
          championMarkers,
          tierMarkers,
          isBottleneck: this.topBottleneck?.dimension === metricKey,
          detail: `${this.formatMetric(metricKey, userValue)} -> need ${this.formatMetric(metricKey, target)} for ${(this.tierInfo?.nextTier || this.tierInfo?.tier).name}`,
        }
      })
    },
    trendMetricKeys() {
      return ['tierIndex', ...METRIC_KEYS]
    },
    weekCells() {
      const log = readJson(ACTIVITY_LOG_KEY, {})
      const out = []
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
        const key = d.toISOString().slice(0, 10)
        const row = log[key] || { drills: 0, sessions: 0 }
        let token = 'Rest'
        if (toNum(row.drills, 0) > 0 && toNum(row.sessions, 0) > 0) token = 'Speed+Acc'
        else if (toNum(row.drills, 0) > 0) token = 'Speed'
        else if (toNum(row.sessions, 0) > 0) token = 'Acc/Vol'
        out.push({ date: key, label: key.slice(5), token })
      }
      return out
    },
  },
  watch: {
    selectedChampionKey() {
      this.renderRadar()
    },
    activeTrendMetrics: {
      deep: true,
      handler() {
        this.renderHistory()
      },
    },
  },
  mounted() {
    this.refreshAll()
    this.renderRadar()
    this.renderHistory()
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('storage', this.refreshAll)
    window.addEventListener('mnemonic-stats-updated', this.refreshAll)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('storage', this.refreshAll)
    window.removeEventListener('mnemonic-stats-updated', this.refreshAll)
    if (this.radarChart) {
      this.radarChart.dispose()
      this.radarChart = null
    }
    if (this.historyChart) {
      this.historyChart.dispose()
      this.historyChart = null
    }
  },
  methods: {
    refreshAll() {
      this.metrics = getUserChampionMetrics()
      this.tierInfo = getChampionTier(this.metrics)
      this.snapshots = readJson(EVALUATION_SNAPSHOTS_KEY, [])
      this.bottlenecks = getBottleneckAnalysis(this.metrics)
      this.goals = getDailyGoals(this.tierInfo, this.metrics, this.topBottleneck)
      this.renderRadar()
      this.renderHistory()
    },
    handleResize() {
      if (this.radarChart) this.radarChart.resize()
      if (this.historyChart) this.historyChart.resize()
    },
    metricLabel(metricKey) {
      if (metricKey === 'tierIndex') return 'Tier'
      return METRIC_DEFINITIONS[metricKey]?.shortLabel || metricKey
    },
    formatMetric(metricKey, value) {
      const v = toNum(value, 0)
      if (metricKey === 'drillMs') return `${Math.round(v)}ms`
      if (metricKey === 'volume') return `${Math.round(v)} items`
      return `${Math.round(v)}%`
    },
    renderRadar() {
      if (!this.$refs.radarEl) return
      if (!this.radarChart) {
        this.radarChart = echarts.init(this.$refs.radarEl, null, { renderer: 'svg' })
      }

      const dims = METRIC_KEYS.map((metricKey) => ({
        name: METRIC_DEFINITIONS[metricKey].shortLabel,
        max: 100,
      }))

      const userSeries = METRIC_KEYS.map((metricKey) => this.comparison.dimensions[metricKey].normalizedUser)
      const champSeries = METRIC_KEYS.map((metricKey) => this.comparison.dimensions[metricKey].normalizedChampion)

      this.radarChart.setOption({
        animation: false,
        tooltip: {
          backgroundColor: '#0b1120',
          borderColor: '#334155',
          textStyle: { color: '#e2e8f0' },
        },
        radar: {
          indicator: dims,
          splitNumber: 4,
          radius: '66%',
          axisName: { color: '#94a3b8', fontSize: 11 },
          splitLine: { lineStyle: { color: '#334155' } },
          axisLine: { lineStyle: { color: '#334155' } },
          splitArea: { areaStyle: { color: ['rgba(148,163,184,0.03)', 'rgba(148,163,184,0.01)'] } },
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                name: 'You',
                value: userSeries,
                areaStyle: { color: 'rgba(34,211,238,0.25)' },
                lineStyle: { color: '#22d3ee', width: 2 },
                itemStyle: { color: '#67e8f9' },
              },
              {
                name: this.comparison.profile.name,
                value: champSeries,
                lineStyle: { color: '#fbbf24', width: 2, type: 'dashed' },
                itemStyle: { color: '#fde68a' },
              },
            ],
          },
        ],
      })
    },
    renderHistory() {
      if (!this.$refs.historyEl) return
      if (!this.historyChart) {
        this.historyChart = echarts.init(this.$refs.historyEl, null, { renderer: 'svg' })
      }

      const rows = (Array.isArray(this.snapshots) ? this.snapshots : [])
        .slice(-90)
        .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))

      const x = rows.map((r) => r.date)
      const colors = {
        tierIndex: '#fbbf24',
        drillMs: '#22d3ee',
        acc2s: '#818cf8',
        acc3s: '#60a5fa',
        acc5s: '#34d399',
        volume: '#fb7185',
        mastery: '#a78bfa',
        retention: '#4ade80',
      }

      const series = this.activeTrendMetrics.map((metricKey) => {
        const data = rows.map((r) => {
          if (metricKey === 'tierIndex') return toNum(r.tierIndex, 0)
          if (metricKey === 'drillMs') return normalizeMetric('drillMs', toNum(r.drillMs, 0))
          if (metricKey === 'volume') return normalizeMetric('volume', toNum(r.volume, 0))
          return toNum(r[metricKey], 0)
        })
        return {
          name: this.metricLabel(metricKey),
          type: 'line',
          smooth: true,
          symbol: 'none',
          data,
          lineStyle: { width: metricKey === 'tierIndex' ? 2.5 : 1.8, color: colors[metricKey] || '#94a3b8' },
        }
      })

      this.historyChart.setOption({
        animation: false,
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#0b1120',
          borderColor: '#334155',
          textStyle: { color: '#e2e8f0' },
        },
        legend: { top: 0, textStyle: { color: '#94a3b8' } },
        grid: { left: 30, right: 18, top: 32, bottom: 20, containLabel: true },
        xAxis: {
          type: 'category',
          data: x,
          axisLabel: { color: '#64748b', showMaxLabel: true, showMinLabel: true },
          axisLine: { lineStyle: { color: '#334155' } },
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } },
        },
        series,
      })
    },
    toggleTrendMetric(metricKey) {
      const exists = this.activeTrendMetrics.includes(metricKey)
      if (exists) {
        if (this.activeTrendMetrics.length === 1) return
        this.activeTrendMetrics = this.activeTrendMetrics.filter((key) => key !== metricKey)
      } else {
        this.activeTrendMetrics = [...this.activeTrendMetrics, metricKey]
      }
    },
    goalTitle(goal) {
      const iconMap = {
        drill: '⚡ Drill',
        competition: '🏁 Competition',
        review: '🧩 Review',
        'new-deck': '📚 Mastery',
      }
      return `${iconMap[goal.type] || 'Training'} • ${goal.deck}`
    },
    startGoal(goal) {
      this.$emit('launch-goal', goal)
    },
    startBottleneckAction() {
      if (this.goals.length) {
        this.$emit('launch-goal', this.goals[0])
        return
      }
      if (!this.topBottleneck) return
      this.$emit('launch-goal', {
        type: this.topBottleneck.actionType,
        deck: 'major',
        config: {},
      })
    },
  },
}
</script>
