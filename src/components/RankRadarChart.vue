<template>
  <div class="rounded-2xl border border-slate-700/80 bg-slate-900/50 p-4">
    <div class="mb-3 text-xs font-semibold tracking-widest text-slate-400">RANK FUSION RADAR</div>
    <div ref="chartEl" class="h-[240px] w-full"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'RankRadarChart',
  props: {
    globalRank: { type: Object, required: true },
    syntheticRank: { type: Object, required: true },
    maxDecks: { type: Number, default: 12 },
  },
  data() {
    return {
      chart: null,
    }
  },
  watch: {
    globalRank: {
      deep: true,
      handler() { this.renderChart() },
    },
    syntheticRank: {
      deep: true,
      handler() { this.renderChart() },
    },
  },
  methods: {
    normalizeAttempts(attempts) {
      const n = Number(attempts || 0)
      // Smooth cap near 100 without hard clipping too early.
      return Math.max(0, Math.min(100, Math.round((1 - Math.exp(-n / 800)) * 100)))
    },
    getRadarValues() {
      const attempts = Number(this.globalRank?.stats?.totalAttempts || 0)
      const deckCount = Number(this.globalRank?.stats?.deckCount || 0)
      const deckCoverage = Math.round((Math.max(0, deckCount) / Math.max(1, this.maxDecks)) * 100)

      return [
        Number(this.globalRank?.score || 0),
        Number(this.syntheticRank?.score || 0),
        Math.max(0, Math.min(100, deckCoverage)),
        this.normalizeAttempts(attempts),
      ]
    },
    getPalette() {
      const css = getComputedStyle(document.documentElement)
      const b1 = css.getPropertyValue('--brand-1').trim() || '#7aa2f7'
      const b2 = css.getPropertyValue('--brand-2').trim() || '#bb9af7'
      const edge = css.getPropertyValue('--edge').trim() || '#4b5563'
      const text = css.getPropertyValue('--text-soft').trim() || '#94a3b8'
      return { b1, b2, edge, text }
    },
    renderChart() {
      if (!this.$refs.chartEl) return
      if (!this.chart) {
        this.chart = echarts.init(this.$refs.chartEl, null, { renderer: 'svg' })
      }

      const values = this.getRadarValues()
      const { b1, b2, edge, text } = this.getPalette()

      this.chart.setOption({
        animation: false,
        tooltip: {
          backgroundColor: '#0b1120',
          borderColor: edge,
          textStyle: { color: '#e2e8f0' },
        },
        radar: {
          radius: '66%',
          splitNumber: 4,
          indicator: [
            { name: 'Global Accuracy', max: 100 },
            { name: 'Synthetic Score', max: 100 },
            { name: 'Deck Coverage', max: 100 },
            { name: 'Practice Volume', max: 100 },
          ],
          axisName: {
            color: text,
            fontSize: 11,
          },
          splitArea: {
            areaStyle: {
              color: ['rgba(148,163,184,0.02)', 'rgba(148,163,184,0.01)'],
            },
          },
          axisLine: {
            lineStyle: {
              color: edge,
            },
          },
          splitLine: {
            lineStyle: {
              color: edge,
            },
          },
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                value: values,
                name: 'Merged Rank Profile',
                areaStyle: {
                  color: `${b1}33`,
                },
                lineStyle: {
                  color: b1,
                  width: 2,
                },
                itemStyle: {
                  color: b2,
                },
                symbolSize: 6,
              },
            ],
          },
        ],
      })
    },
    handleResize() {
      if (!this.chart) return
      this.chart.resize()
    },
  },
  mounted() {
    this.renderChart()
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('mnemonic-stats-updated', this.renderChart)
    window.addEventListener('storage', this.renderChart)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('mnemonic-stats-updated', this.renderChart)
    window.removeEventListener('storage', this.renderChart)
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  },
}
</script>