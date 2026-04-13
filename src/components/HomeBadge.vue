<template>
  <div :class="compact ? 'flex items-center gap-2 bg-transparent p-0' : 'flex items-center gap-3 bg-[#082032] p-2 rounded-lg'">
    <div :class="compact ? 'w-16 h-16' : 'w-24 h-24'" class="relative rounded-full p-[3px]" :style="ringStyle">
      <div class="absolute inset-[3px] rounded-full bg-[#071421] border border-slate-800/80"></div>
      <div class="absolute inset-0 rounded-full opacity-60 blur-[2px]" :style="glowStyle"></div>
      <div class="relative z-10 flex h-full w-full items-center justify-center rounded-full">
        <span :class="compact ? 'text-xl' : 'text-2xl'" class="font-black tracking-tight" :style="textStyle">{{ pct }}%</span>
      </div>
    </div>
    <template v-if="!compact">
      <div class="ml-2">
        <div class="font-semibold text-sm">{{ deckLabel }}</div>
        <div class="text-xs text-slate-400 mt-1">{{ itemsText }}</div>
      </div>
    </template>
  </div>
</template>

<script>
import { getDeckPeak } from '../core/analytics'

export default {
  name: 'HomeBadge',
  props: {
    deck: { type: String, required: true },
    compact: { type: Boolean, default: false }
  },
  data() {
    return {
      displayValue: 0,
    }
  },
  computed: {
    display() {
      return this.displayValue
    },
    pct() {
      return Math.max(0, Math.min(100, Math.round(this.display)))
    },
    color() {
      return this.display >= 80 ? '#10b981' : this.display >= 50 ? '#f59e0b' : '#ef4444'
    },
    colorSoft() {
      return this.display >= 80 ? '#34d399' : this.display >= 50 ? '#fbbf24' : '#fb7185'
    },
    ringStyle() {
      return {
        background: `conic-gradient(from 220deg, ${this.colorSoft} 0 ${this.pct}%, #12202b ${this.pct}% 100%)`,
        boxShadow: `0 0 0 1px rgba(30,41,59,0.75), inset 0 0 12px ${this.color}22`,
      }
    },
    glowStyle() {
      return {
        background: `radial-gradient(circle at center, ${this.color}44 0%, transparent 72%)`
      }
    },
    textStyle() {
      return {
        color: this.color,
        textShadow: `0 0 10px ${this.color}40`
      }
    },
    deckLabel() { return this.deck === 'major' ? 'Major System' : this.deck.toUpperCase(); },
    itemsText() { return this.deck === 'major' ? '100 items' : '100 items'; }
  },
  methods: {
    getDisplayFromStats() {
      try {
        return getDeckPeak(this.deck)
      } catch {
        return 0
      }
    },
    refreshValue() {
      this.displayValue = this.getDisplayFromStats()
    },
  },
  mounted() {
    this.refreshValue()
    window.addEventListener('storage', this.refreshValue)
    window.addEventListener('mnemonic-stats-updated', this.refreshValue)
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.refreshValue)
    window.removeEventListener('mnemonic-stats-updated', this.refreshValue)
  }
}
</script>

<!-- styles migrated to Tailwind utilities -->
