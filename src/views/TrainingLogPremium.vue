<template>
  <div class="min-h-screen bg-slate-900 text-slate-100">
    <div class="max-w-4xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-slate-100">Training Log</h1>
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-slate-100 transition-colors text-sm font-medium"
          @click="$emit('back')"
        >
          Back
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/60">
          <div class="text-3xl font-black leading-none text-slate-100 mb-1">{{ summaryStats.acc }}</div>
          <div class="text-xs text-slate-500 uppercase tracking-wide">Accuracy</div>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/60">
          <div class="text-3xl font-black leading-none text-slate-100 mb-1">{{ summaryStats.sessions }}</div>
          <div class="text-xs text-slate-500 uppercase tracking-wide">Sessions</div>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/60">
          <div class="text-3xl font-black leading-none text-slate-100 mb-1">{{ summaryStats.attempts }}</div>
          <div class="text-xs text-slate-500 uppercase tracking-wide">Attempts</div>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/60">
          <div class="text-3xl font-black leading-none text-slate-100 mb-1">{{ summaryStats.kp }}</div>
          <div class="text-xs text-slate-500 uppercase tracking-wide">KP</div>
        </div>
      </div>

      <div class="bg-slate-800/50 rounded-lg p-5 border border-slate-700/60 mb-6 flex items-center gap-4">
        <div class="flex-1">
          <div
            class="text-4xl font-black leading-none mb-1"
            :class="dailyStreak.current > 0 ? 'text-amber-400' : 'text-slate-600'"
          >
            {{ dailyStreak.current > 0 ? `${dailyStreak.current}-day streak` : 'No active streak' }}
          </div>
          <div class="text-sm text-slate-500 mt-1">Longest: {{ dailyStreak.longest }} day{{ dailyStreak.longest !== 1 ? 's' : '' }}</div>
        </div>
      </div>

      <div v-if="hasTrainingLogPlus" class="mb-6">
        <div class="text-xs font-bold tracking-widest text-slate-400 mb-3">PRACTICE ACTIVITY</div>
        <ActivityHeatmapChart />
      </div>

      <div v-if="hasTrainingLogPlus" class="mb-6">
        <div class="text-xs font-bold tracking-widest text-slate-400 mb-3">DECK MASTERY</div>
        <div v-if="deckRows.length === 0" class="text-slate-500 text-sm py-4">No deck data yet. Start training to see stats here.</div>
        <div v-else class="rounded-lg border border-slate-700/60 overflow-x-auto">
          <table class="w-full min-w-[480px] text-sm">
            <thead>
              <tr class="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wide">
                <th class="text-left px-4 py-3">Deck</th>
                <th class="text-right px-4 py-3">Peak Acc</th>
                <th class="text-right px-4 py-3">Retention</th>
                <th class="text-right px-4 py-3">Overdue</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in deckRows"
                :key="row.deck"
                class="border-t border-slate-700/40 hover:bg-slate-800/30 transition-colors"
              >
                <td class="px-4 py-3 font-semibold text-slate-200">
                  <span class="mr-1">{{ row.icon }}</span>{{ row.name }}
                </td>
                <td class="px-4 py-3 text-right font-mono" :class="peakColor(row.peakAcc)">
                  {{ row.peakAcc !== null ? `${row.peakAcc}%` : '-' }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-slate-300">
                  {{ row.retention !== null ? `${row.retention}%` : '-' }}
                </td>
                <td class="px-4 py-3 text-right font-mono" :class="row.overdue > 0 ? 'text-rose-400 font-semibold' : 'text-slate-500'">
                  {{ row.overdue !== null ? row.overdue : '-' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100 text-xs transition-colors"
                    @click="$emit('dashboard', row.deck)"
                  >
                    Dashboard
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="hasTrainingLogPlus" class="mb-6">
        <div class="text-xs font-bold tracking-widest text-slate-400 mb-3">RECENT SESSIONS</div>
        <div v-if="recentSessions.length === 0" class="text-slate-500 text-sm py-4">No sessions recorded yet.</div>
        <div v-else class="space-y-2">
          <div
            v-for="(session, idx) in recentSessions"
            :key="idx"
            class="flex items-center justify-between rounded-lg bg-slate-800/50 border border-slate-700/60 px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <span
                class="text-xs font-semibold px-2 py-0.5 rounded"
                :class="session.mode === 'Drill' ? 'bg-violet-900/60 text-violet-300' : 'bg-sky-900/60 text-sky-300'"
              >
                {{ session.mode }}
              </span>
              <span class="font-medium text-slate-200">{{ session.deckName }}</span>
            </div>
            <div class="flex items-center gap-4 text-sm">
              <span class="font-mono" :class="accuracyColor(session.accuracy)">{{ session.accuracy }}%</span>
              <span class="text-slate-500 text-xs">{{ session.dateLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <PremiumFeatureCard
        v-if="!hasTrainingLogPlus"
        title="Training Log Plus is part of Pro"
        description="The free app keeps your local streak and basic totals, while Pro unlocks the richer review surfaces that help you study across days and decks."
        :items="[
          'Activity heatmap for consistency tracking',
          'Deck mastery rollups with retention and overdue counts',
          'Recent cross-deck session history in one place'
        ]"
        :action-label="premiumActionLabel"
        :disabled="entitlement.isLoading"
        :hint="premiumHint"
        @upgrade="handleUpgrade"
        @manage="handleUpgrade"
      />
    </div>
  </div>
</template>

<script>
import ActivityHeatmapChart from '../components/ActivityHeatmapChart.vue'
import PremiumFeatureCard from '../components/PremiumFeatureCard.vue'
import { getDailyStreak, getDeckSessionHistory, getDeckDrillRecords } from '../core/analytics.js'
import { signInWithGoogle } from '../core/firebase-auth'
import { getDeckDataSync } from '../core/deck-loader.js'
import { entitlementHasFeature, getPremiumSnapshot, getUpgradeLabel, startCheckoutFlow, subscribeToEntitlement } from '../core/premium'
import { getDeckPrognosis } from '../core/spaced-repetition.js'
import { readJson } from '../core/storage'
import { DECKS } from '../data/decks.js'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDateLabel(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
}

export default {
  name: 'TrainingLogPremium',
  components: { ActivityHeatmapChart, PremiumFeatureCard },
  emits: ['back', 'dashboard'],
  data() {
    return {
      summaryStats: { acc: '-', sessions: 0, attempts: 0, kp: 0 },
      dailyStreak: { current: 0, longest: 0 },
      deckRows: [],
      recentSessions: [],
      entitlement: getPremiumSnapshot(),
      unlistenPremium: null,
    }
  },
  computed: {
    hasTrainingLogPlus() {
      return entitlementHasFeature(this.entitlement, 'training-log-plus')
    },
    premiumActionLabel() {
      return getUpgradeLabel(this.entitlement)
    },
    premiumHint() {
      if (this.entitlement.isLoading) return 'Checking your subscription...'
      if (this.entitlement.signedIn) return 'Upgrade to unlock the full historical view across decks and days.'
      return 'Sign in with Google first, then checkout will start automatically.'
    },
  },
  methods: {
    async handleUpgrade() {
      try {
        await startCheckoutFlow({ signIn: signInWithGoogle })
      } catch (err) {
        console.error('Premium checkout failed', err)
      }
    },
    peakColor(pct) {
      if (pct === null) return 'text-slate-500'
      if (pct >= 80) return 'text-green-400'
      if (pct >= 60) return 'text-amber-400'
      return 'text-rose-400'
    },
    accuracyColor(pct) {
      if (pct >= 80) return 'text-green-400'
      if (pct >= 60) return 'text-amber-400'
      return 'text-rose-400'
    },
    loadSummaryStats() {
      const analytics = readJson('analytics_v1', {})
      let sessions = 0
      let attempts = 0
      let correct = 0
      for (const deck of Object.values(analytics)) {
        sessions += Number(deck?.totalSessions || 0)
        attempts += Number(deck?.totalAttempts || 0)
        correct += Number(deck?.totalCorrect || 0)
      }
      const acc = attempts > 0 ? `${Math.round((correct / attempts) * 100)}%` : '-'
      this.summaryStats = { acc, sessions, attempts, kp: correct }
    },
    loadDeckRows() {
      const peaks = readJson('masteryPeak_v1', {})
      const rows = []
      for (const deckEntry of DECKS) {
        const { deck, name, icon } = deckEntry
        const peakRaw = peaks[deck]
        const peakAcc = peakRaw != null ? Number(peakRaw) : null

        let retention = null
        let overdue = null
        try {
          const dataMap = getDeckDataSync(deck)
          const prognosis = getDeckPrognosis(deck, dataMap)
          retention = prognosis.retentionNowPct
          overdue = prognosis.overdueCount
        } catch (_) {
          retention = null
          overdue = null
        }

        rows.push({ deck, name, icon, peakAcc, retention, overdue })
      }
      this.deckRows = rows
    },
    loadRecentSessions() {
      const allSessions = []
      for (const deckEntry of DECKS) {
        const { deck, name } = deckEntry
        const sessionHistory = getDeckSessionHistory(deck)
        for (const session of sessionHistory) {
          allSessions.push({
            ts: session.ts,
            deckName: name,
            accuracy: Math.round(Number(session.accuracy || 0)),
            mode: 'Quiz',
            dateLabel: formatDateLabel(session.ts),
          })
        }
        const drillRecords = getDeckDrillRecords(deck)
        for (const drill of (drillRecords.history || [])) {
          allSessions.push({
            ts: drill.ts,
            deckName: name,
            accuracy: Math.round(Number(drill.accuracy || 0)),
            mode: 'Drill',
            dateLabel: formatDateLabel(drill.ts),
          })
        }
      }

      allSessions.sort((a, b) => b.ts - a.ts)
      this.recentSessions = allSessions.slice(0, 15)
    },
  },
  mounted() {
    this.dailyStreak = getDailyStreak()
    this.loadSummaryStats()
    this.loadDeckRows()
    this.loadRecentSessions()
    this.unlistenPremium = subscribeToEntitlement((snapshot) => {
      this.entitlement = snapshot
    })
  },
  beforeUnmount() {
    if (typeof this.unlistenPremium === 'function') this.unlistenPremium()
  },
}
</script>
