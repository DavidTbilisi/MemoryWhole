<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-3 items-stretch">
      <!-- Global Rank Card -->
      <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-6 flex flex-col justify-between">
        <div>
          <div class="text-xs font-semibold tracking-widest text-slate-400 uppercase">Global Rank</div>
          
          <div class="mt-4 flex items-end justify-between">
            <div>
              <div class="text-5xl font-black"
                :style="{ color: globalRank.color, textShadow: `0 0 20px ${globalRank.color}66` }">
                {{ globalRank.rank }}
              </div>
              <div class="mt-1 text-sm font-medium text-slate-300">
                {{ globalRank.description }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-3xl font-bold text-cyan-400">{{ globalRank.score }}%</div>
              <div class="text-xs text-slate-500 mt-1">accuracy</div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2 border-t border-slate-700/50 pt-4">
            <div>
              <div class="text-xs text-slate-500">Attempts</div>
              <div class="text-lg font-semibold text-slate-200">{{ globalRank.stats.totalAttempts }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Decks</div>
              <div class="text-lg font-semibold text-slate-200">{{ globalRank.stats.deckCount }}</div>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div class="h-full bg-gradient-to-r" 
              :style="{ 
                width: globalRank.score + '%',
                backgroundImage: `linear-gradient(to right, ${globalRank.color}, #4361ee)`
              }">
            </div>
          </div>

          <div class="mt-3 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
            <div class="mb-2 text-xs text-slate-300">{{ nextStepLine }}</div>
            <div class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">What Raises Score Next</div>
            <div class="space-y-1.5">
              <button
                v-for="(hint, index) in globalHints"
                :key="`hint-${index}`"
                class="block w-full rounded-md px-1 py-1 text-left text-xs text-slate-200 transition hover:bg-slate-800/70"
                @click="runHintAction(hint.action)"
              >
                <span class="mr-1 text-emerald-300">↗</span>{{ hint.text }}
              </button>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="mt-4 pt-4 border-t border-slate-700/50">
          <p class="text-xs text-slate-400">Your overall accuracy across all memory decks. Higher is better.</p>
        </div>
      </div>

      <!-- Synthetic Rank Card + Heatmap -->
      <div class="xl:col-span-2 flex flex-col gap-4">
        <!-- Synthetic Rank Card -->
        <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-6 flex flex-col justify-between">
          <div>
            <div class="text-xs font-semibold tracking-widest text-slate-400 uppercase">Synthetic Rank</div>
        
            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
              <div>
                <div class="text-5xl font-black"
                  :style="{ color: syntheticRank.color, textShadow: `0 0 20px ${syntheticRank.color}66` }">
                  {{ syntheticRank.rank }}
                </div>
                <div class="mt-1 text-sm font-medium text-slate-300">
                  {{ syntheticRank.description }}
                </div>
              </div>
              <div class="text-xs text-slate-400 md:px-2 md:text-center">
                Composite rank blends
                <span class="text-slate-200">mastery peaks</span>
                and
                <span class="text-slate-200">global accuracy</span>
                with a deck diversity bonus.
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-violet-400">{{ syntheticRank.score }}</div>
                <div class="text-xs text-slate-500 mt-1">composite</div>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div class="h-full bg-gradient-to-r" 
                :style="{ 
                  width: syntheticRank.score + '%',
                  backgroundImage: `linear-gradient(to right, ${syntheticRank.color}, #7209b7)`
                }">
              </div>
            </div>

          </div>
        </div>

        <!-- Heatmap (tablet/desktop only) -->
        <div class="hidden md:block">
          <ActivityHeatmapChart />
        </div>
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
import { getAllRankInfo } from '../core/ranking'
import { getAllDeckAnalytics } from '../core/analytics'

export default {
  name: 'RankDisplay',
  components: { ActivityHeatmapChart },
  data() {
    return {
      globalRank: { rank: 'D', score: 0, color: '#00b4d8', description: 'Initialize', stats: { totalAttempts: 0, deckCount: 0 } },
      syntheticRank: { rank: 'D', score: 0, color: '#00b4d8', description: 'Initialize' }
    }
  },
  computed: {
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
