<template>
  <div class="rounded-2xl border border-slate-700/80 bg-[#0f0f23] p-3 md:p-4">
    <div class="mb-2 text-xs font-semibold tracking-widest text-slate-400">DECK ANALYTICS</div>
    <div ref="chartEl" class="h-44 w-full"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'DeckAnalyticsChart',
  props: {
    deck: { type: String, default: 'major' },
    totals: { type: Object, required: true }
  },
  data() {
    return { chart: null }
  },
  methods: {
    renderChart() {
      if (!this.chart) this.chart = echarts.init(this.$refs.chartEl)
      const attempts = Number(this.totals?.totalAttempts || 0)
      const correct = Number(this.totals?.totalCorrect || 0)
      const wrong = Number(this.totals?.totalWrong || 0)

      this.chart.setOption({
        animation: false,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: '#0b1120',
          borderColor: '#334155',
          textStyle: { color: '#e2e8f0' },
        },
        grid: { left: 20, right: 10, top: 20, bottom: 20, containLabel: true },
        xAxis: {
          type: 'category',
          data: ['Attempts', 'Correct', 'Wrong'],
          axisLabel: { color: '#94a3b8' },
          axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        series: [{
          type: 'bar',
          barWidth: 34,
          data: [
            { value: attempts, itemStyle: { color: '#06b6d4' } },
            { value: correct, itemStyle: { color: '#10b981' } },
            { value: wrong, itemStyle: { color: '#ef4444' } },
          ],
          label: { show: true, position: 'top', color: '#cbd5e1' },
        }],
      })
    },
    handleResize() {
      if (this.chart) this.chart.resize()
    }
  },
  watch: {
    totals: {
      deep: true,
      handler() { this.renderChart() }
    }
  },
  mounted() {
    this.renderChart()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  }
}
</script>
