<template>
  <div class="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-slate-900 via-[#140a24] to-slate-950 p-5">
    <div class="mb-3 flex items-center justify-between gap-3">
      <div>
        <div class="text-xs font-bold uppercase tracking-widest text-fuchsia-300">Chronicle of Realms</div>
        <h3 class="text-lg font-black text-slate-100">Collectible Realm Tracks</h3>
      </div>
      <div class="text-right">
        <div class="text-sm font-bold text-emerald-300">{{ awakenedTracks }} awakened</div>
        <div class="text-[11px] text-slate-500">of {{ tracks.length }} realms</div>
      </div>
    </div>

    <div class="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
      <button
        v-for="track in featuredTracks"
        :key="track.deck"
        class="rounded-xl border p-3 text-left transition hover:brightness-110"
        :class="trackClass(track)"
        @click="$emit('start', track.deck)"
        v-tooltip="`Enter ${track.name} realm`"
      >
        <div class="mb-1 flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="truncate text-sm font-bold text-slate-100">{{ track.name }}</div>
            <div class="text-[11px] text-slate-400">{{ track.tier.icon }} {{ track.tier.label }}</div>
          </div>
          <div class="shrink-0 text-xs font-bold text-cyan-200">{{ track.peak }}%</div>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-slate-800">
          <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500" :style="{ width: `${track.peak}%` }"></div>
        </div>
        <div class="mt-1 text-[11px] text-slate-500">{{ track.attempts }} attempts · {{ track.totalSessions }} sessions</div>
      </button>
    </div>

    <div class="rounded-xl border border-amber-500/35 bg-amber-950/15 p-4">
      <div class="mb-2 flex items-center justify-between gap-2">
        <div>
          <div class="text-xs font-bold uppercase tracking-widest text-amber-300">Daily Duel Quest</div>
          <div class="text-sm text-slate-200">Beat your yesterday self</div>
        </div>
        <div class="text-right">
          <div class="text-base font-black text-amber-200">{{ todayScore }} / {{ dailyTarget }}</div>
          <div class="text-[11px] text-slate-500">battle score</div>
        </div>
      </div>

      <div class="h-2 overflow-hidden rounded-full bg-slate-800">
        <div class="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500" :style="{ width: `${questProgressPct}%` }"></div>
      </div>

      <div class="mt-2 grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
        <div class="rounded border border-slate-700/70 bg-slate-900/45 p-2 text-slate-300">Yesterday <strong class="block text-slate-100">{{ yesterdayScore }}</strong></div>
        <div class="rounded border border-slate-700/70 bg-slate-900/45 p-2 text-slate-300">Needed now <strong class="block" :class="questRemaining > 0 ? 'text-amber-200' : 'text-emerald-300'">{{ Math.max(0, questRemaining) }}</strong></div>
        <div class="rounded border border-slate-700/70 bg-slate-900/45 p-2 text-slate-300">Realm focus <strong class="block text-cyan-200">{{ questDeckName }}</strong></div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button
          class="rounded-lg bg-gradient-to-r from-fuchsia-600 to-cyan-500 px-3 py-2 text-xs font-black text-white"
          @click="startSprintQuest"
          v-tooltip="'Quick win route: opens focus realm in recovery mode'"
        >
          {{ sprintLabel }}
        </button>
        <button
          class="rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 px-3 py-2 text-xs font-bold text-white"
          @click="$emit('start', questDeck)"
          v-tooltip="'Start daily duel quest'"
        >
          Start Daily Duel
        </button>
        <button
          class="rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-200"
          @click="$emit('dashboard', questDeck)"
          v-tooltip="'Inspect this realm in dashboard'"
        >
          Inspect Realm
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getAllDeckAnalytics, getDeckPeak, getDeckSessionHistory } from '../core/analytics'
import { DECKS } from '../data/decks'

function dateKeyLocal(ts) {
  const d = new Date(Number(ts || Date.now()))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function tierForPeak(peak) {
  const p = Number(peak || 0)
  if (p >= 93) return { label: 'S-Rank Dragonlord', icon: '🐉', tone: 's' }
  if (p >= 85) return { label: 'A-Rank Archon', icon: '🪽', tone: 'a' }
  if (p >= 75) return { label: 'B-Rank Spellblade', icon: '⚔️', tone: 'b' }
  if (p >= 60) return { label: 'C-Rank Warden', icon: '🛡️', tone: 'c' }
  if (p >= 40) return { label: 'D-Rank Vanguard', icon: '🗡️', tone: 'd' }
  if (p >= 20) return { label: 'E-Rank Scout', icon: '🏹', tone: 'e' }
  return { label: 'F-Rank Initiate', icon: '🕯️', tone: 'f' }
}

export default {
  name: 'FantasyQuestPanel',
  emits: ['start', 'dashboard'],
  data() {
    return {
      refreshTick: 0,
    }
  },
  computed: {
    analytics() {
      this.refreshTick
      return getAllDeckAnalytics()
    },
    tracks() {
      return DECKS.map((deckMeta) => {
        const stats = this.analytics[deckMeta.deck] || {}
        const attempts = Number(stats.totalAttempts || 0)
        const totalSessions = Number(stats.totalSessions || 0)
        const peak = Number(getDeckPeak(deckMeta.deck) || 0)
        return {
          deck: deckMeta.deck,
          name: deckMeta.name,
          icon: deckMeta.icon,
          attempts,
          totalSessions,
          peak,
          tier: tierForPeak(peak),
        }
      }).sort((a, b) => b.peak - a.peak || b.attempts - a.attempts)
    },
    featuredTracks() {
      return this.tracks.slice(0, 6)
    },
    awakenedTracks() {
      return this.tracks.filter((t) => t.peak >= 85).length
    },
    todayKey() {
      return dateKeyLocal(Date.now())
    },
    yesterdayKey() {
      return dateKeyLocal(Date.now() - (24 * 60 * 60 * 1000))
    },
    todayScore() {
      return this.sumBattleScore(this.todayKey)
    },
    yesterdayScore() {
      return this.sumBattleScore(this.yesterdayKey)
    },
    dailyTarget() {
      if (this.yesterdayScore <= 0) return 24
      return Math.max(this.yesterdayScore + 5, Math.round(this.yesterdayScore * 1.12))
    },
    questRemaining() {
      return this.dailyTarget - this.todayScore
    },
    questProgressPct() {
      if (this.dailyTarget <= 0) return 0
      return Math.max(0, Math.min(100, Math.round((this.todayScore / this.dailyTarget) * 100)))
    },
    questDeck() {
      const candidate = [...this.tracks]
        .filter((t) => t.attempts > 0)
        .sort((a, b) => a.peak - b.peak || a.attempts - b.attempts)[0]
      return candidate?.deck || this.tracks[0]?.deck || 'major'
    },
    questDeckName() {
      return DECKS.find((d) => d.deck === this.questDeck)?.name || this.questDeck
    },
    sprintGainTarget() {
      if (this.questRemaining <= 0) return 5
      return Math.max(1, Math.min(5, this.questRemaining))
    },
    sprintLabel() {
      if (this.questRemaining <= 0) return `Farm +${this.sprintGainTarget} bonus now (2 min)`
      if (this.questRemaining <= 5) return `Finish quest now (+${this.sprintGainTarget})`
      return `Get +${this.sprintGainTarget} now (2 min)`
    },
  },
  mounted() {
    window.addEventListener('mnemonic-stats-updated', this.refreshFromStorage)
    window.addEventListener('storage', this.refreshFromStorage)
  },
  beforeUnmount() {
    window.removeEventListener('mnemonic-stats-updated', this.refreshFromStorage)
    window.removeEventListener('storage', this.refreshFromStorage)
  },
  methods: {
    startSprintQuest() {
      this.$emit('start', { deck: this.questDeck, mode: 'recovery' })
    },
    refreshFromStorage() {
      this.refreshTick += 1
    },
    sumBattleScore(dayKey) {
      let score = 0
      for (const deck of DECKS) {
        const history = getDeckSessionHistory(deck.deck)
        for (const entry of history) {
          if (dateKeyLocal(entry.ts) !== dayKey) continue
          const correct = Number(entry.correct || 0)
          const wrong = Number(entry.wrong || 0)
          score += (correct * 2) - wrong
        }
      }
      return Math.max(0, Math.round(score))
    },
    trackClass(track) {
      const tone = track.tier.tone
      if (tone === 's') return 'border-rose-500/40 bg-rose-950/20'
      if (tone === 'a') return 'border-amber-500/40 bg-amber-950/20'
      if (tone === 'b') return 'border-violet-500/40 bg-violet-950/20'
      if (tone === 'c') return 'border-cyan-500/40 bg-cyan-950/20'
      if (tone === 'd') return 'border-emerald-500/35 bg-emerald-950/15'
      return 'border-slate-700/70 bg-slate-900/40'
    },
  },
}
</script>
