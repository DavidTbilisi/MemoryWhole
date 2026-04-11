<template>
  <section class="rounded-2xl border border-cyan-500/30 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_35%),linear-gradient(135deg,#081422,#0b1022_52%,#14061c)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="text-xs font-black uppercase tracking-[0.28em] text-cyan-300/90">Global Ladder</div>
        <h2 class="mt-1 text-2xl font-black text-slate-100">Leader Dashboard</h2>
        <p class="mt-1 max-w-2xl text-sm text-slate-400">Compare your position by global score, synthetic score, or per-deck mastery with all-time and last-7-days views.</p>
      </div>
      <button
        class="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
        @click="refreshLeaderboard"
      >
        {{ loading ? 'Refreshing...' : 'Refresh leaderboard' }}
      </button>
    </div>

    <div v-if="!signedIn" class="rounded-xl border border-amber-500/35 bg-amber-950/20 p-4 text-sm text-amber-100">
      Sign in with Google to publish your score and compare yourself against other users on the leaderboard.
    </div>

    <div v-else class="space-y-4">
      <div class="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="text-[11px] font-semibold uppercase tracking-widest text-slate-500">View</div>
            <div class="mt-1 text-sm text-slate-300">{{ filterSummary }}</div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in modeOptions"
              :key="option.value"
              class="rounded-full px-3 py-2 text-sm font-semibold transition"
              :class="leaderboardMode === option.value ? 'bg-cyan-400 text-slate-950' : 'border border-slate-700 bg-slate-950/80 text-slate-300 hover:border-slate-500'"
              @click="leaderboardMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button
            v-for="option in timeframeOptions"
            :key="option.value"
            class="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition"
            :class="timeframe === option.value ? 'bg-fuchsia-500 text-white' : 'border border-slate-700 bg-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200'"
            @click="timeframe = option.value"
          >
            {{ option.label }}
          </button>

          <div v-if="leaderboardMode === 'deck'" class="ml-auto flex min-w-[220px] items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-sm">
            <span class="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Deck</span>
            <select v-model="selectedDeck" class="min-w-0 flex-1 bg-transparent text-slate-100 outline-none">
              <option v-for="deck in deckOptions" :key="deck.deck" :value="deck.deck">{{ deck.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid gap-3 xl:grid-cols-[1.1fr_1fr]">
        <div class="grid gap-3 md:grid-cols-3">
        <div class="rounded-xl border border-cyan-500/30 bg-slate-900/45 p-4">
          <div class="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Your position</div>
          <div class="mt-2 text-3xl font-black text-cyan-300">#{{ userRankLabel }}</div>
          <div class="mt-1 text-sm text-slate-300">{{ maskedDisplayName(currentEntry?.displayName) || 'Waiting for snapshot...' }}</div>
        </div>
        <div class="rounded-xl border border-fuchsia-500/30 bg-slate-900/45 p-4">
          <div class="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{{ activeCardTitle }}</div>
          <div class="mt-2 flex items-end gap-2">
            <div class="text-3xl font-black text-fuchsia-300">{{ activeCardPrimary }}</div>
            <div class="pb-1 text-sm text-slate-400">{{ activeCardScore }}</div>
          </div>
          <div class="mt-1 text-sm text-slate-300">{{ activeCardSummary }}</div>
        </div>
        <div class="rounded-xl border border-emerald-500/30 bg-slate-900/45 p-4">
          <div class="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Window summary</div>
          <div class="mt-2 text-3xl font-black text-emerald-300">{{ leaders.length }}</div>
          <div class="mt-1 text-sm text-slate-300">ranked players in {{ timeframe === 'recent7d' ? 'the last 7 days' : 'the all-time ladder' }}</div>
        </div>
        </div>

        <div class="rounded-xl border border-slate-700/70 bg-slate-900/45 p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <div class="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Ladder Pulse</div>
              <div class="text-sm text-slate-300">Top scores for the active filter</div>
            </div>
            <div class="text-xs text-slate-500">{{ scoreColumnLabel }}</div>
          </div>

          <div v-if="chartBars.length" class="space-y-3">
            <div v-for="bar in chartBars" :key="bar.uid" class="space-y-1">
              <div class="flex items-center justify-between gap-3 text-xs">
                <div class="flex min-w-0 items-center gap-2">
                  <span class="w-7 font-black text-slate-400">#{{ bar.place }}</span>
                  <span class="truncate font-semibold" :class="bar.uid === currentUid ? 'text-cyan-300' : 'text-slate-200'">{{ maskedDisplayName(bar.displayName) }}</span>
                </div>
                <span class="font-bold text-slate-300">{{ entryScoreLabel(bar) }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-950">
                <div class="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500" :style="{ width: `${bar.width}%` }"></div>
              </div>
            </div>
          </div>

          <div v-else class="py-8 text-center text-sm text-slate-500">
            No chart data for the active filter yet.
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="rounded-xl border border-rose-500/35 bg-rose-950/20 p-4 text-sm text-rose-200">
        {{ errorMessage }}
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/60">
        <div class="grid grid-cols-[72px_minmax(0,1.4fr)_112px_minmax(0,1.5fr)_110px] gap-2 border-b border-slate-800/90 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          <div>Place</div>
          <div>Initials</div>
          <div>{{ scoreColumnLabel }}</div>
          <div>Details</div>
          <div>Updated</div>
        </div>
        <div v-if="leaders.length" class="divide-y divide-slate-800/80">
          <div
            v-for="(entry, index) in leaders"
            :key="entry.uid"
            class="grid grid-cols-[72px_minmax(0,1.4fr)_112px_minmax(0,1.5fr)_110px] gap-2 px-4 py-3 text-sm transition"
            :class="entry.uid === currentUid ? 'bg-cyan-500/10' : 'bg-transparent'"
          >
            <div class="font-black text-slate-100">#{{ index + 1 }}</div>
            <div class="min-w-0">
              <div class="truncate font-semibold text-slate-100">{{ maskedDisplayName(entry.displayName) }}</div>
              <div class="truncate text-xs text-slate-500">{{ entry.uid === currentUid ? 'You' : 'Player' }}</div>
            </div>
            <div>
              <div class="font-black text-cyan-300">{{ entryScoreLabel(entry) }}</div>
              <div class="text-xs text-slate-500">{{ entryRankLabel(entry) }}</div>
            </div>
            <div class="min-w-0 text-xs text-slate-400">{{ entryDetailText(entry) }}</div>
            <div class="text-xs text-slate-500">{{ formatUpdatedAt(entry.updatedAt) }}</div>
          </div>
        </div>
        <div v-else-if="!loading" class="px-4 py-8 text-center text-sm text-slate-500">
          No players match the current filter yet.
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { onAuthUserChanged } from '../core/firebase-auth'
import { fetchLeaderboardEntries, publishLeaderboardSnapshot } from '../core/firebase-leaderboard'
import { DECKS } from '../data/decks'

export default {
  name: 'LeaderboardPanel',
  data() {
    return {
      loading: false,
      signedIn: false,
      currentUid: '',
      entriesRaw: [],
      leaderboardMode: 'global',
      timeframe: 'all-time',
      selectedDeck: DECKS[0]?.deck || 'major',
      errorMessage: '',
      unlistenAuth: null,
    }
  },
  computed: {
    modeOptions() {
      return [
        { value: 'global', label: 'Global' },
        { value: 'synthetic', label: 'Synthetic' },
        { value: 'deck', label: 'Deck' },
      ]
    },
    timeframeOptions() {
      return [
        { value: 'all-time', label: 'All Time' },
        { value: 'recent7d', label: 'Last 7 Days' },
      ]
    },
    deckOptions() {
      return DECKS
    },
    selectedDeckName() {
      return this.deckOptions.find((deck) => deck.deck === this.selectedDeck)?.name || this.selectedDeck
    },
    filterSummary() {
      const ladderLabel = this.modeOptions.find((option) => option.value === this.leaderboardMode)?.label || 'Global'
      const timeframeLabel = this.timeframeOptions.find((option) => option.value === this.timeframe)?.label || 'All Time'
      if (this.leaderboardMode === 'deck') return `${this.selectedDeckName} mastery, ${timeframeLabel.toLowerCase()}`
      return `${ladderLabel} ladder, ${timeframeLabel.toLowerCase()}`
    },
    sortedLeaders() {
      return [...this.entriesRaw]
        .filter((entry) => this.includeEntry(entry))
        .sort((left, right) => {
          const scoreDelta = this.entryScore(right) - this.entryScore(left)
          if (scoreDelta !== 0) return scoreDelta

          const secondaryDelta = this.entrySecondaryScore(right) - this.entrySecondaryScore(left)
          if (secondaryDelta !== 0) return secondaryDelta

          return Number(right.updatedAt || 0) - Number(left.updatedAt || 0)
        })
    },
    leaders() {
      return this.sortedLeaders.slice(0, 20)
    },
    chartBars() {
      const top = this.sortedLeaders.slice(0, 5)
      const maxScore = Math.max(1, ...top.map((entry) => this.entryScore(entry)))
      return top.map((entry, index) => ({
        ...entry,
        place: index + 1,
        width: Math.max(8, Math.round((this.entryScore(entry) / maxScore) * 100)),
      }))
    },
    currentEntry() {
      return this.sortedLeaders.find((entry) => entry.uid === this.currentUid) || null
    },
    currentRank() {
      if (!this.currentEntry) return null
      return this.sortedLeaders.findIndex((entry) => entry.uid === this.currentUid) + 1
    },
    userRankLabel() {
      if (!this.signedIn) return '—'
      return this.currentRank || '—'
    },
    scoreColumnLabel() {
      if (this.leaderboardMode === 'deck') return this.timeframe === 'recent7d' ? '7d Peak' : 'Peak'
      return 'Score'
    },
    activeCardTitle() {
      if (this.leaderboardMode === 'global') return this.timeframe === 'recent7d' ? 'Recent global ladder' : 'Global ladder'
      if (this.leaderboardMode === 'synthetic') return this.timeframe === 'recent7d' ? 'Recent synthetic ladder' : 'Synthetic ladder'
      return `${this.selectedDeckName} mastery`
    },
    activeCardPrimary() {
      if (!this.currentEntry) return '—'
      if (this.leaderboardMode === 'global') return this.currentEntry.globalRank || 'F'
      if (this.leaderboardMode === 'synthetic') return this.currentEntry.syntheticRank || 'F'
      return this.selectedDeckName
    },
    activeCardScore() {
      if (!this.currentEntry) return '0 score'
      const score = this.entryScore(this.currentEntry)
      if (this.leaderboardMode === 'deck') return `${score}% peak`
      return `${score} score`
    },
    activeCardSummary() {
      if (!this.currentEntry) return 'No snapshot for the current filter yet.'
      return this.entryDetailText(this.currentEntry)
    },
  },
  mounted() {
    this.unlistenAuth = onAuthUserChanged((user) => {
      this.signedIn = !!user
      this.currentUid = user?.uid || ''
      if (user) this.refreshLeaderboard()
      else {
        this.entriesRaw = []
        this.errorMessage = ''
      }
    })
    window.addEventListener('mnemonic-stats-updated', this.refreshLeaderboard)
  },
  beforeUnmount() {
    if (typeof this.unlistenAuth === 'function') this.unlistenAuth()
    window.removeEventListener('mnemonic-stats-updated', this.refreshLeaderboard)
  },
  methods: {
    includeEntry(entry) {
      if (this.leaderboardMode === 'global') {
        return this.timeframe === 'recent7d'
          ? Number(entry.recent7dAttempts || 0) > 0
          : Number(entry.totalAttempts || 0) > 0
      }

      if (this.leaderboardMode === 'synthetic') {
        return this.timeframe === 'recent7d'
          ? Number(entry.recent7dSyntheticScore || 0) > 0 || Number(entry.recent7dAttempts || 0) > 0
          : Number(entry.syntheticScore || 0) > 0 || Number(entry.totalAttempts || 0) > 0
      }

      const deckStats = entry.deckStats?.[this.selectedDeck] || {}
      return this.timeframe === 'recent7d'
        ? Number(deckStats.recent7dPeak || 0) > 0 || Number(deckStats.recent7dAttempts || 0) > 0
        : Number(deckStats.peak || 0) > 0 || Number(deckStats.attempts || 0) > 0
    },
    entryScore(entry) {
      if (this.leaderboardMode === 'global') {
        return this.timeframe === 'recent7d'
          ? Number(entry.recent7dGlobalScore || 0)
          : Number(entry.globalScore || 0)
      }

      if (this.leaderboardMode === 'synthetic') {
        return this.timeframe === 'recent7d'
          ? Number(entry.recent7dSyntheticScore || 0)
          : Number(entry.syntheticScore || 0)
      }

      const deckStats = entry.deckStats?.[this.selectedDeck] || {}
      return this.timeframe === 'recent7d'
        ? Number(deckStats.recent7dPeak || 0)
        : Number(deckStats.peak || 0)
    },
    entrySecondaryScore(entry) {
      if (this.leaderboardMode === 'global') {
        return this.timeframe === 'recent7d'
          ? Number(entry.recent7dGlobalAccuracy || 0) * 1000 + Number(entry.recent7dAttempts || 0)
          : Number(entry.globalAccuracy || 0) * 1000 + Number(entry.totalAttempts || 0)
      }

      if (this.leaderboardMode === 'synthetic') {
        return this.timeframe === 'recent7d'
          ? Number(entry.recent7dAverageMastery || 0) * 1000 + Number(entry.recent7dAttempts || 0)
          : Number(entry.averageMastery || 0) * 1000 + Number(entry.totalAttempts || 0)
      }

      const deckStats = entry.deckStats?.[this.selectedDeck] || {}
      return this.timeframe === 'recent7d'
        ? Number(deckStats.recent7dAccuracy || 0) * 1000 + Number(deckStats.recent7dAttempts || 0)
        : Number(deckStats.accuracy || 0) * 1000 + Number(deckStats.attempts || 0)
    },
    entryRankLabel(entry) {
      if (this.leaderboardMode === 'global') return this.timeframe === 'recent7d' ? '7d global' : String(entry.globalRank || 'F')
      if (this.leaderboardMode === 'synthetic') return this.timeframe === 'recent7d' ? '7d synthetic' : String(entry.syntheticRank || 'F')
      return this.selectedDeckName
    },
    entryScoreLabel(entry) {
      const score = this.entryScore(entry)
      if (this.leaderboardMode === 'deck') return `${score}%`
      return String(score)
    },
    entryDetailText(entry) {
      if (this.leaderboardMode === 'global') {
        if (this.timeframe === 'recent7d') {
          return `${entry.recent7dGlobalAccuracy}% accuracy · ${entry.recent7dAttempts} attempts · ${entry.recent7dDeckCount}/${entry.totalDeckCount} decks active`
        }
        return `${entry.globalAccuracy}% accuracy · ${entry.totalAttempts} attempts · ${entry.deckCount}/${entry.totalDeckCount} decks`
      }

      if (this.leaderboardMode === 'synthetic') {
        if (this.timeframe === 'recent7d') {
          return `${entry.recent7dAverageMastery}% mastery · +${entry.recent7dDiversityBonus} diversity · ${entry.recent7dAttempts} attempts`
        }
        return `${entry.averageMastery}% mastery · +${entry.diversityBonus} diversity · ${entry.totalAttempts} attempts`
      }

      const deckStats = entry.deckStats?.[this.selectedDeck] || {}
      if (this.timeframe === 'recent7d') {
        return `${Number(deckStats.recent7dAccuracy || 0)}% accuracy · ${Number(deckStats.recent7dAttempts || 0)} attempts in 7d`
      }
      return `${Number(deckStats.accuracy || 0)}% accuracy · ${Number(deckStats.attempts || 0)} attempts total`
    },
    async refreshLeaderboard() {
      if (!this.signedIn) return
      this.loading = true
      this.errorMessage = ''
      try {
        await publishLeaderboardSnapshot()
        this.entriesRaw = await fetchLeaderboardEntries()
      } catch (err) {
        console.error(err)
        this.errorMessage = 'Could not load leaderboard yet. Check Firestore rules/deployment and try again.'
      } finally {
        this.loading = false
      }
    },
    formatUpdatedAt(value) {
      const ts = Number(value || 0)
      if (!ts) return 'just now'
      const diffMs = Date.now() - ts
      const diffMin = Math.round(diffMs / 60000)
      if (diffMin <= 1) return 'just now'
      if (diffMin < 60) return `${diffMin}m ago`
      const diffHours = Math.round(diffMin / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.round(diffHours / 24)
      return `${diffDays}d ago`
    },
    maskedDisplayName(value) {
      const source = String(value || '').trim()
      if (!source) return ''
      const parts = source.split(/\s+/).filter(Boolean)
      if (parts.length >= 2) {
        return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
      }
      const compact = source.replace(/[^a-zA-Z0-9]/g, '')
      return (compact.slice(0, 2) || source.slice(0, 2) || 'AN').toUpperCase()
    },
  },
}
</script>
