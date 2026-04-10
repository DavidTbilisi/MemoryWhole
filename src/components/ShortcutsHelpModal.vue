<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" @click.self="$emit('close')">
    <div class="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-slate-900 via-[#0c1222] to-slate-950 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
        <div>
          <h2 class="text-xl font-black text-cyan-200">{{ isTouch ? 'Touch Gestures' : 'Keyboard Shortcuts' }}</h2>
          <p class="text-xs text-slate-400">{{ isTouch ? 'Gestures for the current screen.' : 'Use Shift+/ anytime to open this panel.' }}</p>
        </div>
        <button class="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-800" @click="$emit('close')">
          {{ isTouch ? 'Close' : 'Esc to close' }}
        </button>
      </div>

      <div class="grid max-h-[72vh] grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-2">
        <div v-for="group in groups" :key="group.title" class="rounded-xl border border-slate-700/80 bg-slate-900/45 p-3">
          <div class="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300">{{ group.title }}</div>
          <div class="space-y-1.5">
            <div
              v-for="row in group.items"
              :key="`${group.title}-${row.keys}-${row.action}`"
              class="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-900/40 px-2 py-1.5"
            >
              <span class="text-xs text-slate-300">{{ row.action }}</span>
              <span class="rounded border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap"
                :class="isTouch ? 'border-amber-500/40 bg-amber-900/20 text-amber-200' : 'border-cyan-500/40 bg-cyan-900/20 text-cyan-200'"
              >{{ row.keys }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShortcutsHelpModal',
  props: {
    open: { type: Boolean, default: false },
    groups: { type: Array, default: () => [] },
  },
  emits: ['close'],
  computed: {
    isTouch() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0
    },
  },
}
</script>
