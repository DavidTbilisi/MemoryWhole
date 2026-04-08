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
              <div class="text-[11px] text-slate-500">Attempts</div>
              <div class="text-base font-semibold text-slate-200">{{ globalRank.stats.totalAttempts }}</div>
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

    <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-4">
      <div class="mb-2 text-xs text-slate-300">{{ nextStepLine }}</div>
      <div class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">What Raises Score Next</div>
      <div class="space-y-1.5">
        <button
          v-for="(hint, index) in globalHints"
          :key="`hint-${index}`"
          class="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-200 transition hover:bg-slate-800/70"
          @click="runHintAction(hint.action)"
        >
          <span class="mr-1 text-emerald-300">↗</span>{{ hint.text }}
        </button>
      </div>
    </div>

    <!-- Learn More Section -->
    <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-lg font-bold text-slate-100">Want to understand ranking better?</h3>
          <p class="text-sm text-slate-400 mt-1">Learn how Global Rank and Synthetic Rank work, and get tips to improve.</p>
        </div>
        <button @click="goToRankingInfo" class="mt-3 w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 rounded-lg font-semibold text-slate-100 transition-all">
          Learn More →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ActivityHeatmapChart from './ActivityHeatmapChart.vue'
import RankRadarChart from './RankRadarChart.vue'
import { getAllRankInfo } from '../core/ranking'
import { getAllDeckAnalytics } from '../core/analytics'

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
      if (!this.globalRank?.nextRank) return 'Global rank is capped. Keep accuracy high to maintain this tier.'
      const gap = Math.max(0, Number(this.globalRank.nextRank.minScore || 0) - Number(this.globalRank.score || 0))
      return gap > 0
        ? `${gap}% away from ${this.globalRank.nextRank.rank}. This rank moves only when raw accuracy improves.`
        : `You are sitting on the promotion line for ${this.globalRank.nextRank.rank}.`
    },
    syntheticExplanation() {
      const parts = this.syntheticRank?.components || {}
      return `Synthetic rank rewards balanced progress: mastery ${parts.averageMastery || 0}%, accuracy ${parts.accuracy || 0}%, plus diversity bonus.`
    },
    recommendedDeck() {
      const analytics = getAllDeckAnalytics()
      const rows = Object.entries(analytics || {}).map(([deck, stats]) => {
        const attempts = Number(stats?.totalAttempts || 0)
        const correct = Number(stats?.totalCorrect || 0)
        const accuracy = attempts > 0 ? (correct / attempts) * 100 : 0
        return { deck, attempts, accuracy }
      }).filter((row) => row.attempts > 0)

      if (!rows.length) return 'major'
      rows.sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
      return rows[0].deck
    },
    nextStepLine() {
      const next = this.globalRank?.nextRank
      if (!next) return 'You reached max rank. Keep consistency high to hold this position.'
      const needed = Number(this.globalRank?.perfectNeeded || 0)
      if (needed > 0) {
        return `Next target: ${next.rank} (${next.minScore}%) • about ${needed} perfect answers needed.`
      }
      return `Next target: ${next.rank} (${next.minScore}%) • one clean run likely promotes.`
    },
    globalHints() {
      const stats = this.globalRank?.stats || {}
      const attempts = Number(stats.totalAttempts || 0)
      const deckCount = Number(stats.deckCount || 0)
      const score = Number(this.globalRank?.score || 0)
      const hints = []

      if (this.globalRank?.nextRank) {
        const target = this.globalRank.nextRank
        const need = Number(this.globalRank.perfectNeeded || 0)
        if (need > 0) {
          hints.push({ text: `Push to ${target.rank} (${target.minScore}%): stack ${Math.min(need, 30)} clean answers now.`, action: 'start-weakest' })
        } else {
          hints.push({ text: `You're close to ${target.rank}. Start a short clean run now.`, action: 'start-weakest' })
        }
      } else {
        hints.push({ text: 'Max rank reached: protect accuracy by stopping after 2 misses, then review weak items.', action: 'open-dashboard' })
      }

      if (score < 85) {
        hints.push({ text: 'Biggest gain: practice weakest deck until it stays above 85% accuracy.', action: 'open-dashboard' })
      } else {
        hints.push({ text: 'Keep sessions short and clean: 10-20 attempts at 95%+ to preserve rank.', action: 'start-weakest' })
      }

      if (attempts < 150) {
        hints.push({ text: 'Increase sample size: add 30-50 high-accuracy attempts for steadier climbs.', action: 'start-weakest' })
      } else if (deckCount < 5) {
        hints.push({ text: 'Expand deck coverage: add 1-2 new decks to stabilize global rank.', action: 'open-dashboard' })
      } else {
        hints.push({ text: 'Cycle your 2 weakest decks first each day for fastest incremental gains.', action: 'open-dashboard' })
      }

      return hints.slice(0, 3)
    }
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
    runHintAction(action) {
      if (action === 'start-weakest') {
        this.$emit('start-recommended', this.recommendedDeck)
        return
      }
      if (action === 'open-dashboard') {
        this.$emit('dashboard-recommended', this.recommendedDeck)
        return
      }
      this.$emit('view-ranking-info')
    },
    goToRankingInfo() {
      this.$emit('view-ranking-info')
    }
  }
}
</script>

<style scoped>
</style>
