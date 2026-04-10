<template>
  <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-6">
    <div class="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-100">Interactive Rank Simulator</h2>
        <p class="mt-1 text-sm text-slate-400">Model Global and Synthetic rank changes with live sliders and chart projections.</p>
      </div>
      <div class="rounded-lg border border-cyan-500/40 bg-cyan-900/20 px-3 py-1 text-xs font-semibold text-cyan-200">Live</div>
    </div>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div class="space-y-2 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
        <label class="block text-xs text-slate-300">
          <div class="mb-1 flex items-center justify-between">
            <span>Global accuracy</span>
            <strong class="text-cyan-200">{{ simulator.accuracy }}%</strong>
          </div>
          <input v-model.number="simulator.accuracy" type="range" min="0" max="100" class="w-full accent-cyan-400" />
        </label>

        <label class="block text-xs text-slate-300">
          <div class="mb-1 flex items-center justify-between">
            <span>Deck coverage</span>
            <strong class="text-emerald-200">{{ simulator.coverageDecks }} / {{ simTotalDeckCount }}</strong>
          </div>
          <input v-model.number="simulator.coverageDecks" type="range" min="1" :max="simTotalDeckCount" class="w-full accent-emerald-400" />
        </label>

        <label class="block text-xs text-slate-300">
          <div class="mb-1 flex items-center justify-between">
            <span>Average mastery</span>
            <strong class="text-violet-200">{{ simulator.mastery }}%</strong>
          </div>
          <input v-model.number="simulator.mastery" type="range" min="0" max="100" class="w-full accent-violet-400" />
        </label>

        <label class="block text-xs text-slate-300">
          <div class="mb-1 flex items-center justify-between">
            <span>Deck diversity</span>
            <strong class="text-amber-200">{{ simulator.diversityDecks }} deck{{ simulator.diversityDecks === 1 ? '' : 's' }}</strong>
          </div>
          <input v-model.number="simulator.diversityDecks" type="range" min="0" :max="simTotalDeckCount" class="w-full accent-amber-400" />
        </label>
      </div>

      <div class="space-y-3">
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div class="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">
            <div class="text-[11px] uppercase tracking-wider text-slate-400">Simulated Global Rank</div>
            <div class="mt-1 flex items-center justify-between">
              <div class="text-2xl font-black" :style="{ color: simGlobalRankInfo.color }">{{ simGlobalRankInfo.rank }}</div>
              <div class="text-lg font-bold text-cyan-200">{{ simGlobalScore }}%</div>
            </div>
            <div class="mt-2 relative h-2 rounded-full bg-slate-800 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-cyan-500 to-emerald-400" :style="{ width: `${simGlobalScore}%` }"></div>
              <div v-if="simGlobalNext" class="absolute top-0 h-full w-[2px] bg-slate-200/80" :style="{ left: `${Math.min(simGlobalNext.minScore, 100)}%` }"></div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">
            <div class="text-[11px] uppercase tracking-wider text-slate-400">Simulated Synthetic Rank</div>
            <div class="mt-1 flex items-center justify-between">
              <div class="text-2xl font-black" :style="{ color: simSyntheticRankInfo.color }">{{ simSyntheticRankInfo.rank }}</div>
              <div class="text-lg font-bold text-violet-200">{{ simSyntheticScore }}%</div>
            </div>
            <div class="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-800">
              <div v-for="segment in simSyntheticSegments" :key="`sim-${segment.key}`" class="h-full" :style="{ width: `${segment.width}%`, background: segment.background }"></div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-2">
          <div class="mb-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Projection if accuracy improves (coverage fixed)</span>
            <span>{{ simProjectionLabel }}</span>
          </div>
          <svg viewBox="0 0 100 28" preserveAspectRatio="none" class="h-16 w-full">
            <polyline fill="none" stroke="#22d3ee" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" :points="simProjectionPoints" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAllRankInfo, getNextRankInfo, getRankInfo } from '../core/ranking'

export default {
  name: 'RankSimulator',
  data() {
    return {
      globalRank: { stats: { totalDeckCount: 10, deckCount: 1, globalAccuracy: 80 } },
      syntheticRank: { components: { averageMastery: 70 } },
      simulatorInitialized: false,
      simulator: {
        accuracy: 80,
        coverageDecks: 1,
        mastery: 70,
        diversityDecks: 1,
      },
    }
  },
  computed: {
    simTotalDeckCount() {
      return Math.max(1, Number(this.globalRank?.stats?.totalDeckCount || 10))
    },
    simCoverageRatio() {
      return Math.max(0, Math.min(1, Number(this.simulator.coverageDecks || 0) / this.simTotalDeckCount))
    },
    simGlobalScore() {
      return Math.max(0, Math.min(100, Math.round(Number(this.simulator.accuracy || 0) * this.simCoverageRatio)))
    },
    simGlobalRankInfo() {
      return getRankInfo(this.simGlobalScore)
    },
    simGlobalNext() {
      return getNextRankInfo(this.simGlobalScore)
    },
    simSyntheticComponents() {
      const mastery = Math.max(0, Math.min(100, Number(this.simulator.mastery || 0)))
      const accuracy = Math.max(0, Math.min(100, Number(this.simulator.accuracy || 0)))
      const diversityBonus = Math.min(Number(this.simulator.diversityDecks || 0) * 2, 10)
      return {
        weightedMastery: Number((mastery * 0.6).toFixed(1)),
        weightedAccuracy: Number((accuracy * 0.4).toFixed(1)),
        diversityBonus: Number(diversityBonus.toFixed(1)),
      }
    },
    simSyntheticScore() {
      const total = this.simSyntheticComponents.weightedMastery
        + this.simSyntheticComponents.weightedAccuracy
        + this.simSyntheticComponents.diversityBonus
      return Math.max(0, Math.min(100, Math.round(total)))
    },
    simSyntheticRankInfo() {
      return getRankInfo(this.simSyntheticScore)
    },
    simSyntheticSegments() {
      return [
        {
          key: 'mastery',
          width: this.simSyntheticComponents.weightedMastery,
          background: 'linear-gradient(to right, #8b5cf6, #d946ef)',
        },
        {
          key: 'accuracy',
          width: this.simSyntheticComponents.weightedAccuracy,
          background: 'linear-gradient(to right, #06b6d4, #60a5fa)',
        },
        {
          key: 'diversity',
          width: this.simSyntheticComponents.diversityBonus,
          background: 'linear-gradient(to right, #f59e0b, #fde047)',
        },
      ]
    },
    simProjectionPoints() {
      const steps = 10
      const points = []
      for (let i = 0; i <= steps; i += 1) {
        const x = (i / steps) * 100
        const projectedAccuracy = Math.min(100, Number(this.simulator.accuracy || 0) + (i * 3))
        const projectedScore = Math.max(0, Math.min(100, projectedAccuracy * this.simCoverageRatio))
        const y = 24 - ((projectedScore / 100) * 20)
        points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
      }
      return points.join(' ')
    },
    simProjectionLabel() {
      const maxProjected = Math.min(100, (Math.min(100, Number(this.simulator.accuracy || 0) + 30) * this.simCoverageRatio))
      const gain = Math.max(0, Math.round(maxProjected - this.simGlobalScore))
      return `up to +${gain}% global score`
    }
  },
  mounted() {
    this.updateRanks()
    window.addEventListener('storage', this.updateRanks)
    window.addEventListener('mnemonic-stats-updated', this.updateRanks)
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.updateRanks)
    window.removeEventListener('mnemonic-stats-updated', this.updateRanks)
  },
  methods: {
    updateRanks() {
      const rankInfo = getAllRankInfo()
      this.globalRank = rankInfo.global
      this.syntheticRank = rankInfo.synthetic
      if (!this.simulatorInitialized) {
        const stats = this.globalRank?.stats || {}
        const totalDeckCount = Math.max(1, Number(stats.totalDeckCount || 10))
        const deckCount = Math.max(1, Math.min(totalDeckCount, Number(stats.deckCount || 1)))
        this.simulator.accuracy = Math.max(0, Math.min(100, Number(stats.globalAccuracy || 80)))
        this.simulator.coverageDecks = deckCount
        this.simulator.diversityDecks = deckCount
        this.simulator.mastery = Math.max(0, Math.min(100, Number(this.syntheticRank?.components?.averageMastery || 70)))
        this.simulatorInitialized = true
      }
    },
  },
}
</script>

<style scoped>
</style>
