<template>
  <div class="bg-[#071421] p-4 rounded-lg text-sky-100 border shadow-[0_0_0_1px_rgba(15,23,42,0.25)]"
    :class="focused ? 'border-cyan-400/90 shadow-[0_0_0_2px_rgba(34,211,238,0.55)]' : 'border-slate-700/70'">
    <div class="grid grid-cols-[84px_1fr] gap-3 items-center min-h-[84px]">
      <div class="flex items-center justify-center w-[84px] h-[84px]"><HomeBadge :deck="deck" compact /></div>
      <div class="flex items-center gap-3 min-w-0">
        <div class="text-2xl">{{ icon }}</div>
        <div class="min-w-0">
          <div class="font-semibold text-lg truncate">{{ name }}</div>
          <div class="text-sm text-slate-400">{{ countText }}</div>
        </div>
      </div>
    </div>

    <button v-tooltip="'Start Quiz'" class="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-400 text-white font-bold" @click="$emit('start', deck)">▶ Start Quiz</button>

    <div class="grid grid-cols-4 gap-2 mt-3">
      <button v-tooltip="'View Performance Stats'" class="flex flex-col items-center justify-center gap-1 p-2 border border-slate-700 rounded-md text-sm text-slate-300" @click="$emit('dashboard', deck)">📊<span class="text-xs text-slate-500 uppercase">Stats</span></button>
      <button v-tooltip="'Preview Deck Items'" class="flex flex-col items-center justify-center gap-1 p-2 border border-slate-700 rounded-md text-sm text-slate-300" @click="$emit('preview', deck)">⊞<span class="text-xs text-slate-500 uppercase">Preview</span></button>
      <button v-tooltip="'Edit Deck Items'" class="flex flex-col items-center justify-center gap-1 p-2 border border-slate-700 rounded-md text-sm text-slate-300" @click="$emit('edit', deck)">✎<span class="text-xs text-slate-500 uppercase">Edit</span></button>
      <button v-tooltip="'Export Deck'" class="flex flex-col items-center justify-center gap-1 p-2 border border-slate-700 rounded-md text-sm text-slate-300" @click="$emit('export', deck)">⬇<span class="text-xs text-slate-500 uppercase">Export</span></button>
    </div>
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
  }
}
</script>

