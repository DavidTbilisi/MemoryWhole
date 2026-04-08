<template>
  <div class="home-badge">
    <svg width="80" height="80" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="18" fill="none" stroke="#12202b" stroke-width="4"/>
      <circle :stroke="color" cx="22" cy="22" r="18" fill="none" stroke-width="4"
        :stroke-dasharray="dashArray" stroke-linecap="round" transform="rotate(-90 22 22)"/>
      <text x="22" y="27" text-anchor="middle" :fill="color" font-size="12" font-weight="700">{{ pct }}%</text>
    </svg>
    <div style="margin-left:8px">
      <div style="font-weight:700">{{ deckLabel }}</div>
      <div style="font-size:0.85rem;color:#9fb0c2">{{ itemsText }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeBadge',
  props: {
    deck: { type: String, required: true },
    initial: { type: Number, default: 0 }
  },
  computed: {
    display() {
      // show persisted peak if available
      try {
        const peaks = JSON.parse(localStorage.getItem('masteryPeak_v1') || '{}');
        return Math.max(peaks[this.deck] || 0, this.initial || 0);
      } catch (e) { return this.initial || 0; }
    },
    pct() { return Math.round(this.display); },
    dashArray() { return ((this.display / 100) * 113).toFixed(1) + ' 113'; },
    color() { return this.display >= 80 ? '#10b981' : this.display >= 50 ? '#f59e0b' : '#ef4444'; },
    deckLabel() { return this.deck === 'major' ? 'Major System' : this.deck.toUpperCase(); },
    itemsText() { return this.deck === 'major' ? '100 items' : '100 items'; }
  }
}
</script>

<style scoped>
.home-badge { display:flex; align-items:center; gap:0.5rem; background:#082032; padding:0.5rem 0.75rem; border-radius:8px }
</style>
