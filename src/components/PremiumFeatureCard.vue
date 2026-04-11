<template>
  <div class="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-slate-900 via-[#1c1520] to-slate-950 p-5 text-slate-100">
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300">MNEMONIC Pro</div>
        <h3 class="mt-1 text-lg font-black">{{ title }}</h3>
      </div>
      <div class="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-100">
        {{ badge }}
      </div>
    </div>

    <p class="mt-3 text-sm leading-relaxed text-slate-300">{{ description }}</p>

    <ul v-if="items.length" class="mt-4 space-y-2 text-sm text-slate-200">
      <li v-for="item in items" :key="item" class="flex items-start gap-2">
        <span class="mt-0.5 text-amber-300">•</span>
        <span>{{ item }}</span>
      </li>
    </ul>

    <div class="mt-5 flex flex-wrap items-center gap-3">
      <button
        class="rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="disabled"
        @click="$emit(primaryAction)"
      >
        {{ actionLabel }}
      </button>
      <span v-if="hint" class="text-xs text-slate-400">{{ hint }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PremiumFeatureCard',
  props: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    items: { type: Array, default: () => [] },
    badge: { type: String, default: 'Premium' },
    actionLabel: { type: String, default: 'Upgrade to Pro' },
    hint: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    primaryAction: { type: String, default: 'upgrade' },
  },
  emits: ['upgrade', 'manage'],
}
</script>
