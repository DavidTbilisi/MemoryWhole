<template>
  <div class="bg-[#071421] p-4 rounded-lg text-sky-100">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-bold">Preview — {{ title }}</h2>
      <button class="px-3 py-2 rounded-lg bg-slate-700 text-white" @click="$emit('back')" v-tooltip="'Return to home'">Back</button>
    </div>

    <div v-if="mode === 'major-matrix'" class="overflow-auto rounded-lg border border-slate-700">
      <table class="w-full border-collapse text-sm">
        <thead class="bg-slate-900/70 sticky top-0">
          <tr>
            <th class="p-2 border border-slate-700 text-left">Tens \ Ones</th>
            <th v-for="c in 10" :key="`mh-${c-1}`" class="p-2 border border-slate-700 text-left">{{ c - 1 }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in 10" :key="`mr-${r-1}`" class="odd:bg-slate-900/30">
            <td class="p-2 border border-slate-700 font-semibold">{{ r - 1 }}</td>
            <td v-for="c in 10" :key="`mc-${r-1}-${c-1}`" class="p-2 border border-slate-700 whitespace-nowrap">
              {{ majorCell(r - 1, c - 1) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="mode === 'peg'" class="overflow-auto rounded-lg border border-slate-700">
      <table class="w-full border-collapse text-sm">
        <thead class="bg-slate-900/70 sticky top-0">
          <tr>
            <th class="p-2 border border-slate-700 text-left">Audio \ Visual</th>
            <th v-for="v in pegVisual" :key="v" class="p-2 border border-slate-700 text-left">{{ v }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(a, r) in pegAudio" :key="a" class="odd:bg-slate-900/30">
            <td class="p-2 border border-slate-700 font-semibold">{{ a }}</td>
            <td v-for="(_, c) in pegVisual" :key="`${r}-${c}`" class="p-2 border border-slate-700 whitespace-nowrap">
              {{ dataMap[keyFor(r, c)] || '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="mode === 'binary'" class="overflow-auto rounded-lg border border-slate-700">
      <table class="w-full border-collapse text-sm">
        <thead class="bg-slate-900/70 sticky top-0">
          <tr>
            <th class="p-2 border border-slate-700 text-left">MSB \\ LSB</th>
            <th v-for="low in bits2" :key="low" class="p-2 border border-slate-700 text-left">{{ low }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="high in bits2" :key="high" class="odd:bg-slate-900/30">
            <td class="p-2 border border-slate-700 font-semibold">{{ high }}</td>
            <td v-for="low in bits2" :key="`${high}-${low}`" class="p-2 border border-slate-700 whitespace-nowrap">
              {{ dataMap[`${high}${low}`] || '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="mode === 'grouped'" class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div v-for="g in groupedRows" :key="g.name" class="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
        <div class="font-semibold mb-2">{{ g.name }}</div>
        <div class="space-y-1 text-sm">
            <div v-for="row in g.rows" :key="row.key" class="flex items-center justify-between gap-2">
              <span class="text-slate-400">{{ row.key }}</span>
              <div class="flex min-w-0 items-center gap-2">
                <img :src="imageForKey(row.key)" alt="" class="h-7 w-10 rounded border border-slate-700 object-cover" @error="onImageError($event, row.key)" />
                <span class="truncate text-right">{{ row.value }}</span>
              </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="mode === 'biblebooks'" class="overflow-auto rounded-lg border border-slate-700">
      <table class="w-full border-collapse text-sm">
        <thead class="bg-slate-900/70 sticky top-0">
          <tr>
            <th class="p-2 border border-slate-700 text-left w-20">Key</th>
            <th class="p-2 border border-slate-700 text-left">Book name</th>
            <th class="p-2 border border-slate-700 text-left">Assoc</th>
                <th class="p-2 border border-slate-700 text-left w-24">Image</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in bibleBookRows" :key="row.key" class="odd:bg-slate-900/30">
            <td class="p-2 border border-slate-700 text-slate-300">{{ row.key }}</td>
            <td class="p-2 border border-slate-700">{{ row.value }}</td>
            <td class="p-2 border border-slate-700 text-cyan-200">{{ row.assoc }}</td>
                <td class="p-2 border border-slate-700"><img :src="imageForKey(row.key)" alt="" class="h-10 w-14 rounded border border-slate-700 object-cover" @error="onImageError($event, row.key)" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="overflow-auto rounded-lg border border-slate-700">
      <table class="w-full border-collapse text-sm">
        <thead class="bg-slate-900/70 sticky top-0">
          <tr>
            <th class="p-2 border border-slate-700 text-left w-28">Key</th>
            <th class="p-2 border border-slate-700 text-left">Association</th>
                <th class="p-2 border border-slate-700 text-left w-24">Image</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key" class="odd:bg-slate-900/30">
            <td class="p-2 border border-slate-700 text-slate-300">{{ row.key }}</td>
            <td class="p-2 border border-slate-700">{{ row.value }}</td>
                <td class="p-2 border border-slate-700"><img :src="imageForKey(row.key)" alt="" class="h-10 w-14 rounded border border-slate-700 object-cover" @error="onImageError($event, row.key)" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { getDeckEmojiMapSync, getDeckImagesSync, loadDeckData, makeEmojiFallbackDataUri } from '../core/deck-loader'
import { DECKS } from '../data/decks'
import { MAJOR_DATA } from '../data/major-system'
import { PEG_AUDIO, PEG_VISUAL } from '../data/peg-matrix'
import { PEG_AUDIO_RU, PEG_VISUAL_RU } from '../data/peg-matrix-ru'

const SEM3_LABELS = ['Vision', 'Sound', 'Smell', 'Taste', 'Touch', 'Sensation', 'Animals', 'Birds', 'Rainbow', 'Solar-System']
const PAO_GROUPS = [
  { title: '0. Mononoke', min: 0, max: 10 },
  { title: '1. Death Note', min: 11, max: 20 },
  { title: '2. Naruto', min: 21, max: 30 },
  { title: '3. Avatar', min: 31, max: 40 },
  { title: '4. Mortal Combat', min: 41, max: 50 },
  { title: '5. Sherlock', min: 51, max: 60 },
  { title: '6. Harry Potter', min: 61, max: 70 },
  { title: '7. Matrix', min: 71, max: 80 },
  { title: '8. Caribbean', min: 81, max: 90 },
  { title: '9. GOT', min: 91, max: 99 },
]

export default {
  name: 'PreviewView',
  props: { deck: String },
  data() {
    return {
      dataMap: {},
      imageMap: {},
      emojiMap: {},
      bits2: ['00', '01', '10', '11']
    }
  },
  computed: {
    title() {
      return DECKS.find((d) => d.deck === this.deck)?.name || this.deck
    },
    mode() {
      if (this.deck === 'major') return 'major-matrix'
      if (this.deck === 'pegmatrix' || this.deck === 'pegmatrixru') return 'peg'
      if (this.deck === 'binary') return 'binary'
      if (this.deck === 'sem3' || this.deck === 'pao') return 'grouped'
      if (this.deck === 'biblebooks') return 'biblebooks'
      return 'table'
    },
    pegAudio() {
      const src = this.deck === 'pegmatrixru' ? PEG_AUDIO_RU : PEG_AUDIO
      return Object.values(src)
    },
    pegVisual() {
      const src = this.deck === 'pegmatrixru' ? PEG_VISUAL_RU : PEG_VISUAL
      return Object.values(src)
    },
    rows() {
      return Object.entries(this.dataMap)
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => String(a.key).localeCompare(String(b.key), undefined, { numeric: true }))
    },
    groupedRows() {
      if (this.deck === 'sem3') {
        const grouped = SEM3_LABELS.map((name, idx) => ({ name: `${idx}. ${name}`, base: name, rows: [] }))
        for (const row of this.rows) {
          const idx = Number(String(row.key)[0])
          if (Number.isFinite(idx) && idx >= 0 && idx < grouped.length) {
            const prefix = `${grouped[idx].base} - `
            const value = String(row.value || '').startsWith(prefix)
              ? String(row.value).slice(prefix.length)
              : row.value
            grouped[idx].rows.push({ ...row, value })
          }
        }
        return grouped.filter((g) => g.rows.length)
      }

      if (this.deck === 'pao') {
        return PAO_GROUPS.map((g) => {
          const rows = this.rows.filter((r) => {
            const n = Number(r.key)
            return Number.isFinite(n) && n >= g.min && n <= g.max
          })
          return { name: g.title, rows }
        }).filter((g) => g.rows.length)
      }

      return []
    },
    bibleBookRows() {
      return this.rows.map((r) => {
        const keyNum = Number(r.key)
        return {
          ...r,
          assoc: Number.isFinite(keyNum) ? (MAJOR_DATA[keyNum] || '—') : '—'
        }
      })
    }
  },
  methods: {
    majorCell(r, c) {
      const raw = r * 10 + c
      return this.dataMap[String(raw)] || this.dataMap[String(raw).padStart(2, '0')] || '—'
    },
    keyFor(r, c) {
      return this.deck === 'pegmatrixru' ? `${r}${c}`.padStart(2, '0') : `${r}${c}`.padStart(2, '0')
    },
    imageForKey(key) {
      return this.imageMap[String(key)] || ''
    },
    onImageError(event, key) {
      const img = event?.target
      if (!img || img.dataset.fallbackApplied === '1') return
      img.dataset.fallbackApplied = '1'
      const emoji = this.emojiMap[String(key)] || '🧩'
      img.src = makeEmojiFallbackDataUri(emoji)
    },
    async load() {
      this.dataMap = await loadDeckData(this.deck)
      this.imageMap = getDeckImagesSync(this.deck)
      this.emojiMap = getDeckEmojiMapSync(this.deck)
    }
  },
  watch: {
    deck: {
      immediate: true,
      handler() {
        this.load().catch((e) => {
          console.error(e)
          this.dataMap = {}
        })
      }
    }
  }
}
</script>
