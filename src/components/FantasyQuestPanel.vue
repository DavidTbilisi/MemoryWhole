<template>
  <div class="rounded-xl border border-fuchsia-500/30 bg-gradient-to-br from-slate-900 via-[#140a24] to-slate-950 p-2 sm:p-3">
    <div class="rounded-lg border border-amber-500/35 bg-amber-950/15 p-0">
      <details class="group/duel rounded-lg">
        <summary class="flex min-h-[40px] cursor-pointer list-none items-center justify-between gap-2 px-2 py-2 hover:bg-amber-950/25 [&::-webkit-details-marker]:hidden sm:min-h-[44px] sm:px-3">
          <div class="min-w-0">
            <div class="text-[10px] font-bold uppercase tracking-widest text-amber-300">Daily duel</div>
            <div class="text-[10px] text-slate-500">vs yesterday</div>
          </div>
          <div class="flex shrink-0 items-center gap-2 tabular-nums">
            <div class="text-right">
              <div class="text-base font-black leading-none text-amber-200 sm:text-lg">{{ todayScore }} / {{ dailyTarget }}</div>
            </div>
            <span class="text-[10px] text-slate-500" aria-hidden="true"><span class="group-open/duel:hidden">Show</span><span class="hidden group-open/duel:inline">Hide</span></span>
          </div>
        </summary>
        <div class="space-y-2 border-t border-amber-500/20 px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
          <div class="h-1.5 overflow-hidden rounded-full bg-slate-800 sm:h-2">
            <div class="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500" :style="{ width: `${questProgressPct}%` }"></div>
          </div>

          <button
            type="button"
            class="flex min-h-[40px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 px-3 text-sm font-bold text-white hover:brightness-110 sm:min-h-[44px]"
            @click="$emit('start', questDeck)"
            v-tooltip="'Start daily duel quest'"
          >
            Start daily duel
          </button>

          <details class="group/stats rounded-lg border border-slate-700/40 bg-slate-950/20">
            <summary class="flex min-h-[40px] cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/25 [&::-webkit-details-marker]:hidden sm:px-3 sm:py-2">
              <span>Stats and shortcuts</span>
              <span class="text-slate-500" aria-hidden="true"><span class="group-open/stats:hidden">Show</span><span class="hidden group-open/stats:inline">Hide</span></span>
            </summary>
            <div class="space-y-2 border-t border-slate-700/40 p-2 sm:space-y-3 sm:p-3">
              <div class="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-3 sm:gap-2">
                <div class="rounded border border-slate-700/70 bg-slate-900/45 p-1.5 text-slate-300 sm:p-2">Yesterday <strong class="mt-0.5 block text-slate-100">{{ yesterdayScore }}</strong></div>
                <div class="rounded border border-slate-700/70 bg-slate-900/45 p-1.5 text-slate-300 sm:p-2">To go <strong class="mt-0.5 block" :class="questRemaining > 0 ? 'text-amber-200' : 'text-emerald-300'">{{ Math.max(0, questRemaining) }}</strong></div>
                <div class="rounded border border-slate-700/70 bg-slate-900/45 p-1.5 text-slate-300 sm:p-2">Focus <strong class="mt-0.5 block truncate text-cyan-200">{{ questDeckName }}</strong></div>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="min-h-[40px] flex-1 rounded-lg bg-gradient-to-r from-fuchsia-600 to-cyan-500 px-3 py-2 text-xs font-bold text-white sm:flex-none"
                  @click="startSprintQuest"
                  v-tooltip="'Quick win: focus deck in recovery mode'"
                >
                  {{ sprintLabelShort }}
                </button>
                <button
                  type="button"
                  class="min-h-[40px] rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-200"
                  @click="$emit('dashboard', questDeck)"
                  v-tooltip="'Open dashboard for focus deck'"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </details>
        </div>
      </details>
    </div>

    <details class="group/tracks mt-2 rounded-lg border border-fuchsia-500/25 bg-slate-950/20 sm:mt-2.5">
      <summary class="flex min-h-[40px] cursor-pointer list-none items-center justify-between gap-2 px-2 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800/25 sm:min-h-[44px] sm:px-3 [&::-webkit-details-marker]:hidden">
        <span class="min-w-0 truncate"><span class="text-fuchsia-300/90">Tracks</span> · {{ awakenedTracks }}/{{ tracks.length }} hot</span>
        <span class="shrink-0 text-xs font-normal text-slate-500" aria-hidden="true"><span class="group-open/tracks:hidden">Show</span><span class="hidden group-open/tracks:inline">Hide</span></span>
      </summary>
      <div class="border-t border-fuchsia-500/15 p-2 sm:p-3">
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="track in featuredTracks"
            :key="track.deck"
            type="button"
            class="min-h-[44px] rounded-xl border p-3 text-left transition hover:brightness-110"
            :class="trackClass(track)"
            @click="$emit('start', track.deck)"
            v-tooltip="`Start ${track.name}`"
          >
            <div class="mb-1 flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="truncate text-sm font-bold text-slate-100">{{ track.name }}</div>
                <div class="text-[10px] text-slate-400">{{ track.tier.icon }} {{ track.tier.label }}</div>
              </div>
              <div class="shrink-0 text-xs font-bold text-cyan-200">{{ track.peak }}%</div>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500" :style="{ width: `${track.peak}%` }"></div>
            </div>
            <div class="mt-1 text-[10px] text-slate-500">{{ track.attempts }} tries</div>
          </button>
        </div>
      </div>
    </details>
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
    sprintLabelShort() {
      if (this.questRemaining <= 0) return `Recovery +${this.sprintGainTarget}`
      if (this.questRemaining <= 5) return `Finish +${this.sprintGainTarget}`
      return `Quick +${this.sprintGainTarget}`
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
