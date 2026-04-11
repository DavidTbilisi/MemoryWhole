<template>
  <div class="pb-20 md:pb-0">
    <div class="mb-4">
      <RankDisplay @view-ranking-info="onViewRankingInfo" @start-recommended="onStart" @dashboard-recommended="onDashboard" />
    </div>

    <div class="px-4 py-3 mb-2 border-t border-slate-700/40">
      <span v-if="dailyStreak.current > 0" class="text-amber-400 font-semibold">
        🔥 {{ dailyStreak.current }}-day streak
      </span>
      <span v-else class="text-slate-500 text-sm">
        — Start your streak today
      </span>
    </div>

    <div class="mb-4">
      <PriorityCoach
        v-if="hasCoachAccess"
        @start-recommended="onStart"
        @dashboard-recommended="onDashboard"
      />
      <PremiumFeatureCard
        v-else
        title="Priority Coach is part of Pro"
        description="Unlock personalized deck priorities, recovery prompts, and rank-focused coaching powered by your full training history."
        :items="[
          'Auto-ranked weak spots across decks',
          'Recovery-focused shortcuts into the right drill',
          'Guidance that adapts as your stats change'
        ]"
        :action-label="premiumActionLabel"
        :disabled="entitlement.isLoading"
        :hint="premiumHint"
        @upgrade="handleUpgrade"
        @manage="handleUpgrade"
      />
    </div>

    <div class="mb-4">
      <FantasyQuestPanel v-if="hasCoachAccess" @start="onStart" @dashboard="onDashboard" />
      <PremiumFeatureCard
        v-else
        title="Realm tracks and daily quests are Pro-only"
        description="Pro adds richer progression overlays so your home screen becomes a live training dashboard instead of a static launch pad."
        :items="[
          'Featured realm tracks with mastery tiers',
          'Daily duel progress and comeback targets',
          'One-tap shortcuts into the best next session'
        ]"
        :action-label="premiumActionLabel"
        :disabled="entitlement.isLoading"
        :hint="premiumHint"
        @upgrade="handleUpgrade"
        @manage="handleUpgrade"
      />
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <DeckCard v-for="(d, index) in decks" :key="d.deck" :deck="d.deck" :name="d.name" :count-text="d.count" :icon="d.icon" :focused="index === cursorIndex"
        @start="onStart" @dashboard="onDashboard" @instant-start="onInstantStart" />
    </div>
  </div>
</template>

<script>
import DeckCard from '../components/DeckCard.vue'
import PremiumFeatureCard from '../components/PremiumFeatureCard.vue'
import RankDisplay from '../components/RankDisplay.vue'
import PriorityCoach from '../components/PriorityCoach.vue'
import FantasyQuestPanel from '../components/FantasyQuestPanel.vue'
import { signInWithGoogle } from '../core/firebase-auth'
import { DECKS } from '../data/decks'
import { getDailyStreak } from '../core/analytics.js'
import { getPremiumSnapshot, getUpgradeLabel, startCheckoutFlow, subscribeToEntitlement, entitlementHasFeature } from '../core/premium'
export default {
  name: 'HomeView',
  components: { DeckCard, PremiumFeatureCard, RankDisplay, PriorityCoach, FantasyQuestPanel },
  data(){
    return {
      decks: DECKS,
      cursorIndex: 0,
      dailyStreak: { current: 0, longest: 0 },
      entitlement: getPremiumSnapshot(),
      unlistenPremium: null,
    }
  },
  computed: {
    hasCoachAccess() {
      return entitlementHasFeature(this.entitlement, 'coach')
    },
    premiumActionLabel() {
      return getUpgradeLabel(this.entitlement)
    },
    premiumHint() {
      if (this.entitlement.isLoading) return 'Checking your subscription...'
      if (this.entitlement.signedIn) return 'Upgrade once and these home-screen guidance tools unlock everywhere you sign in.'
      return 'Sign in with Google first, then checkout will start automatically.'
    },
  },
  mounted() {
    this.dailyStreak = getDailyStreak()
    this.unlistenPremium = subscribeToEntitlement((snapshot) => {
      this.entitlement = snapshot
    })
  },
  beforeUnmount() {
    if (typeof this.unlistenPremium === 'function') this.unlistenPremium()
  },
  methods:{
    async handleUpgrade() {
      try {
        await startCheckoutFlow({ signIn: signInWithGoogle })
      } catch (err) {
        console.error('Premium checkout failed', err)
      }
    },
    moveCursor(delta = 0) {
      const total = this.decks.length
      if (!total) return
      this.cursorIndex = (this.cursorIndex + Number(delta || 0) + total) % total
    },
    moveCursorToStart() {
      this.cursorIndex = 0
    },
    moveCursorToEnd() {
      this.cursorIndex = Math.max(0, this.decks.length - 1)
    },
    focusedDeck() {
      return this.decks[this.cursorIndex]?.deck || this.decks[0]?.deck || 'major'
    },
    openFocusedQuizConfig() {
      this.$emit('start', this.focusedDeck())
    },
    openFocusedDashboard() {
      this.$emit('dashboard', this.focusedDeck())
    },
    openFocusedPreview() {
      this.$emit('preview', this.focusedDeck())
    },
    openFocusedEditor() {
      this.$emit('edit', this.focusedDeck())
    },
    exportFocusedDeck() {
      this.$emit('export', this.focusedDeck())
    },
    onStart(deck){ this.$emit('start', deck); },
    onInstantStart(deck){ this.$emit('instant-start', deck); },
    onDashboard(deck){ this.$emit('dashboard', deck); },
    onPreview(deck){ this.$emit('preview', deck); },
    onEdit(deck){ this.$emit('edit', deck); },
    onExport(deck){ this.$emit('export', deck); },
    onViewRankingInfo(){ this.$emit('view-ranking-info'); }
  }
}
</script>
