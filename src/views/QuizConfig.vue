<template>
  <div class="bg-[#071421] p-4 rounded-xl text-sky-100">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-3xl font-black">{{ title }}</h2>
      <button v-tooltip="'Return to Home'" class="px-5 py-2 rounded-xl border border-slate-600 bg-slate-900/40" @click="$emit('back')">← Back</button>
    </div>

    <div class="grid grid-cols-2 gap-2 md:grid-cols-4 mb-6">
      <button
        v-for="group in groups"
        :key="group.label"
        v-tooltip="`Toggle ${group.label}`"
        @click="toggle(group.label)"
        class="px-4 py-3 rounded-xl font-bold border"
        :class="selected.has(group.label) ? 'bg-violet-700/40 border-violet-500 text-white' : 'bg-slate-900/40 border-slate-700 text-slate-300'"
      >
        {{ group.label }}
      </button>
    </div>

    <button v-tooltip="'Select or deselect all items'" class="w-full mb-4 rounded-xl py-3 bg-slate-800 border border-slate-700 text-lg font-bold" @click="toggleAll">Toggle All</button>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <button v-tooltip="'Start standard quiz mode'" class="rounded-xl py-4 text-xl font-black bg-gradient-to-r from-violet-600 to-cyan-400" @click="startQuiz">▶ Start Quiz</button>
      <button v-tooltip="'Start timed speed drill mode'" class="rounded-xl py-4 text-xl font-black bg-gradient-to-r from-amber-500 to-rose-500" @click="startDrill">⚡ Speed Drill</button>
    </div>
  </div>
</template>

<script>
import { loadDeckData } from '../core/deck-loader'
import { getChunkGroups } from '../core/chunk-groups'

export default {
  name: 'QuizConfigView',
  props: {
    deck: { type: String, required: true }
  },
  data() {
    return {
      groups: [],
      selected: new Set(),
    }
  },
  computed: {
    title() {
      return (this.deck || '').toUpperCase()
    }
  },
  methods: {
    toggle(label) {
      if (this.selected.has(label)) this.selected.delete(label)
      else this.selected.add(label)
      this.selected = new Set(this.selected)
    },
    toggleAll() {
      if (this.selected.size === this.groups.length) {
        this.selected = new Set()
      } else {
        this.selected = new Set(this.groups.map((g) => g.label))
      }
    },
    startQuiz() {
      const chosen = this.groups.filter((g) => this.selected.has(g.label))
      const keys = chosen.flatMap((g) => g.keys)
      if (keys.length < 6) {
        alert('Select at least 6 items to quiz.')
        return
      }
      this.$emit('start', keys)
    },
    startDrill() {
      const chosen = this.groups.filter((g) => this.selected.has(g.label))
      const keys = chosen.flatMap((g) => g.keys)
      if (keys.length < 6) {
        alert('Select at least 6 items to drill.')
        return
      }
      this.$emit('start-drill', keys)
    },
    async setup() {
      const data = await loadDeckData(this.deck)
      this.groups = getChunkGroups(this.deck, data).filter((g) => g.keys.length > 0)
      this.selected = new Set(this.groups.map((g) => g.label))
    }
  },
  watch: {
    deck: {
      immediate: true,
      handler() {
        this.setup().catch((e) => {
          console.error(e)
          this.groups = []
          this.selected = new Set()
        })
      }
    }
  }
}
</script>
