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

export default {
  name: 'RankDisplay',
  components: { ActivityHeatmapChart },
  data() {
    return {
      globalRank: { rank: 'D', score: 0, color: '#00b4d8', description: 'Initialize', stats: { totalAttempts: 0, deckCount: 0 } },
      syntheticRank: { rank: 'D', score: 0, color: '#00b4d8', description: 'Initialize' }
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
    goToRankingInfo() {
      this.$emit('view-ranking-info')
    }
  }
}
</script>

<style scoped>
</style>
