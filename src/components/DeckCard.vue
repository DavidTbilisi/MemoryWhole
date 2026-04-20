<template>
  <div
    class="deck-card bg-[#071421] p-4 rounded-lg text-sky-100 border shadow-[0_0_0_1px_rgba(15,23,42,0.25)] cursor-pointer transition-all hover:border-cyan-400/60 select-none"
    :class="[
      focused ? 'border-cyan-400/90 shadow-[0_0_0_2px_rgba(34,211,238,0.55)]' : 'border-slate-700/70',
      longPressing ? 'scale-[0.97] brightness-110' : ''
    ]"
    @click="onClick"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
    @touchmove="onTouchMove"
    @contextmenu.prevent
  >
    <div class="flex items-center gap-3 min-h-[64px]">
      <div class="flex items-center justify-center w-[64px] h-[64px] shrink-0"><HomeBadge :deck="deck" compact /></div>
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <div class="text-xl">{{ icon }}</div>
        <div class="min-w-0">
          <div class="font-semibold text-base truncate">{{ name }}</div>
          <div class="text-xs text-slate-400">{{ countText }}</div>
        </div>
      </div>
    </div>

    <button
      v-tooltip="'Start Quiz'"
      class="w-full mt-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-400 text-white font-bold text-sm"
      @click.stop="$emit('start', deck)"
      @touchstart.stop
      @touchend.stop
    >▶ Start Quiz</button>

    <div class="mt-1.5 text-center text-[10px] text-slate-600 md:hidden">hold to instant-start</div>
  </div>
</template>

<script>
import HomeBadge from './HomeBadge.vue'
export default {
  name: 'DeckCard',
  components: { HomeBadge },
  props: {
    deck: { type: String, required: true },
    name: { type: String, required: true },
    countText: { type: String, default: '100 items' },
    icon: { type: String, default: '🔢' },
    focused: { type: Boolean, default: false }
  },
  data() {
    return {
      longPressTimer: null,
      longPressing: false,
      longPressFired: false,
      touchMoved: false,
    }
  },
  methods: {
    onTouchStart() {
      this.touchMoved = false
      this.longPressFired = false
      this.longPressTimer = setTimeout(() => {
        this.longPressing = false
        this.longPressFired = true
        try { if (navigator.vibrate) navigator.vibrate([20, 40, 20]) } catch (_) {}
        this.$emit('instant-start', this.deck)
      }, 500)
      // Visual feedback starts at 150ms
      setTimeout(() => {
        if (this.longPressTimer) this.longPressing = true
      }, 150)
    },
    onTouchMove() {
      this.touchMoved = true
      this.cancelLongPress()
    },
    onTouchEnd() {
      this.cancelLongPress()
    },
    cancelLongPress() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
      this.longPressing = false
    },
    onClick(e) {
      if (this.longPressFired) {
        this.longPressFired = false
        return
      }
      this.$emit('dashboard', this.deck)
    },
  },
  beforeUnmount() {
    this.cancelLongPress()
  },
}
</script>
