<template>
  <div class="bg-[#071421] p-4 rounded-lg text-sky-100">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-bold">Preview — {{ title }}</h2>
      <button class="px-4 py-2 rounded-lg border border-cyan-400/70 bg-cyan-500/20 text-cyan-100 font-bold hover:bg-cyan-500/30" @click="$emit('back')" v-tooltip="'Return to home (B)'">⬅ Back</button>
    </div>

    <div v-if="showPaginationControls" class="mb-3 flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/40 p-3 md:flex-row md:items-center md:justify-between">
      <div class="text-sm text-slate-300">
        Showing {{ pageRangeLabel }} of {{ rows.length }}
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <label class="text-xs uppercase tracking-wide text-slate-400">
          Page size
          <select v-model.number="pageSize" class="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100">
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="250">250</option>
            <option :value="500">500</option>
          </select>
        </label>
        <button class="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 disabled:opacity-40" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
        <div class="text-sm text-slate-300">Page {{ currentPage }} / {{ pageCount }}</div>
        <button class="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 disabled:opacity-40" :disabled="currentPage >= pageCount" @click="goToPage(currentPage + 1)">Next</button>
      </div>
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

    <div v-else-if="mode === 'sem3major-matrix'" class="grid grid-cols-1 gap-3 lg:grid-cols-[280px_1fr]">
      <div class="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Block</div>
        <select v-model="selectedSem3Block" class="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100">
          <option v-for="option in sem3MajorBlockOptions" :key="option.code" :value="option.code">
            {{ option.code }} · {{ option.short }}
          </option>
        </select>
        <div class="mt-3 text-sm text-slate-200">{{ selectedSem3BlockTitle }}</div>
        <div class="mt-3 flex items-center gap-2">
          <button class="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 disabled:opacity-40" :disabled="selectedSem3BlockIndex <= 0" @click="goToSem3Block(-1)">Prev</button>
          <button class="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 disabled:opacity-40" :disabled="selectedSem3BlockIndex >= sem3MajorBlockOptions.length - 1" @click="goToSem3Block(1)">Next</button>
        </div>
      </div>

      <div class="overflow-auto rounded-lg border border-slate-700">
        <table class="w-full border-collapse text-sm">
          <thead class="bg-slate-900/70 sticky top-0">
            <tr>
              <th class="p-2 border border-slate-700 text-left">{{ selectedSem3Block }} \ Major</th>
              <th v-for="c in 10" :key="`smmh-${c - 1}`" class="p-2 border border-slate-700 text-left">{{ c - 1 }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in 10" :key="`smmr-${r - 1}`" class="odd:bg-slate-900/30">
              <td class="p-2 border border-slate-700 font-semibold">{{ r - 1 }}</td>
              <td v-for="c in 10" :key="`smmc-${r - 1}-${c - 1}`" class="p-2 border border-slate-700 whitespace-nowrap">
                {{ sem3MajorCell(r - 1, c - 1) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="mode === 'binary'" class="overflow-auto rounded-lg border border-slate-700">
      <table class="w-full border-collapse text-sm">
        <thead class="bg-slate-900/70 sticky top-0">
          <tr>
            <th class="p-2 border border-slate-700 text-left">MSB elem \\ LSB qual</th>
            <th v-for="header in binaryColumnHeaders" :key="header.bits" class="p-2 border border-slate-700 text-left">
              <div class="font-semibold">{{ header.label }} <span class="text-[11px] font-normal text-slate-400">{{ header.bits }}</span></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="header in binaryRowHeaders" :key="header.bits" class="odd:bg-slate-900/30">
            <td class="p-2 border border-slate-700 font-semibold">
              <div>{{ header.label }} <span class="text-[11px] font-normal text-slate-400">{{ header.bits }}</span></div>
            </td>
            <td v-for="low in bits2" :key="`${header.bits}-${low}`" class="p-2 border border-slate-700 whitespace-nowrap">
              {{ dataMap[`${header.bits}${low}`] || '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="mode === 'hex'" class="overflow-auto rounded-lg border border-slate-700">
      <table class="w-full border-collapse text-sm">
        <thead class="bg-slate-900/70 sticky top-0">
          <tr>
            <th class="p-2 border border-slate-700 text-left">MSB elem \\ LSB qual</th>
            <th v-for="header in binaryColumnHeaders" :key="`hex-col-${header.bits}`" class="p-2 border border-slate-700 text-left">
              <div class="font-semibold">{{ header.label }} <span class="text-[11px] font-normal text-slate-400">{{ header.bits }}</span></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="header in binaryRowHeaders" :key="`hex-row-${header.bits}`" class="odd:bg-slate-900/30">
            <td class="p-2 border border-slate-700 font-semibold">
              <div>{{ header.label }} <span class="text-[11px] font-normal text-slate-400">{{ header.bits }}</span></div>
            </td>
            <td v-for="low in bits2" :key="`hex-${header.bits}-${low}`" class="p-2 border border-slate-700 whitespace-nowrap">
              {{ dataMap[hexCodeFor(header.bits, low)] || '—' }}
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

    <div v-else-if="mode === 'pao10'" class="overflow-auto rounded-lg border border-slate-700">
      <table class="w-full border-collapse text-sm">
        <thead class="bg-slate-900/70 sticky top-0">
          <tr>
            <th class="p-2 border border-slate-700 text-center w-12">#</th>
            <th class="p-2 border border-slate-700 text-left">🧑 Person</th>
            <th class="p-2 border border-slate-700 text-left w-28">Image</th>
            <th class="p-2 border border-slate-700 text-left">⚡ Action</th>
            <th class="p-2 border border-slate-700 text-left w-28">Image</th>
            <th class="p-2 border border-slate-700 text-left">🗡️ Object</th>
            <th class="p-2 border border-slate-700 text-left w-28">Image</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 10" :key="i - 1" class="odd:bg-slate-900/30">
            <td class="p-2 border border-slate-700 text-center font-bold text-slate-300">{{ i - 1 }}</td>
            <td class="p-2 border border-slate-700">{{ pao10people[String(i - 1)] || '—' }}</td>
            <td class="p-2 border border-slate-700"><img :src="pao10peopleImages[String(i - 1)] || ''" alt="" class="h-10 w-14 rounded border border-slate-700 object-cover" @error="onImageError($event, String(i - 1))" /></td>
            <td class="p-2 border border-slate-700">{{ pao10actions[String(i - 1)] || '—' }}</td>
            <td class="p-2 border border-slate-700"><img :src="pao10actionsImages[String(i - 1)] || ''" alt="" class="h-10 w-14 rounded border border-slate-700 object-cover" @error="onImageError($event, String(i - 1))" /></td>
            <td class="p-2 border border-slate-700">{{ pao10objects[String(i - 1)] || '—' }}</td>
            <td class="p-2 border border-slate-700"><img :src="pao10objectsImages[String(i - 1)] || ''" alt="" class="h-10 w-14 rounded border border-slate-700 object-cover" @error="onImageError($event, String(i - 1))" /></td>
          </tr>
        </tbody>
      </table>
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
          <tr v-for="row in visibleBibleBookRows" :key="row.key" class="odd:bg-slate-900/30">
            <td class="p-2 border border-slate-700 text-slate-300">
              <div class="flex items-center justify-between gap-1">
                <span>{{ row.key }}</span>
                <span class="text-[10px] text-slate-500 shrink-0">{{ rowDueLabel(row.key) }}</span>
              </div>
            </td>
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
          <tr v-for="row in visibleRows" :key="row.key" class="odd:bg-slate-900/30">
            <td class="p-2 border border-slate-700 text-slate-300">
              <div class="flex items-center justify-between gap-1">
                <span>{{ row.key }}</span>
                <span class="text-[10px] text-slate-500 shrink-0">{{ rowDueLabel(row.key) }}</span>
              </div>
            </td>
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
import { getDeckReviewState } from '../core/spaced-repetition'
import { DECKS } from '../data/decks'
import { MAJOR_DATA } from '../data/major-system'
import { SEM3_DATA } from '../data/sem3'
import { PEG_AUDIO, PEG_VISUAL } from '../data/peg-matrix'
import { PEG_AUDIO_RU, PEG_VISUAL_RU } from '../data/peg-matrix-ru'
import { PAO10_PEOPLE_DATA, PAO10_ACTIONS_DATA, PAO10_OBJECTS_DATA, PAO10_PEOPLE_IMAGES, PAO10_ACTIONS_IMAGES, PAO10_OBJECTS_IMAGES } from '../data/pao10'

const SEM3_LABELS = ['Vision', 'Sound', 'Smell', 'Taste', 'Touch', 'Sensation', 'Animals', 'Birds', 'Rainbow', 'Solar-System']
import { PAO_PEOPLE, PAO_ACTIONS, PAO_OBJECTS } from '../data/pao'

export default {
  name: 'PreviewView',
  props: { deck: String },
  data() {
    return {
      dataMap: {},
      imageMap: {},
      emojiMap: {},
      reviewMap: {},
      bits2: ['00', '01', '10', '11'],
      currentPage: 1,
      pageSize: 100,
      selectedSem3Block: '00',
    }
  },
  computed: {
    title() {
      return DECKS.find((d) => d.deck === this.deck)?.name || this.deck
    },
    mode() {
      if (this.deck === 'major') return 'major-matrix'
      if (this.deck === 'pegmatrix' || this.deck === 'pegmatrixru') return 'peg'
      if (this.deck === 'sem3major') return 'sem3major-matrix'
      if (this.deck === 'binary') return 'binary'
      if (this.deck === 'hex') return 'hex'
      if (this.deck === 'sem3' || this.deck === 'pao') return 'grouped'
      if (this.deck === 'pao10people' || this.deck === 'pao10actions' || this.deck === 'pao10objects') return 'pao10'
      if (this.deck === 'biblebooks') return 'biblebooks'
      return 'table'
    },
    pao10people() { return PAO10_PEOPLE_DATA },
    pao10actions() { return PAO10_ACTIONS_DATA },
    pao10objects() { return PAO10_OBJECTS_DATA },
    pao10peopleImages() { return PAO10_PEOPLE_IMAGES },
    pao10actionsImages() { return PAO10_ACTIONS_IMAGES },
    pao10objectsImages() { return PAO10_OBJECTS_IMAGES },
    pegAudio() {
      const src = this.deck === 'pegmatrixru' ? PEG_AUDIO_RU : PEG_AUDIO
      return Object.values(src)
    },
    pegVisual() {
      const src = this.deck === 'pegmatrixru' ? PEG_VISUAL_RU : PEG_VISUAL
      return Object.values(src)
    },
    binaryRowHeaders() {
      return [
        { bits: '00', label: '🔥 Fire' },
        { bits: '01', label: '🌬 Air' },
        { bits: '10', label: '💧 Water' },
        { bits: '11', label: '🪨 Earth' },
      ]
    },
    binaryColumnHeaders() {
      return [
        { bits: '00', label: '🔥 Hot' },
        { bits: '01', label: '🏜 Dry' },
        { bits: '10', label: '🧊 Cold' },
        { bits: '11', label: '💧 Wet' },
      ]
    },
    sem3MajorBlockOptions() {
      const out = []
      for (let sense = 0; sense < 10; sense += 1) {
        for (let idx = 0; idx < 10; idx += 1) {
          const code = `${sense}${idx}`
          const sem3Key = `${code}00`
          const raw = String(SEM3_DATA[sem3Key] || `${SEM3_LABELS[sense]} - —`)
          const [prefix, suffix] = raw.includes(' - ') ? raw.split(' - ') : [SEM3_LABELS[sense], raw]
          out.push({
            code,
            short: suffix,
            full: `${prefix} - ${suffix}`,
          })
        }
      }
      return out
    },
    selectedSem3BlockIndex() {
      return this.sem3MajorBlockOptions.findIndex((item) => item.code === this.selectedSem3Block)
    },
    selectedSem3BlockTitle() {
      const found = this.sem3MajorBlockOptions.find((item) => item.code === this.selectedSem3Block)
      return found ? `${found.code} · ${found.short}` : this.selectedSem3Block
    },
    rows() {
      return Object.entries(this.dataMap)
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => String(a.key).localeCompare(String(b.key), undefined, { numeric: true }))
    },
    showPaginationControls() {
      return this.mode === 'table' && this.rows.length > this.pageSize
    },
    pageCount() {
      return Math.max(1, Math.ceil(this.rows.length / this.pageSize))
    },
    pagedRows() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.rows.slice(start, start + this.pageSize)
    },
    visibleRows() {
      return this.showPaginationControls ? this.pagedRows : this.rows
    },
    visibleBibleBookRows() {
      return this.showPaginationControls ? this.pagedRows.map((row) => {
        const keyNum = Number(row.key)
        return {
          ...row,
          assoc: Number.isFinite(keyNum) ? (MAJOR_DATA[keyNum] || '—') : '—'
        }
      }) : this.bibleBookRows
    },
    pageRangeLabel() {
      if (!this.rows.length) return '0-0'
      const start = (this.currentPage - 1) * this.pageSize + 1
      const end = Math.min(this.rows.length, start + this.visibleRows.length - 1)
      return `${start}-${end}`
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
        // Show three groups: People, Actions, Objects
        return [
          {
            name: 'People (0–9)',
            rows: PAO_PEOPLE.map((p) => ({
              key: p.num,
              value: `${p.person} (${p.consonant})`,
            })),
          },
          {
            name: 'Actions (0–9)',
            rows: PAO_ACTIONS.map((a) => ({
              key: a.num,
              value: `${a.action} (${a.consonant})`,
            })),
          },
          {
            name: 'Objects (0–9)',
            rows: PAO_OBJECTS.map((o) => ({
              key: o.num,
              value: `${o.object} (${o.consonant})`,
            })),
          },
        ]
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
    goToPage(page) {
      this.currentPage = Math.min(this.pageCount, Math.max(1, Number(page) || 1))
    },
    goToSem3Block(delta) {
      const current = this.selectedSem3BlockIndex
      const next = Math.min(this.sem3MajorBlockOptions.length - 1, Math.max(0, current + delta))
      this.selectedSem3Block = this.sem3MajorBlockOptions[next]?.code || this.selectedSem3Block
    },
    majorCell(r, c) {
      const raw = r * 10 + c
      return this.dataMap[String(raw)] || this.dataMap[String(raw).padStart(2, '0')] || '—'
    },
    sem3MajorCell(r, c) {
      const lower = String(r * 10 + c).padStart(2, '0')
      return this.compactSem3Major(this.dataMap[`${this.selectedSem3Block}${lower}`])
    },
    compactSem3Major(value) {
      const text = String(value || '').trim()
      if (!text) return '—'
      const parts = text.split(' + ')
      if (parts.length !== 2) return text
      const sem3Part = parts[0].replace(/^\d{2}\s+/, '').replace(/\s*\(SEM3\)\s*$/i, '').trim()
      const majorPart = parts[1].replace(/^\d{2}\s+/, '').replace(/\s*\(Major\)\s*$/i, '').trim()
      if (!sem3Part && !majorPart) return text
      return `${sem3Part || '—'} + ${majorPart || '—'}`
    },
    keyFor(r, c) {
      return this.deck === 'pegmatrixru' ? `${r}${c}`.padStart(2, '0') : `${r}${c}`.padStart(2, '0')
    },
    hexCodeFor(highBits, lowBits) {
      return Number.parseInt(`${highBits}${lowBits}`, 2).toString(16).toUpperCase()
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
    rowDueLabel(key) {
      const item = this.reviewMap[String(key)]
      if (!item || !item.nextDueAt) return 'new'
      const diffDays = Math.round((Number(item.nextDueAt) - Date.now()) / 86400000)
      if (diffDays <= 0) return 'due today'
      if (diffDays === 1) return '1 day'
      return `${diffDays}d`
    },
    async load() {
      this.dataMap = await loadDeckData(this.deck)
      this.imageMap = getDeckImagesSync(this.deck)
      this.emojiMap = getDeckEmojiMapSync(this.deck)
      this.reviewMap = getDeckReviewState(this.deck)
      this.currentPage = 1
      if (this.deck === 'sem3major' && !this.sem3MajorBlockOptions.some((item) => item.code === this.selectedSem3Block)) {
        this.selectedSem3Block = '00'
      }
    }
  },
  watch: {
    pageSize() {
      this.currentPage = 1
    },
    rows() {
      if (this.currentPage > this.pageCount) {
        this.currentPage = this.pageCount
      }
    },
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
