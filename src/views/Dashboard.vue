<template>
  <div class="rounded-2xl border border-slate-700/70 bg-gradient-to-b from-[#0b1b2b] to-[#071421] p-4 text-sky-100 md:p-5">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-bold">Dashboard — {{ deck || 'All' }}</h2>
      <button class="px-4 py-2 rounded-lg border border-cyan-400/70 bg-cyan-500/20 text-cyan-100 font-bold hover:bg-cyan-500/30" @click="$emit('back')" v-tooltip="'Return to home (B or H)'">⬅ Back</button>
    </div>

    <div class="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
      <div class="rounded-xl border border-cyan-500/30 bg-cyan-900/15 p-3">
        <div class="mb-2 text-xs uppercase tracking-wider text-cyan-200/80">Accuracy</div>
        <div class="flex items-center gap-3">
          <div class="relative h-14 w-14 rounded-full" :style="accuracyRingStyle">
            <div class="absolute inset-[5px] rounded-full bg-[#071421]"></div>
            <div class="absolute inset-0 grid place-items-center text-[11px] font-bold text-cyan-100">{{ accuracy }}%</div>
          </div>
          <div class="text-xs text-slate-300">{{ analytics.totalCorrect || 0 }} correct out of {{ analytics.totalAttempts || 0 }} attempts</div>
        </div>
      </div>

      <div class="rounded-xl border border-violet-500/30 bg-violet-900/15 p-3">
        <div class="mb-2 text-xs uppercase tracking-wider text-violet-200/80">Peak</div>
        <div class="flex items-center gap-3">
          <div class="relative h-14 w-14 rounded-full" :style="peakRingStyle">
            <div class="absolute inset-[5px] rounded-full bg-[#071421]"></div>
            <div class="absolute inset-0 grid place-items-center text-[11px] font-bold text-violet-100">{{ peak }}%</div>
          </div>
          <div class="text-xs text-slate-300">Best all-time deck mastery.</div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-600/60 bg-slate-900/35 p-3">
        <div class="mb-1 text-xs uppercase tracking-wider text-slate-300/80">Activity Volume</div>
        <div class="mb-2 flex items-center justify-between text-xs text-slate-400"><span>Sessions</span><strong class="text-slate-200">{{ analytics.totalSessions || 0 }}</strong></div>
        <div class="h-2 overflow-hidden rounded-full bg-slate-800"><div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" :style="{ width: sessionBarPct + '%' }"></div></div>
        <div class="mb-2 mt-2 flex items-center justify-between text-xs text-slate-400"><span>Attempts</span><strong class="text-slate-200">{{ analytics.totalAttempts || 0 }}</strong></div>
        <div class="h-2 overflow-hidden rounded-full bg-slate-800"><div class="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" :style="{ width: attemptsBarPct + '%' }"></div></div>
      </div>
    </div>

    <div v-if="hasAdvancedAnalytics" class="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-900/10 p-3">
      <div class="mb-2 flex items-center justify-between gap-2">
        <div>
          <div class="text-xs uppercase tracking-wider text-emerald-200/80">Learning Prognosis</div>
          <div class="text-sm text-slate-300">Decay-aware forecast for the next {{ prognosis.horizonDays }} days</div>
        </div>
        <div class="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-3 py-1 text-sm font-semibold text-emerald-100">
          Score {{ prognosis.score }}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 md:grid-cols-5">
        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-2 text-sm">Retention now <strong class="block text-cyan-200">{{ prognosis.retentionNowPct }}%</strong></div>
        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-2 text-sm">Projected retention <strong class="block text-violet-200">{{ prognosis.projectedRetentionPct }}%</strong></div>
        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-2 text-sm">Coverage <strong class="block text-emerald-200">{{ prognosis.coveragePct }}%</strong></div>
        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-2 text-sm">Due now <strong class="block text-amber-200">{{ prognosis.dueCount }}</strong></div>
        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-2 text-sm">Daily load <strong class="block text-sky-200">~{{ prognosis.dailyLoad }}/day</strong></div>
      </div>

      <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
        <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" :style="{ width: `${prognosis.score}%` }"></div>
      </div>
      <div class="mt-1 flex items-center justify-between text-[11px] text-slate-400">
        <span>Overdue: {{ prognosis.overdueCount }}</span>
        <span>At-risk items: {{ prognosis.riskCount }}</span>
        <span>Due in {{ prognosis.horizonDays }}d: {{ prognosis.dueSoonCount }}</span>
      </div>
    </div>

    <div v-if="hasAdvancedAnalytics" class="mb-3">
      <DeckAnalyticsChart :deck="deck || 'major'" :totals="analytics" />
    </div>

    <div v-if="hasAdvancedAnalytics" class="mb-3">
      <DeckHeatmapCartesian :deck="deck || 'major'" />
    </div>

    <div v-if="hasAdvancedAnalytics" class="rounded-xl border border-slate-700/70 bg-slate-900/40 p-3">
      <div class="font-semibold mb-2">Weakest Areas</div>
      <div v-if="weakItems.length === 0" class="text-sm text-slate-400">No stats yet.</div>
      <div v-else class="space-y-2 text-sm">
        <div v-for="row in weakItems" :key="row.key" class="rounded-lg border border-slate-700/60 bg-slate-900/35 p-2">
          <div class="mb-1 flex items-start justify-between gap-3">
            <div class="min-w-0 flex items-center gap-2">
              <span class="font-medium shrink-0">#{{ row.key }}</span>
              <span class="text-xs text-slate-400 truncate">{{ row.label }}</span>
            </div>
            <span class="shrink-0 text-xs text-slate-300">{{ row.acc }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-800">
            <div class="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400" :style="{ width: `${weakBarPct(row)}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="hasAdvancedAnalytics" class="mt-3 rounded-xl border border-slate-700/70 bg-slate-900/40 p-3">
      <div class="mb-2 flex items-center justify-between">
        <div class="font-semibold">Speed Drill</div>
        <div class="text-[11px] text-slate-500">deck: {{ activeDeckKey }} · drills: {{ drill.totalDrills || 0 }}<span v-if="lastDrillDate"> · last: {{ lastDrillDate }}</span></div>
      </div>
      <div v-if="drill.totalDrills === 0" class="text-sm text-slate-400">No speed drills yet for this deck.</div>
      <template v-else>
        <div class="grid grid-cols-2 gap-2 md:grid-cols-4 mb-3">
          <div class="bg-slate-900/60 rounded p-2 text-sm">Best Score: <strong>{{ drill.bestScore }}</strong></div>
          <div class="bg-slate-900/60 rounded p-2 text-sm">Best Accuracy: <strong>{{ drill.bestAccuracy }}%</strong></div>
          <div class="bg-slate-900/60 rounded p-2 text-sm">Best Streak: <strong>{{ drill.bestStreak }}</strong></div>
          <div class="bg-slate-900/60 rounded p-2 text-sm">Best Speed: <strong>{{ bestSpeedLabel }}</strong></div>
        </div>
        <div class="mb-3 rounded bg-slate-900/40 p-2">
          <div class="mb-1 flex items-center justify-between text-xs text-slate-400">
            <span>Score trend (last 10 drills)</span>
            <span>{{ trendLabel }}</span>
          </div>
          <svg viewBox="0 0 100 26" preserveAspectRatio="none" class="h-14 w-full">
            <polyline
              fill="none"
              stroke="#22d3ee"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              :points="sparklinePoints"
            />
          </svg>
        </div>
        <div class="text-xs text-slate-400 mb-2">Recent drills (latest 5)</div>
        <div class="space-y-1 text-sm">
          <div v-for="row in recentDrills" :key="row.ts" class="flex items-center justify-between rounded bg-slate-900/40 px-2 py-1">
            <span>{{ row.date }}</span>
            <span class="text-amber-300">{{ row.score }} pts</span>
            <span>{{ row.accuracy }}%</span>
            <span>⏱ {{ row.avgResponse }}</span>
          </div>
        </div>
      </template>
    </div>

    <PremiumFeatureCard
      v-if="!hasAdvancedAnalytics"
      class="mt-3"
      title="Advanced dashboard analytics are part of Pro"
      description="Keep training for free, then unlock the deeper analysis layers that turn your raw attempts into a study plan."
      :items="[
        'Learning prognosis and due-load forecasts',
        'Weak-item analysis across the active deck',
        'Expanded charts, activity heatmaps, and drill history'
      ]"
      :action-label="premiumActionLabel"
      :disabled="entitlement.isLoading"
      :hint="premiumHint"
      @upgrade="handleUpgrade"
      @manage="handleUpgrade"
    />
  </div>
</template>

<script>
import { getAllDeckAnalytics, getDeckAnalytics, getDeckDrillRecords, getDeckPeak, getDeckWeakItems } from '../core/analytics'
import { getDeckDataSync } from '../core/deck-loader'
import { signInWithGoogle } from '../core/firebase-auth'
import PremiumFeatureCard from '../components/PremiumFeatureCard.vue'
import { getDeckPrognosis } from '../core/spaced-repetition'
import DeckAnalyticsChart from '../components/DeckAnalyticsChart.vue'
import DeckHeatmapCartesian from '../components/DeckHeatmapCartesian.vue'
import { entitlementHasFeature, getPremiumSnapshot, getUpgradeLabel, startCheckoutFlow, subscribeToEntitlement } from '../core/premium'

export default {
  name: 'DashboardView',
  components: { DeckAnalyticsChart, DeckHeatmapCartesian, PremiumFeatureCard },
  props: { deck: { type: String, default: '' } },
  data() {
    return {
      refreshTick: 0,
      entitlement: getPremiumSnapshot(),
      unlistenPremium: null,
    }
  },
  methods: {
    async handleUpgrade() {
      try {
        await startCheckoutFlow({ signIn: signInWithGoogle })
      } catch (err) {
        console.error('Premium checkout failed', err)
      }
    },
    refreshFromStorage() {
      this.refreshTick += 1
    },
    weakBarPct(row) {
      const items = this.weakItems || []
      if (!items.length) return 0
      const min = Math.min(...items.map((r) => Number(r.acc || 0)))
      const max = Math.max(...items.map((r) => Number(r.acc || 0)))
      if (max === min) return 55
      const n = (max - Number(row.acc || 0)) / (max - min)
      return Math.round(10 + (n * 90))
    }
  },
  mounted() {
    window.addEventListener('mnemonic-stats-updated', this.refreshFromStorage)
    window.addEventListener('storage', this.refreshFromStorage)
    this.unlistenPremium = subscribeToEntitlement((snapshot) => {
      this.entitlement = snapshot
    })
  },
  beforeUnmount() {
    window.removeEventListener('mnemonic-stats-updated', this.refreshFromStorage)
    window.removeEventListener('storage', this.refreshFromStorage)
    if (typeof this.unlistenPremium === 'function') this.unlistenPremium()
  },
  computed: {
    hasAdvancedAnalytics() {
      return entitlementHasFeature(this.entitlement, 'advanced-analytics')
    },
    premiumActionLabel() {
      return getUpgradeLabel(this.entitlement)
    },
    premiumHint() {
      if (this.entitlement.isLoading) return 'Checking your subscription...'
      if (this.entitlement.signedIn) return 'Upgrade once to unlock prognosis, weak-item analysis, and expanded drill insights.'
      return 'Sign in with Google first, then checkout will start automatically.'
    },
    analytics(){ this.refreshTick; return getDeckAnalytics(this.deck || 'major') },
    peak(){ this.refreshTick; return getDeckPeak(this.deck || 'major') },
    accuracy(){
      const totalAttempts = Number(this.analytics.totalAttempts || 0)
      const totalCorrect = Number(this.analytics.totalCorrect || 0)
      return totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0
    },
    allDeckAnalytics() {
      this.refreshTick
      return getAllDeckAnalytics()
    },
    maxSessionsAcrossDecks() {
      const vals = Object.values(this.allDeckAnalytics || {}).map((v) => Number(v?.totalSessions || 0))
      return Math.max(1, ...vals)
    },
    maxAttemptsAcrossDecks() {
      const vals = Object.values(this.allDeckAnalytics || {}).map((v) => Number(v?.totalAttempts || 0))
      return Math.max(1, ...vals)
    },
    accuracyRingStyle() {
      return {
        background: `conic-gradient(#22d3ee ${this.accuracy * 3.6}deg, rgba(15,23,42,0.95) 0deg)`
      }
    },
    peakRingStyle() {
      return {
        background: `conic-gradient(#a78bfa ${Number(this.peak || 0) * 3.6}deg, rgba(15,23,42,0.95) 0deg)`
      }
    },
    sessionBarPct() {
      const sessions = Number(this.analytics.totalSessions || 0)
      return Math.max(6, Math.min(100, Math.round((sessions / this.maxSessionsAcrossDecks) * 100)))
    },
    attemptsBarPct() {
      const attempts = Number(this.analytics.totalAttempts || 0)
      return Math.max(6, Math.min(100, Math.round((attempts / this.maxAttemptsAcrossDecks) * 100)))
    },
    weakItems(){
      this.refreshTick
      const activeDeck = this.deck || 'major'
      const rows = getDeckWeakItems(activeDeck, 10)
      const map = getDeckDataSync(activeDeck)
      return rows.map((row) => {
        const key = String(row.key)
        const label = map[key] || map[key.padStart(2, '0')] || '—'
        return { ...row, label }
      })
    },
    drill() {
      this.refreshTick
      return getDeckDrillRecords(this.deck || 'major')
    },
    activeDeckKey() {
      return this.deck || 'major'
    },
    lastDrillDate() {
      const ts = Number(this.drill?.history?.[0]?.ts || 0)
      if (!ts) return ''
      return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    bestSpeedLabel() {
      const ms = Number(this.drill.bestAvgResponseMs || 0)
      if (!ms) return '—'
      return `${(ms / 1000).toFixed(2)}s`
    },
    recentDrills() {
      return (this.drill.history || []).slice(0, 5).map((entry) => ({
        ts: entry.ts,
        date: new Date(entry.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: Number(entry.score || 0),
        accuracy: Number(entry.accuracy || 0).toFixed(1),
        avgResponse: entry.avgResponseMs ? `${(Number(entry.avgResponseMs) / 1000).toFixed(2)}s` : '—',
      }))
    },
    sparklinePoints() {
      const history = (this.drill.history || []).slice(0, 10).reverse()
      if (history.length <= 1) return '0,22 100,22'
      const scores = history.map((h) => Number(h.score || 0))
      const min = Math.min(...scores)
      const max = Math.max(...scores)
      const span = Math.max(1, max - min)
      return scores
        .map((score, i) => {
          const x = (i / (scores.length - 1)) * 100
          const y = 22 - (((score - min) / span) * 18)
          return `${x.toFixed(2)},${y.toFixed(2)}`
        })
        .join(' ')
    },
    trendLabel() {
      const history = (this.drill.history || []).slice(0, 10)
      if (history.length < 2) return 'Not enough data'
      const latest = Number(history[0].score || 0)
      const oldest = Number(history[history.length - 1].score || 0)
      const delta = latest - oldest
      if (delta === 0) return 'Flat'
      return delta > 0 ? `Up ${delta}` : `Down ${Math.abs(delta)}`
    },
    prognosis() {
      this.refreshTick
      const activeDeck = this.deck || 'major'
      const dataMap = getDeckDataSync(activeDeck)
      return getDeckPrognosis(activeDeck, dataMap, { horizonDays: 7 })
    }
  }
}
</script>
