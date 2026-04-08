<template>
  <div class="rounded-2xl border border-slate-700/70 bg-gradient-to-b from-[#0b1b2b] to-[#071421] p-4 text-sky-100 md:p-5">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-xl font-bold">Edit Deck - {{ title }}</h2>
      <div class="flex flex-wrap items-center gap-2">
        <button class="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm" @click="triggerImport" v-tooltip="'Load edited deck from JSON file'">Import</button>
        <button class="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm" @click="downloadTemplate" v-tooltip="'Download template JSON for bulk editing'">Template</button>
        <button class="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm" @click="exportNow" v-tooltip="'Export current deck as JSON file'">Export</button>
        <button class="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm" @click="resetToBase" v-tooltip="'Reset to default deck values'">Reset</button>
        <button class="rounded-lg border border-cyan-600 bg-cyan-900/30 px-3 py-2 text-sm" @click="save" v-tooltip="'Save changes to IndexedDB'">Save</button>
        <button class="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white" @click="$emit('back')" v-tooltip="'Return to home'">Back</button>
      </div>
    </div>

    <div class="mb-3 text-sm text-slate-400">Edit associations and image paths/URLs, then click Save to apply changes across quiz, preview, and dashboard. Tip: local files can use paths like /deck-images/major/00.webp.</div>

    <input ref="importInput" type="file" accept="application/json,.json" class="hidden" @change="onImportFile" />
    <input ref="uploadInput" type="file" accept="image/*" class="hidden" @change="onUploadFile" />

    <div class="overflow-auto rounded-lg border border-slate-700">
      <table class="w-full border-collapse text-sm">
        <thead class="sticky top-0 bg-slate-900/70">
          <tr>
            <th class="w-28 border border-slate-700 p-2 text-left">Key</th>
            <th class="border border-slate-700 p-2 text-left">Association</th>
            <th class="w-28 border border-slate-700 p-2 text-left">Icon</th>
            <th class="w-[280px] border border-slate-700 p-2 text-left">Image URL / Path</th>
            <th class="w-24 border border-slate-700 p-2 text-left">Preview</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key" class="odd:bg-slate-900/30">
            <td class="border border-slate-700 p-2 text-slate-300">{{ row.key }}</td>
            <td class="border border-slate-700 p-2">
              <input
                v-model="row.value"
                type="text"
                class="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
              />
            </td>
            <td class="border border-slate-700 p-2">
              <div class="flex items-center gap-2">
                <input
                  v-model="row.icon"
                  type="text"
                  class="w-14 rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-center text-lg text-slate-100 outline-none focus:border-cyan-500"
                />
                <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="resetIcon(row)" v-tooltip="'Reset to default icon'">Reset</button>
              </div>
            </td>
            <td class="border border-slate-700 p-2" @dragover.prevent="onDragOver" @drop.prevent="onDropImage(row, $event)">
              <input
                v-model="row.image"
                type="text"
                class="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
              />
              <div class="mt-1 flex items-center gap-2">
                <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="triggerUpload(row.key)" v-tooltip="'Upload image file'">Upload</button>
                <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="clearImage(row)" v-tooltip="'Clear image URL'">Clear</button>
                <span class="text-[11px] text-slate-500">drop image here</span>
              </div>
            </td>
            <td class="border border-slate-700 p-2">
              <img :src="row.image" alt="" class="h-12 w-16 rounded border border-slate-700 object-cover" @error="onImageError($event, row.key)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="message" class="mt-3 text-sm" :class="messageOk ? 'text-emerald-300' : 'text-rose-300'">{{ message }}</div>
  </div>
</template>

<script>
import { DECKS } from '../data/decks'
import { exportDeckPayload, getDeckBaseDataSync, getDeckDataSync, getDeckDefaultIconsSync, getDeckDefaultImagesSync, getDeckIconsSync, getDeckImagesSync, makeEmojiFallbackDataUri, saveDeckEdits, saveDeckIconEdits, saveDeckImageEdits } from '../core/deck-loader'

function byDeckKey(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

export default {
  name: 'EditorView',
  props: {
    deck: { type: String, required: true }
  },
  data() {
    return {
      rows: [],
      message: '',
      messageOk: true,
      pendingUploadKey: '',
      emojiMap: {},
    }
  },
  computed: {
    title() {
      return DECKS.find((d) => d.deck === this.deck)?.name || this.deck
    }
  },
  methods: {
    loadRows() {
      const current = getDeckDataSync(this.deck)
      const images = getDeckImagesSync(this.deck)
      const icons = getDeckIconsSync(this.deck)
      this.emojiMap = { ...icons }
      this.rows = Object.entries(current)
        .sort(([a], [b]) => byDeckKey(a, b))
        .map(([key, value]) => ({
          key: String(key),
          value: String(value ?? ''),
          icon: String(icons[String(key)] || '🧩'),
          image: String(images[String(key)] || ''),
        }))
      this.message = ''
    },
    save() {
      const next = {}
      const nextImages = {}
      const nextIcons = {}
      for (const row of this.rows) {
        next[row.key] = String(row.value ?? '').trim()
        nextImages[row.key] = String(row.image ?? '').trim()
        nextIcons[row.key] = String(row.icon ?? '').trim()
      }
      saveDeckEdits(this.deck, next)
      saveDeckImageEdits(this.deck, nextImages)
      saveDeckIconEdits(this.deck, nextIcons)
      this.message = 'Saved'
      this.messageOk = true
    },
    resetToBase() {
      const base = getDeckBaseDataSync(this.deck)
      const images = getDeckDefaultImagesSync(this.deck)
      const icons = getDeckDefaultIconsSync(this.deck)
      this.emojiMap = { ...icons }
      this.rows = Object.entries(base)
        .sort(([a], [b]) => byDeckKey(a, b))
        .map(([key, value]) => ({
          key: String(key),
          value: String(value ?? ''),
          icon: String(icons[String(key)] || '🧩'),
          image: String(images[String(key)] || ''),
        }))
      this.message = 'Reset to base values, default icons, and default images. Click Save to apply.'
      this.messageOk = true
    },
    resetIcon(row) {
      const defaults = getDeckDefaultIconsSync(this.deck)
      row.icon = String(defaults[String(row.key)] || '🧩')
    },
    exportNow() {
      const payload = exportDeckPayload(this.deck)
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `mnemonic-${this.deck}-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      this.message = 'Exported'
      this.messageOk = true
    },
    downloadTemplate() {
      const base = getDeckBaseDataSync(this.deck)
      const templateData = {}
      const templateImages = {}
      const templateIcons = {}
      for (const key of Object.keys(base).sort(byDeckKey)) {
        templateData[String(key)] = ''
        templateIcons[String(key)] = ''
        templateImages[String(key)] = ''
      }

      const payload = {
        deck: this.deck,
        exportedAt: new Date().toISOString(),
        data: templateData,
        icons: templateIcons,
        images: templateImages,
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `mnemonic-${this.deck}-template-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      this.message = 'Template downloaded'
      this.messageOk = true
    },
    triggerImport() {
      this.$refs.importInput?.click()
    },
    triggerUpload(key) {
      this.pendingUploadKey = String(key)
      this.$refs.uploadInput?.click()
    },
    clearImage(row) {
      const defaults = getDeckDefaultImagesSync(this.deck)
      row.image = String(defaults[String(row.key)] || '')
    },
    onDragOver(event) {
      if (event?.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    },
    onDropImage(row, event) {
      const file = event?.dataTransfer?.files?.[0]
      if (!file || !file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = () => {
        row.image = String(reader.result || '')
      }
      reader.readAsDataURL(file)
    },
    onUploadFile(event) {
      const file = event?.target?.files?.[0]
      const targetKey = this.pendingUploadKey
      this.pendingUploadKey = ''
      if (!file || !targetKey || !file.type.startsWith('image/')) {
        if (event?.target) event.target.value = ''
        return
      }

      const row = this.rows.find((item) => item.key === targetKey)
      if (!row) {
        if (event?.target) event.target.value = ''
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        row.image = String(reader.result || '')
      }
      reader.readAsDataURL(file)
      if (event?.target) event.target.value = ''
    },
    async onImportFile(event) {
      const file = event?.target?.files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        const incoming = parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object'
          ? parsed.data
          : parsed
        const incomingIcons = parsed && typeof parsed === 'object' && parsed.icons && typeof parsed.icons === 'object'
          ? parsed.icons
          : {}
        const incomingImages = parsed && typeof parsed === 'object' && parsed.images && typeof parsed.images === 'object'
          ? parsed.images
          : {}

        if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
          throw new Error('Invalid JSON format')
        }

        const rowMap = new Map(this.rows.map((row) => [String(row.key), row]))
        let applied = 0
        let skipped = 0

        for (const [key, value] of Object.entries(incoming)) {
          const row = rowMap.get(String(key))
          if (!row) {
            skipped += 1
            continue
          }
          if (typeof value !== 'string') {
            skipped += 1
            continue
          }
          row.value = value.trim()
          applied += 1
        }

        for (const [key, value] of Object.entries(incomingIcons)) {
          const row = rowMap.get(String(key))
          if (!row) {
            skipped += 1
            continue
          }
          if (typeof value !== 'string') {
            skipped += 1
            continue
          }
          row.icon = value.trim() || row.icon
        }

        for (const [key, value] of Object.entries(incomingImages)) {
          const row = rowMap.get(String(key))
          if (!row) {
            skipped += 1
            continue
          }
          if (typeof value !== 'string') {
            skipped += 1
            continue
          }
          row.image = value.trim()
        }

        if (!applied) {
          this.message = 'Import loaded, but no matching keys were applied.'
          this.messageOk = false
        } else {
          this.message = `Imported ${applied} item(s). Click Save to apply.${skipped ? ` Skipped ${skipped}.` : ''}`
          this.messageOk = true
        }
      } catch (e) {
        console.error(e)
        this.message = `Import failed: ${e?.message || 'Invalid file'}`
        this.messageOk = false
      } finally {
        if (event?.target) event.target.value = ''
      }
    },
    onImageError(event, key) {
      const img = event?.target
      if (!img || img.dataset.fallbackApplied === '1') return
      img.dataset.fallbackApplied = '1'
      const row = this.rows.find((r) => r.key === String(key))
      const emoji = String(row?.icon || this.emojiMap[String(key)] || '🧩')
      img.src = makeEmojiFallbackDataUri(emoji)
    }
  },
  watch: {
    deck: {
      immediate: true,
      handler() {
        try {
          this.loadRows()
        } catch (e) {
          console.error(e)
          this.rows = []
          this.message = 'Failed to load deck.'
          this.messageOk = false
        }
      }
    }
  }
}
</script>
