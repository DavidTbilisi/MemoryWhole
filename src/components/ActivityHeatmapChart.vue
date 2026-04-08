<template>
  <div class="rounded-2xl border border-slate-700/80 bg-slate-900/50 p-4 flex flex-col">
    <div class="text-xs font-semibold tracking-widest text-slate-400 mb-3">ACTIVITY HEATMAP</div>
    <div ref="chartEl" class="w-full"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { readJson } from '../core/storage'

export default {
  name: 'ActivityHeatmapChart',
  data() {
    return { chart: null }
  },
  methods: {
    getCalendarLayout() {
      const top = 28
      const left = 42
      const right = 12
      const bottom = 14
      const weeks = 54
      const rows = 7
      const width = Number(this.$refs.chartEl?.clientWidth || 900)
      const usableWidth = Math.max(width - left - right, 280)
      const cell = Math.max(8, Math.min(16, Math.floor(usableWidth / weeks)))
      const height = top + bottom + (rows * cell) + 44
      return { top, left, right, bottom, cell, height }
    },
    buildSeries() {
      const activity = readJson('activityLog_v1', {})
      const year = new Date().getFullYear()
      const startDate = +echarts.time.parse(year + '-01-01')
      const endDate = +echarts.time.parse(year + '-12-31')
      const dayTime = 3600 * 24 * 1000
      const data = []

      for (let time = startDate; time <= endDate; time += dayTime) {
        const dateStr = echarts.time.format(time, '{yyyy}-{MM}-{dd}', false)
        const day = activity[dateStr] || { drills: 0, sessions: 0, attempts: 0 }
        const total = Number(day.drills || 0) + Number(day.sessions || 0)
        data.push([dateStr, total])
      }
      return data
    },
    renderChart() {
      const data = this.buildSeries()
      const max = Math.max(...data.map((x) => x[1]), 1)
      const year = new Date().getFullYear()
      const yearStr = String(year)
      const layout = this.getCalendarLayout()

      if (this.$refs.chartEl) {
        this.$refs.chartEl.style.height = `${layout.height}px`
      }

      if (!this.chart) {
        this.chart = echarts.init(this.$refs.chartEl, null, { renderer: 'svg' })
      } else {
        // Ensure the drawing surface matches new dynamic height before painting.
        this.chart.resize()
      }

      this.chart.setOption({
        animation: false,
        tooltip: {
          backgroundColor: '#0b1120',
          borderColor: '#334155',
          textStyle: { color: '#e2e8f0' },
          formatter: (p) => `${p.value[0]}: ${p.value[1]} activities`,
        },
        visualMap: {
          min: 0,
          max,
          show: false,
          inRange: {
            color: ['#0f172a', '#1e3a5f', '#1e40af', '#3b82f6', '#60a5fa'],
          },
        },
        calendar: {
          top: layout.top,
          left: layout.left,
          right: layout.right,
          bottom: layout.bottom,
          cellSize: [layout.cell, layout.cell],
          range: yearStr,
          itemStyle: {
            borderWidth: 0.5,
            borderColor: '#1f2937',
          },
          dayLabel: {
            color: '#64748b',
            fontSize: 12,
            nameMap: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
          },
          monthLabel: { 
            color: '#94a3b8',
            fontSize: 13,
            margin: 10,
          },
          yearLabel: { show: false },
          splitLine: { show: false },
        },
        series: [{
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data,
          itemStyle: {
            borderRadius: 1,
          },
        }],
      })
    },
    handleResize() {
      if (this.chart) {
        this.renderChart()
      }
    }
  },
  mounted() {
    this.renderChart()
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('storage', this.renderChart)
    window.addEventListener('mnemonic-stats-updated', this.renderChart)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('storage', this.renderChart)
    window.removeEventListener('mnemonic-stats-updated', this.renderChart)
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  }
}
</script>
