<template>
  <div v-if="supported" class="rounded-2xl border border-slate-700/80 bg-[#0f0f23] p-3 md:p-4">
    <div class="mb-2 text-xs font-semibold tracking-widest text-slate-400">ITEM ACCURACY HEATMAP</div>
    <div ref="chartEl" class="h-64 w-full"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { loadDeckData } from '../core/deck-loader'
import { getDeckStatsMap } from '../core/analytics'

const SEM3_LABELS = ['Vision', 'Sound', 'Smell', 'Taste', 'Touch', 'Sensation', 'Animals', 'Birds', 'Rainbow', 'Solar-System']

export default {
  name: 'DeckHeatmapCartesian',
  props: {
    deck: { type: String, required: true }
  },
  data() {
    return {
      chart: null,
      supported: true,
    }
  },
  methods: {
    supportsDeck(deck) {
      return ['major', 'pegaudio', 'pegvisual', 'pegmatrix', 'pegmatrixru', 'sem3', 'hex'].includes(deck)
    },
    normalizeMetric(stat) {
      const attempts = Number(stat?.attempts || 0)
      const correct = Number(stat?.correct || 0)
      if (!attempts) return -1
      return Math.round((correct / attempts) * 100)
    },
    buildGrid(deck, dataMap, statsMap) {
      const entries = Object.keys(dataMap || {})
      const metric = (k) => this.normalizeMetric(statsMap[String(k)] || statsMap[String(k).padStart(2, '0')] || {})

      if (deck === 'hex') {
        const axis = ['00', '01', '10', '11']
        const points = entries.map((k) => {
          const hex = String(k).toUpperCase()
          const n = Number.parseInt(hex, 16)
          const bits = Number.isFinite(n) ? n.toString(2).padStart(4, '0') : '0000'
          return [bits.slice(2), bits.slice(0, 2), metric(k), hex]
        })
        return { xAxis: axis, yAxis: [...axis].reverse(), points }
      }

      if (deck === 'sem3') {
        const groups = Array.from({ length: 10 }, () => [])
        entries.forEach((k) => {
          const s = String(k)
          const row = Number(s[0])
          if (Number.isFinite(row) && row >= 0 && row < 10) groups[row].push(s)
        })
        groups.forEach((g) => g.sort((a, b) => Number(a) - Number(b)))
        const maxCols = Math.max(...groups.map((g) => g.length), 1)
        const xAxis = Array.from({ length: maxCols }, (_, i) => String(i + 1))
        const yAxis = [...SEM3_LABELS].reverse()
        const points = []
        for (let row = 0; row < groups.length; row += 1) {
          groups[row].forEach((key, col) => {
            points.push([String(col + 1), SEM3_LABELS[row], metric(key), key])
          })
        }
        return { xAxis, yAxis, points }
      }

      const xAxis = Array.from({ length: 10 }, (_, i) => String(i))
      const yAxis = [...xAxis].reverse()
      const points = entries.map((k) => {
        const num = Number(String(k))
        const row = Math.floor(num / 10)
        const col = num % 10
        return [String(col), String(row), metric(k), String(k).padStart(2, '0')]
      })
      return { xAxis, yAxis, points }
    },
    async renderChart() {
      this.supported = this.supportsDeck(this.deck)
      if (!this.supported) return

      const [dataMap] = await Promise.all([loadDeckData(this.deck)])
      const statsMap = getDeckStatsMap(this.deck)
      const { xAxis, yAxis, points } = this.buildGrid(this.deck, dataMap, statsMap)

      if (!this.chart) this.chart = echarts.init(this.$refs.chartEl)
      this.chart.setOption({
        animation: false,
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          borderColor: '#475569',
          borderWidth: 1,
          textStyle: { color: '#e2e8f0' },
          formatter: (p) => {
            const value = Number(p.value[2])
            const label = p.value[3]
            return `${label}<br/>Accuracy: ${value < 0 ? 'No attempts yet' : `${value}%`}`
          },
        },
        grid: { left: 40, right: 10, top: 8, bottom: 30 },
        xAxis: {
          type: 'category',
          data: xAxis,
          splitArea: { show: false },
          axisLabel: { color: '#a5b4fc' },
          axisLine: { lineStyle: { color: '#334155' } },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'category',
          data: yAxis,
          splitArea: { show: false },
          axisLabel: { color: '#a5b4fc' },
          axisLine: { lineStyle: { color: '#334155' } },
          axisTick: { show: false },
        },
        visualMap: {
          dimension: 2,
          min: 0,
          max: 100,
          show: false,
          inRange: {
            color: ['#ef4444', '#f59e0b', '#facc15', '#84cc16', '#10b981']
          },
          outOfRange: {
            color: ['#e5e7eb']
          },
          textStyle: { color: '#94a3b8' },
        },
        series: [{
          name: 'Accuracy',
          type: 'heatmap',
          data: points,
          label: {
            show: true,
            color: '#1f2937',
            formatter: (v) => {
              const value = Number(v.value[2])
              return value < 0 ? '—' : `${value}`
            },
            fontSize: 10,
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: '#cbd5e1',
            borderRadius: 2,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: 'rgba(0,0,0,0.4)',
            }
          }
        }]
      })
    },
    onResize() {
      if (this.chart) this.chart.resize()
    }
  },
  watch: {
    deck: {
      immediate: true,
      handler() {
        this.renderChart().catch((e) => {
          console.error(e)
          this.supported = false
        })
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.onResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize)
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  }
}
</script>
