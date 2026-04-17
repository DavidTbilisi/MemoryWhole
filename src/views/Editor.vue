<template>
  <div class="rounded-2xl border border-slate-700/70 bg-gradient-to-b from-[#0b1b2b] to-[#071421] p-4 text-sky-100 md:p-5">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold">Edit Deck - {{ title }}</h2>
        <span v-if="hasUnsavedChanges" class="rounded-full border border-amber-500/60 bg-amber-950/40 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
          Unsaved ({{ dirtyCount }})
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button class="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm" @click="triggerImport" v-tooltip="'Load edited deck from JSON file (I)'">Import</button>
        <button class="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm" @click="downloadTemplate" v-tooltip="'Download template JSON for bulk editing (T)'">Template</button>
        <button class="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm" @click="exportNow" v-tooltip="'Export current deck as JSON file (E)'">Export</button>
        <button class="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm" @click="resetToBase" v-tooltip="'Reset to default deck values'">Reset</button>
        <button class="rounded-lg border border-cyan-600 bg-cyan-900/30 px-3 py-2 text-sm" @click="save" v-tooltip="'Save changes to IndexedDB (Ctrl/Cmd+S)'">Save</button>
        <button class="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white" @click="handleBack" v-tooltip="'Return to home (B or H)'">Back</button>
      </div>
    </div>

    <div class="mb-3 text-sm text-slate-400">Edit associations and image paths/URLs, then click Save to apply changes across quiz, preview, and dashboard. Tip: local files can use paths like /deck-images/major/00.webp.</div>

    <div class="mb-3 rounded-xl border border-slate-700/70 bg-slate-900/35 p-3">
      <div class="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by key, value, icon, or image..."
          class="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
        />
        <select
          v-model="rowFilter"
          class="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
        >
          <option value="all">All rows</option>
          <option value="modified">Modified only</option>
          <option value="missing-image">Missing image</option>
          <option value="invalid-image">Invalid image</option>
        </select>
        <div class="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
          Showing <span class="font-semibold text-slate-200">{{ visibleDisplayRows }}</span> / {{ totalDisplayRows }}
        </div>
        <div class="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
          Dirty <span class="font-semibold text-amber-200">{{ dirtyCount }}</span>
        </div>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-2">
        <button class="rounded border border-slate-600 px-2.5 py-1 text-xs text-slate-200 disabled:opacity-40" @click="undo" :disabled="!canUndo">Undo</button>
        <button class="rounded border border-slate-600 px-2.5 py-1 text-xs text-slate-200 disabled:opacity-40" @click="redo" :disabled="!canRedo">Redo</button>
        <button class="rounded border border-amber-700/70 px-2.5 py-1 text-xs text-amber-200 disabled:opacity-40" @click="jumpModified(-1)" :disabled="!modifiedKeys.length">Prev changed</button>
        <button class="rounded border border-amber-700/70 px-2.5 py-1 text-xs text-amber-200 disabled:opacity-40" @click="jumpModified(1)" :disabled="!modifiedKeys.length">Next changed</button>
        <button class="rounded border border-slate-600 px-2.5 py-1 text-xs text-slate-200 disabled:opacity-40" @click="bulkClearImages" :disabled="!visibleEditableRows.length">Clear images (visible)</button>
        <button class="rounded border border-slate-600 px-2.5 py-1 text-xs text-slate-200 disabled:opacity-40" @click="bulkRevertVisible" :disabled="!visibleEditableRows.some((r) => isRowModified(r))">Revert visible modified</button>
      </div>
    </div>

    <input ref="importInput" type="file" accept="application/json,.json" class="hidden" @change="onImportFile" />
    <input ref="uploadInput" type="file" accept="image/*" class="hidden" @change="onUploadFile" />

    <div ref="tableWrap" class="overflow-auto rounded-lg border border-slate-700">
      <table class="w-full border-collapse text-sm">
        <thead v-if="!isPaoDeck" class="sticky top-0 bg-slate-900/70">
          <tr>
            <th class="w-28 border border-slate-700 p-2 text-left">Key</th>
            <th class="border border-slate-700 p-2 text-left">Association</th>
            <th class="w-28 border border-slate-700 p-2 text-left">Icon</th>
            <th class="w-[280px] border border-slate-700 p-2 text-left">Image URL / Path</th>
            <th class="w-24 border border-slate-700 p-2 text-left">Preview</th>
          </tr>
        </thead>
        <tbody v-if="!isPaoDeck">
          <tr
            v-for="row in filteredRows"
            :key="row.key"
            :data-row-key="row.key"
            class="odd:bg-slate-900/30"
            :class="isRowModified(row) ? 'ring-1 ring-inset ring-amber-500/50 bg-amber-950/10' : ''"
          >
            <td class="border border-slate-700 p-2 text-slate-300">
              <div class="flex items-start justify-between gap-1">
                <span>{{ row.key }}</span>
                <span v-if="rowDueLabel(row.key)" :class="rowDueTone(row.key)" class="text-[10px] leading-none mt-0.5 shrink-0">{{ rowDueLabel(row.key) }}</span>
              </div>
            </td>
            <td class="border border-slate-700 p-2">
              <input
                v-model="row.value"
                @input="onFieldInput(row, 'value')"
                type="text"
                class="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
              />
            </td>
            <td class="border border-slate-700 p-2">
              <div class="flex items-center gap-2">
                <input
                  v-model="row.icon"
                  @input="onFieldInput(row, 'icon')"
                  type="text"
                  class="w-14 rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-center text-lg text-slate-100 outline-none focus:border-cyan-500"
                />
                <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="resetIcon(row)" v-tooltip="'Reset to default icon'">Reset</button>
              </div>
            </td>
            <td class="border border-slate-700 p-2" @dragover.prevent="onDragOver" @drop.prevent="onDropImage(row, $event)">
              <input
                v-model="row.image"
                @input="onImageInput(row)"
                type="text"
                class="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
              />
              <div class="mt-1 flex items-center gap-2">
                <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="triggerUpload(row.key)" v-tooltip="'Upload image file'">Upload</button>
                <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="clearImage(row)" v-tooltip="'Clear image URL'">Clear</button>
                <button class="rounded border border-amber-700/70 px-2 py-0.5 text-xs text-amber-200" @click="revertRow(row)" :disabled="!isRowModified(row)" v-tooltip="'Revert this row to last saved values'">Revert</button>
                <span class="text-[11px] text-slate-500">drop image here</span>
              </div>
            </td>
            <td class="border border-slate-700 p-2">
              <img :src="row.image" alt="" class="h-12 w-16 rounded border border-slate-700 object-cover" @error="onImageError($event, row.key)" />
            </td>
          </tr>
        </tbody>
        <thead v-else class="sticky top-0 bg-slate-900/70">
          <tr>
            <th class="w-12 border border-slate-700 p-2 text-center">#</th>
            <th class="border border-slate-700 p-2 text-left">Person</th>
            <th class="border border-slate-700 p-2 text-left">Action</th>
            <th class="border border-slate-700 p-2 text-left">Object</th>
          </tr>
        </thead>
        <tbody v-if="isPaoDeck">
          <tr
            v-for="bundle in paoGridRows"
            :key="bundle.digit"
            :data-row-key="bundle.digit"
            class="odd:bg-slate-900/30 align-top"
          >
            <td class="border border-slate-700 p-2 text-center font-semibold text-slate-300">{{ bundle.digit }}</td>
            <td class="border border-slate-700 p-2">
              <div class="space-y-2">
                <input
                  v-model="bundle.person.value"
                  @input="onFieldInput(bundle.person, 'value')"
                  type="text"
                  class="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                />
                <div class="flex items-center gap-2">
                  <input
                    v-model="bundle.person.icon"
                    @input="onFieldInput(bundle.person, 'icon')"
                    type="text"
                    class="w-14 rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-center text-lg text-slate-100 outline-none focus:border-cyan-500"
                  />
                  <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="resetIcon(bundle.person)">Reset</button>
                </div>
                <div @dragover.prevent="onDragOver" @drop.prevent="onDropImage(bundle.person, $event)">
                  <input
                    v-model="bundle.person.image"
                    @input="onImageInput(bundle.person)"
                    type="text"
                    class="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                  />
                  <div class="mt-1 flex items-center gap-2">
                    <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="triggerUpload(bundle.person.key)">Upload</button>
                    <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="clearImage(bundle.person)">Clear</button>
                    <button class="rounded border border-amber-700/70 px-2 py-0.5 text-xs text-amber-200" @click="revertRow(bundle.person)" :disabled="!isRowModified(bundle.person)">Revert</button>
                  </div>
                </div>
                <img :src="bundle.person.image" alt="" class="h-12 w-16 rounded border border-slate-700 object-cover" @error="onImageError($event, bundle.person.key)" />
              </div>
            </td>
            <td class="border border-slate-700 p-2">
              <div class="space-y-2">
                <input
                  v-model="bundle.action.value"
                  @input="onFieldInput(bundle.action, 'value')"
                  type="text"
                  class="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                />
                <div class="flex items-center gap-2">
                  <input
                    v-model="bundle.action.icon"
                    @input="onFieldInput(bundle.action, 'icon')"
                    type="text"
                    class="w-14 rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-center text-lg text-slate-100 outline-none focus:border-cyan-500"
                  />
                  <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="resetIcon(bundle.action)">Reset</button>
                </div>
                <div @dragover.prevent="onDragOver" @drop.prevent="onDropImage(bundle.action, $event)">
                  <input
                    v-model="bundle.action.image"
                    @input="onImageInput(bundle.action)"
                    type="text"
                    class="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                  />
                  <div class="mt-1 flex items-center gap-2">
                    <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="triggerUpload(bundle.action.key)">Upload</button>
                    <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="clearImage(bundle.action)">Clear</button>
                    <button class="rounded border border-amber-700/70 px-2 py-0.5 text-xs text-amber-200" @click="revertRow(bundle.action)" :disabled="!isRowModified(bundle.action)">Revert</button>
                  </div>
                </div>
                <img :src="bundle.action.image" alt="" class="h-12 w-16 rounded border border-slate-700 object-cover" @error="onImageError($event, bundle.action.key)" />
              </div>
            </td>
            <td class="border border-slate-700 p-2">
              <div class="space-y-2">
                <input
                  v-model="bundle.object.value"
                  @input="onFieldInput(bundle.object, 'value')"
                  type="text"
                  class="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                />
                <div class="flex items-center gap-2">
                  <input
                    v-model="bundle.object.icon"
                    @input="onFieldInput(bundle.object, 'icon')"
                    type="text"
                    class="w-14 rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-center text-lg text-slate-100 outline-none focus:border-cyan-500"
                  />
                  <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="resetIcon(bundle.object)">Reset</button>
                </div>
                <div @dragover.prevent="onDragOver" @drop.prevent="onDropImage(bundle.object, $event)">
                  <input
                    v-model="bundle.object.image"
                    @input="onImageInput(bundle.object)"
                    type="text"
                    class="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                  />
                  <div class="mt-1 flex items-center gap-2">
                    <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="triggerUpload(bundle.object.key)">Upload</button>
                    <button class="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" @click="clearImage(bundle.object)">Clear</button>
                    <button class="rounded border border-amber-700/70 px-2 py-0.5 text-xs text-amber-200" @click="revertRow(bundle.object)" :disabled="!isRowModified(bundle.object)">Revert</button>
                  </div>
                </div>
                <img :src="bundle.object.image" alt="" class="h-12 w-16 rounded border border-slate-700 object-cover" @error="onImageError($event, bundle.object.key)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!visibleEditableRows.length" class="p-4 text-sm text-slate-400">No rows match current search/filter.</div>
    </div>

    <div v-if="message" class="mt-3 text-sm" :class="messageOk ? 'text-emerald-300' : 'text-rose-300'">{{ message }}</div>

    <div class="mt-3 rounded-xl border border-slate-700/70 bg-slate-900/45 px-3 py-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Quick Commands</div>
        <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span class="rounded border border-slate-700 px-1.5 py-0.5">Ctrl/Cmd+Z</span>
          <span>Undo</span>
          <span class="rounded border border-slate-700 px-1.5 py-0.5">Ctrl/Cmd+Shift+Z</span>
          <span>Redo</span>
          <span class="rounded border border-slate-700 px-1.5 py-0.5">Ctrl/Cmd+S</span>
          <span>Save</span>
        </div>
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <button class="rounded border border-slate-600 px-2.5 py-1 text-xs text-slate-200 disabled:opacity-40" @click="undo" :disabled="!canUndo">Undo</button>
        <button class="rounded border border-slate-600 px-2.5 py-1 text-xs text-slate-200 disabled:opacity-40" @click="redo" :disabled="!canRedo">Redo</button>
        <button class="rounded border border-cyan-700/70 px-2.5 py-1 text-xs text-cyan-200" @click="save">Save now</button>
        <button class="rounded border border-amber-700/70 px-2.5 py-1 text-xs text-amber-200 disabled:opacity-40" @click="jumpModified(1)" :disabled="!modifiedKeys.length">Next changed</button>
        <button class="rounded border border-slate-600 px-2.5 py-1 text-xs text-slate-200 disabled:opacity-40" @click="bulkRevertVisible" :disabled="!visibleEditableRows.some((r) => isRowModified(r))">Revert visible</button>
      </div>
    </div>
  </div>
</template>

<script>
import { DECKS } from '../data/decks'
import { exportDeckPayload, getDeckBaseDataSync, getDeckDefaultIconsSync, getDeckDefaultImagesSync, getDeckIconsSync, getDeckImagesSync, makeEmojiFallbackDataUri, saveDeckEdits, saveDeckIconEdits, saveDeckImageEdits } from '../core/deck-loader'
import { getDeckReviewState } from '../core/spaced-repetition'
import { getCurrentUser } from '../core/firebase-auth'
import { syncCloudForCurrentUser } from '../core/firebase-sync'

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
      searchQuery: '',
      rowFilter: 'all',
      originalRowsMap: {},
      invalidImageMap: {},
      undoStack: [],
      redoStack: [],
      suppressHistory: false,
      modifiedCursor: -1,
      historyCommitTimer: null,
      historyCommitDelayMs: 180,
      reviewMap: {},
    }
  },
  computed: {
    isPaoDeck() {
      return this.deck === 'pao'
    },
    title() {
      return DECKS.find((d) => d.deck === this.deck)?.name || this.deck
    },
    filteredRows() {
      const query = String(this.searchQuery || '').trim().toLowerCase()
      return this.rows.filter((row) => {
        if (this.rowFilter === 'modified' && !this.isRowModified(row)) return false
        if (this.rowFilter === 'missing-image' && !this.isMissingImage(row)) return false
        if (this.rowFilter === 'invalid-image' && !this.isInvalidImage(row)) return false

        if (!query) return true
        return [row.key, row.value, row.icon, row.image]
          .map((v) => String(v || '').toLowerCase())
          .some((v) => v.includes(query))
      })
    },
    paoGridRows() {
      const rowMap = new Map(this.rows.map((row) => [String(row.key), row]))
      const query = String(this.searchQuery || '').trim().toLowerCase()
      return Array.from({ length: 10 }, (_, digit) => {
        const key = String(digit)
        return {
          digit: key,
          person: rowMap.get(`P${key}`),
          action: rowMap.get(`A${key}`),
          object: rowMap.get(`O${key}`),
        }
      }).filter((bundle) => {
        const parts = [bundle.person, bundle.action, bundle.object].filter(Boolean)
        if (!parts.length) return false
        if (this.rowFilter === 'modified' && !parts.some((row) => this.isRowModified(row))) return false
        if (this.rowFilter === 'missing-image' && !parts.some((row) => this.isMissingImage(row))) return false
        if (this.rowFilter === 'invalid-image' && !parts.some((row) => this.isInvalidImage(row))) return false
        if (!query) return true
        return parts.some((row) => [row.key, row.value, row.icon, row.image]
          .map((value) => String(value || '').toLowerCase())
          .some((value) => value.includes(query)))
      })
    },
    visibleEditableRows() {
      if (!this.isPaoDeck) return this.filteredRows
      return this.paoGridRows.flatMap((bundle) => [bundle.person, bundle.action, bundle.object].filter(Boolean))
    },
    visibleDisplayRows() {
      return this.isPaoDeck ? this.paoGridRows.length : this.filteredRows.length
    },
    totalDisplayRows() {
      return this.isPaoDeck ? 10 : this.rows.length
    },
    dirtyCount() {
      return this.rows.reduce((count, row) => count + (this.isRowModified(row) ? 1 : 0), 0)
    },
    hasUnsavedChanges() {
      return this.dirtyCount > 0
    },
    canUndo() {
      return this.undoStack.length > 1
    },
    canRedo() {
      return this.redoStack.length > 0
    },
    modifiedKeys() {
      return this.rows.filter((row) => this.isRowModified(row)).map((row) => String(row.key))
    },
  },
  mounted() {
    window.addEventListener('beforeunload', this.onBeforeUnload)
    window.addEventListener('keydown', this.onGlobalKeyDown)
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload)
    window.removeEventListener('keydown', this.onGlobalKeyDown)
  },
  methods: {
    rowDueLabel(key) {
      const item = this.reviewMap[String(key)]
      if (!item || !item.nextDueAt) return ''
      const diffMs = item.nextDueAt - Date.now()
      const diffDays = Math.round(diffMs / 86400000)
      if (diffDays <= 0) return 'due'
      return `in ${diffDays}d`
    },
    rowDueTone(key) {
      const item = this.reviewMap[String(key)]
      if (!item || !item.nextDueAt) return ''
      const diffMs = item.nextDueAt - Date.now()
      const diffDays = Math.round(diffMs / 86400000)
      if (diffDays <= 0) return 'text-rose-400'
      if (diffDays <= 3) return 'text-amber-400'
      return 'text-slate-500'
    },
    snapshotRows() {
      return JSON.stringify(this.rows.map((row) => ({
        key: String(row.key),
        value: this.normalizeCell(row.value),
        icon: this.normalizeCell(row.icon),
        image: this.normalizeCell(row.image),
      })))
    },
    applySnapshot(snapshot) {
      let parsed = []
      try {
        parsed = JSON.parse(snapshot)
      } catch {
        return
      }
      const map = new Map(parsed.map((row) => [String(row.key), row]))
      this.suppressHistory = true
      for (const row of this.rows) {
        const next = map.get(String(row.key))
        if (!next) continue
        row.value = this.normalizeCell(next.value)
        row.icon = this.normalizeCell(next.icon)
        row.image = this.normalizeCell(next.image)
        this.clearInvalidFlag(row.key)
      }
      this.suppressHistory = false
    },
    initHistory() {
      this.undoStack = [this.snapshotRows()]
      this.redoStack = []
      this.modifiedCursor = -1
    },
    pushHistory() {
      if (this.suppressHistory) return
      const snapshot = this.snapshotRows()
      if (this.undoStack[this.undoStack.length - 1] === snapshot) return
      this.undoStack.push(snapshot)
      if (this.undoStack.length > 120) this.undoStack.shift()
      this.redoStack = []
    },
    undo() {
      if (!this.canUndo) return
      const current = this.undoStack.pop()
      this.redoStack.push(current)
      this.applySnapshot(this.undoStack[this.undoStack.length - 1])
    },
    redo() {
      if (!this.canRedo) return
      const next = this.redoStack.pop()
      this.undoStack.push(next)
      this.applySnapshot(next)
    },
    onGlobalKeyDown(event) {
      const key = String(event.key || '').toLowerCase()
      const withMod = event.ctrlKey || event.metaKey
      if (!withMod) return
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        this.undo()
        return
      }
      if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault()
        this.redo()
      }
    },
    onFieldInput() {
      this.pushHistory()
    },
    jumpModified(direction) {
      const keys = this.modifiedKeys
      if (!keys.length) return
      if (this.modifiedCursor < 0 || this.modifiedCursor >= keys.length) {
        this.modifiedCursor = direction > 0 ? 0 : keys.length - 1
      } else {
        this.modifiedCursor = (this.modifiedCursor + direction + keys.length) % keys.length
      }
      const key = this.isPaoDeck ? String(keys[this.modifiedCursor]).slice(-1) : keys[this.modifiedCursor]
      const selectorKey = String(key).replace(/"/g, '\\"')
      const rowEl = this.$refs.tableWrap?.querySelector(`[data-row-key="${selectorKey}"]`)
      if (rowEl) rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
    bulkClearImages() {
      if (!this.visibleEditableRows.length) return
      const ok = window.confirm(`Clear image path for ${this.visibleEditableRows.length} visible row(s)?`)
      if (!ok) return
      for (const row of this.visibleEditableRows) {
        row.image = ''
        this.clearInvalidFlag(row.key)
      }
      this.pushHistory()
    },
    bulkRevertVisible() {
      const target = this.visibleEditableRows.filter((row) => this.isRowModified(row))
      if (!target.length) return
      const ok = window.confirm(`Revert ${target.length} visible modified row(s)?`)
      if (!ok) return
      this.suppressHistory = true
      for (const row of target) {
        const original = this.originalRowsMap[String(row.key)]
        if (!original) continue
        row.value = original.value
        row.icon = original.icon
        row.image = original.image
        this.clearInvalidFlag(row.key)
      }
      this.suppressHistory = false
      this.pushHistory()
    },
    normalizeCell(value) {
      return String(value ?? '').trim()
    },
    snapshotOriginalRows() {
      const map = {}
      for (const row of this.rows) {
        map[String(row.key)] = {
          value: this.normalizeCell(row.value),
          icon: this.normalizeCell(row.icon),
          image: this.normalizeCell(row.image),
        }
      }
      this.originalRowsMap = map
    },
    isRowModified(row) {
      const original = this.originalRowsMap[String(row.key)]
      if (!original) return false
      return this.normalizeCell(row.value) !== original.value
        || this.normalizeCell(row.icon) !== original.icon
        || this.normalizeCell(row.image) !== original.image
    },
    isMissingImage(row) {
      return !this.normalizeCell(row.image)
    },
    isInvalidImage(row) {
      return !!this.invalidImageMap[String(row.key)]
    },
    clearInvalidFlag(key) {
      if (this.invalidImageMap[String(key)]) {
        const next = { ...this.invalidImageMap }
        delete next[String(key)]
        this.invalidImageMap = next
      }
    },
    onImageInput(row) {
      this.clearInvalidFlag(row.key)
      this.pushHistory()
    },
    revertRow(row) {
      const original = this.originalRowsMap[String(row.key)]
      if (!original) return
      row.value = original.value
      row.icon = original.icon
      row.image = original.image
      this.clearInvalidFlag(row.key)
      this.pushHistory()
    },
    onBeforeUnload(event) {
      if (!this.hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    },
    handleBack() {
      if (this.hasUnsavedChanges) {
        const ok = window.confirm('You have unsaved changes. Leave without saving?')
        if (!ok) return
      }
      this.$emit('back')
    },
    loadRows() {
      const payload = exportDeckPayload(this.deck)
      const current = payload.data || {}
      const images = payload.images || {}
      const icons = payload.icons || {}
      this.emojiMap = { ...icons }
      this.rows = Object.entries(current)
        .sort(([a], [b]) => byDeckKey(a, b))
        .map(([key, value]) => ({
          key: String(key),
          value: String(value ?? ''),
          icon: String(icons[String(key)] || '🧩'),
          image: String(images[String(key)] || ''),
        }))
      this.invalidImageMap = {}
      this.snapshotOriginalRows()
      this.initHistory()
      this.message = ''
      this.reviewMap = getDeckReviewState(this.deck)
    },
    async save() {
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
      this.snapshotOriginalRows()
      this.initHistory()

      window.dispatchEvent(new CustomEvent('mnemonic-toast', { detail: { message: 'Saved', type: 'success' } }))
      this.message = 'Saved changes'
      this.messageOk = true

      if (getCurrentUser()) {
        try {
          await syncCloudForCurrentUser()
          window.dispatchEvent(new CustomEvent('mnemonic-toast', { detail: { message: 'Synced with cloud', type: 'cloud', duration: 2500 } }))
        } catch (err) {
          console.error('Cloud sync after save failed', err)
          window.dispatchEvent(new CustomEvent('mnemonic-toast', { detail: { message: 'Cloud sync failed', type: 'error' } }))
        }
      }
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
      this.invalidImageMap = {}
      this.pushHistory()
      this.message = 'Reset to base values, default icons, and default images. Click Save to apply.'
      this.messageOk = true
    },
    resetIcon(row) {
      const defaults = getDeckDefaultIconsSync(this.deck)
      row.icon = String(defaults[String(row.key)] || '🧩')
      this.pushHistory()
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
      this.clearInvalidFlag(row.key)
      this.pushHistory()
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
        this.clearInvalidFlag(row.key)
        this.pushHistory()
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
        this.clearInvalidFlag(row.key)
        this.pushHistory()
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

        this.pushHistory()

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
      this.invalidImageMap = { ...this.invalidImageMap, [String(key)]: true }
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
