<template>
  <header class="mb-4">
    <div class="flex items-center gap-3">
      <!-- Hamburger for mobile -->
      <button
        @click="$emit('toggle-drawer')"
        class="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors"
        aria-label="Menu"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <!-- Mobile brand (desktop brand is in sidebar) -->
      <div class="md:hidden flex-1">
        <div class="brand-mark inline-block">
          <div class="brand-title">MNEMONIC</div>
          <div class="brand-subtitle">Training Console</div>
        </div>
      </div>

      <!-- Sync dot + Shortcuts button -->
      <div class="flex items-center gap-2 ml-auto md:ml-0">
        <span
          v-if="syncStatus !== 'neutral'"
          class="inline-block h-2.5 w-2.5 rounded-full shrink-0 transition-colors"
          :class="syncDotClass"
          :title="syncDotTitle"
        ></span>
        <button
          class="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-900/20 px-2 py-1 text-xs font-semibold text-amber-200"
          @click="$emit('toggle-shortcuts')"
          v-tooltip="'Keyboard shortcuts help (Shift+/)'"
        >
          <span>⌨</span>
          <span class="hidden sm:inline">Shortcuts</span>
        </button>
      </div>
    </div>

    <!-- Breadcrumb bar -->
    <div v-if="breadcrumbs.length > 1" class="mt-2 px-1 flex items-center gap-1 text-xs text-slate-500 overflow-x-auto">
      <template v-for="(crumb, i) in breadcrumbs" :key="i">
        <button
          v-if="i < breadcrumbs.length - 1"
          @click="$emit('breadcrumb-navigate', crumb)"
          class="hover:text-slate-300 transition-colors whitespace-nowrap min-h-[28px]"
        >{{ crumb.label }}</button>
        <span v-else class="text-slate-300 whitespace-nowrap">{{ crumb.label }}</span>
        <span v-if="i < breadcrumbs.length - 1" class="text-slate-700">›</span>
      </template>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header',
  props: {
    breadcrumbs: { type: Array, default: () => [] },
    syncStatus: { type: String, default: 'neutral' },
  },
  emits: ['toggle-shortcuts', 'toggle-drawer', 'breadcrumb-navigate'],
  computed: {
    syncDotClass() {
      if (this.syncStatus === 'info') return 'bg-sky-400 animate-pulse'
      if (this.syncStatus === 'success') return 'bg-emerald-400'
      if (this.syncStatus === 'error') return 'bg-rose-400'
      return ''
    },
    syncDotTitle() {
      if (this.syncStatus === 'info') return 'Syncing...'
      if (this.syncStatus === 'success') return 'Synced'
      if (this.syncStatus === 'error') return 'Sync failed'
      return ''
    },
  },
}
</script>

<style scoped>
.brand-mark {
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.45);
  border-radius: 8px;
  padding: 0.35rem 0.5rem;
  line-height: 1.1;
}

.brand-title {
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  color: #e2e8f0;
}

.brand-subtitle {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #94a3b8;
}
</style>
