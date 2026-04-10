<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
      <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-4">
          <div class="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Global Rank</div>
          <div class="mt-3 flex items-center justify-between gap-4">
            <div class="min-w-0">
              <div class="text-4xl font-black"
                :style="{ color: globalRank.color, textShadow: `0 0 16px ${globalRank.color}55` }">
                {{ globalRank.rank }}
              </div>
              <div class="mt-1 text-sm font-medium text-slate-300">{{ globalRank.description }}</div>
            </div>
            <div class="relative h-20 w-20 shrink-0 rounded-full" :style="globalGaugeStyle">
              <div class="absolute inset-[6px] rounded-full bg-slate-900/95 border border-slate-700/70"></div>
              <div class="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div class="text-xl font-black text-cyan-300 leading-none">{{ globalRank.score }}%</div>
                  <div class="mt-1 text-[10px] uppercase tracking-wider text-slate-500">accuracy</div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 border-t border-slate-700/50 pt-3">
            <div>
              <div class="text-[11px] text-slate-500">Recent attempts</div>
              <div class="text-base font-semibold text-slate-200">{{ globalRank.stats.totalAttempts }}<span class="text-[10px] text-slate-600 ml-1">/200</span></div>
            </div>
            <div>
              <div class="text-[11px] text-slate-500">Decks</div>
              <div class="text-base font-semibold text-slate-200">{{ globalRank.stats.deckCount }}</div>
            </div>
          </div>
          <div class="mt-3">
            <div class="mb-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Accuracy vs next rank</span>
              <span v-if="globalRank.nextRank">target {{ globalRank.nextRank.minScore }}%</span>
              <span v-else>maxed</span>
            </div>
            <div class="relative h-2 rounded-full bg-slate-800 overflow-hidden">
              <div class="h-full bg-gradient-to-r"
                :style="{
                  width: globalRank.score + '%',
                  backgroundImage: `linear-gradient(to right, ${globalRank.color}, #4361ee)`
                }">
              </div>
              <div
                v-if="globalRank.nextRank"
                class="absolute top-0 h-full w-[2px] bg-slate-200/80"
                :style="{ left: `${Math.min(globalRank.nextRank.minScore, 100)}%` }"
              ></div>
            </div>
            <div class="mt-2 text-xs text-slate-400">{{ globalExplanation }}</div>
          </div>
      </div>

      <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-4">
          <div class="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Synthetic Rank</div>
          <div class="mt-3 flex items-end justify-between gap-3">
            <div>
              <div class="text-4xl font-black"
                :style="{ color: syntheticRank.color, textShadow: `0 0 16px ${syntheticRank.color}55` }">
                {{ syntheticRank.rank }}
              </div>
              <div class="mt-1 text-sm font-medium text-slate-300">{{ syntheticRank.description }}</div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-violet-400">{{ syntheticRank.score }}</div>
              <div class="text-[11px] text-slate-500 mt-1">composite</div>
            </div>
          </div>
          <div class="mt-3 space-y-2 text-xs">
            <div class="overflow-hidden rounded-full bg-slate-800 h-3 flex">
              <div
                v-for="segment in syntheticSegments"
                :key="segment.key"
                class="h-full"
                :style="{ width: `${segment.width}%`, background: segment.background }"
              ></div>
            </div>
            <div class="grid grid-cols-1 gap-1 pt-1">
              <div v-for="segment in syntheticSegments" :key="`${segment.key}-legend`" class="flex items-center justify-between gap-3 text-slate-400">
                <div class="inline-flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ background: segment.dot }"></span>
                  <span>{{ segment.label }}</span>
                </div>
                <span class="text-slate-200">{{ segment.valueLabel }}</span>
              </div>
            </div>
          </div>
          <div class="mt-3 text-xs text-slate-400">{{ syntheticExplanation }}</div>
      </div>

      <RankRadarChart :global-rank="globalRank" :synthetic-rank="syntheticRank" />
    </div>

    <div class="hidden md:block">
      <ActivityHeatmapChart />
    </div>

    <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-100">Want to understand ranking better?</h3>
        <p class="mt-1 text-sm text-slate-400">Learn how Global Rank and Synthetic Rank work, and try the interactive simulator.</p>
      </div>
      <button @click="goToRankingInfo" class="shrink-0 px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 rounded-lg font-semibold text-slate-100 transition-all">
        Learn More →
      </button>
    </div>
  </div>
</template>

<script>
import ActivityHeatmapChart from './ActivityHeatmapChart.vue'
import RankRadarChart from './RankRadarChart.vue'
import { getAllRankInfo } from '../core/ranking'

export default {
  name: 'RankDisplay',
  components: { ActivityHeatmapChart, RankRadarChart },
  data() {
    return {
      globalRank: { rank: 'D', score: 0, color: '#00b4d8', description: 'Initialize', stats: { totalAttempts: 0, deckCount: 0 } },
      syntheticRank: { rank: 'D', score: 0, color: '#00b4d8', description: 'Initialize' }
    }
  },
  computed: {
    globalGaugeStyle() {
      const score = Math.max(0, Math.min(100, Number(this.globalRank?.score || 0)))
      return {
        background: `conic-gradient(${this.globalRank?.color || '#00b4d8'} 0deg, ${this.globalRank?.color || '#00b4d8'} ${score * 3.6}deg, rgba(30,41,59,0.7) ${score * 3.6}deg, rgba(30,41,59,0.7) 360deg)`
      }
    },
    syntheticSegments() {
      const parts = this.syntheticRank?.components || {}
      const mastery = Number(parts.weightedMastery || 0)
      const accuracy = Number(parts.weightedAccuracy || 0)
      const diversity = Number(parts.diversityBonus || 0)
      return [
        {
          key: 'mastery',
          label: 'Mastery contribution',
          width: mastery,
          valueLabel: mastery.toFixed(1),
          background: 'linear-gradient(to right, #8b5cf6, #d946ef)',
          dot: '#a855f7',
        },
        {
          key: 'accuracy',
          label: 'Accuracy contribution',
          width: accuracy,
          valueLabel: accuracy.toFixed(1),
          background: 'linear-gradient(to right, #06b6d4, #60a5fa)',
          dot: '#22d3ee',
        },
        {
          key: 'diversity',
          label: 'Diversity bonus',
          width: diversity,
          valueLabel: `+${diversity.toFixed(1)}`,
          background: 'linear-gradient(to right, #f59e0b, #fde047)',
          dot: '#fbbf24',
        },
      ]
    },
    globalExplanation() {
      if (!this.globalRank?.nextRank) return 'Global rank is capped. Maintain both accuracy and deck coverage to hold this tier.'
      const gap = Math.max(0, Number(this.globalRank.nextRank.minScore || 0) - Number(this.globalRank.score || 0))
      const coverageNeed = Number(this.globalRank?.coverageDecksNeeded || 0)
      if (coverageNeed > 0) {
        return `${gap}% away from ${this.globalRank.nextRank.rank}. Unlock ${coverageNeed} more deck${coverageNeed === 1 ? '' : 's'} to keep climbing.`
      }
      return gap > 0
        ? `${gap}% away from ${this.globalRank.nextRank.rank}. This rank moves with both accuracy and coverage.`
        : `You are sitting on the promotion line for ${this.globalRank.nextRank.rank}.`
    },
    syntheticExplanation() {
      const parts = this.syntheticRank?.components || {}
      return `Synthetic rank rewards balanced progress: mastery ${parts.averageMastery || 0}%, accuracy ${parts.accuracy || 0}%, plus diversity bonus.`
    },
  },
  mounted() {
    this.updateRanks()
    // Update ranks when storage changes
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
    },
    goToRankingInfo() {
      this.$emit('view-ranking-info')
    }
  }
}
</script>

<style scoped>
</style>
