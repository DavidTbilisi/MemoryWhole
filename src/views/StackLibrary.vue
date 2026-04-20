<template>
  <div id="stack-library" class="bg-[#071421] p-4 md:p-6 rounded-xl text-sky-100 border border-slate-700/60 max-w-6xl mx-auto">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white">Stack library</h1>
        <p class="mt-2 text-sm text-slate-400 max-w-2xl">
          Train against the same families the LearningSystem atlas documents. Open canonical markdown for depth; start drills here in MemoryWhole.
        </p>
        <p class="mt-1 text-xs text-slate-500">
          Atlas docs base: <span class="text-cyan-600/90 break-all">{{ atlasBase }}</span>
        </p>
      </div>
      <button
        type="button"
        class="rounded-xl border border-cyan-500/50 bg-cyan-950/40 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-900/50"
        @click="$emit('back')"
      >← Home</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <article
        v-for="mod in modules"
        :key="mod.id"
        class="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4 flex flex-col gap-3"
      >
        <div>
          <h2 class="text-lg font-bold text-white">{{ mod.title }}</h2>
          <div class="mt-1 flex flex-wrap gap-1">
            <span v-for="t in mod.tags" :key="t" class="text-[10px] font-semibold rounded px-1.5 py-0.5 bg-slate-800 text-cyan-300/90">{{ t }}</span>
          </div>
        </div>

        <div class="text-xs text-slate-400 space-y-1">
          <div class="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Reference</div>
          <ul class="list-disc list-inside space-y-0.5">
            <li v-for="link in mod.docLinks" :key="link.href">
              <a
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="text-cyan-400 hover:underline break-all"
              >{{ link.label }}</a>
            </li>
          </ul>
        </div>

        <div v-if="mod.decks.length" class="mt-auto pt-2 border-t border-slate-700/50">
          <div class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Drills</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="d in mod.decks"
              :key="d.id"
              type="button"
              data-testid="stack-start-drill"
              class="rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-3 py-2 text-xs font-bold text-white shadow hover:brightness-110"
              @click="$emit('start-drill', d.id)"
            >▶ {{ d.name }}</button>
          </div>
        </div>
        <p v-else class="text-xs text-amber-200/80 mt-auto">Deck coming in a later milestone — use reference links above.</p>
      </article>
    </div>
  </div>
</template>

<script>
import { STACK_MANIFEST_MODULES, STACK_MANIFEST_ATLAS_BASE } from '../data/stack-manifest.generated.js'

export default {
  name: 'StackLibraryView',
  emits: ['back', 'start-drill'],
  data() {
    return {
      modules: STACK_MANIFEST_MODULES,
      atlasBase: STACK_MANIFEST_ATLAS_BASE,
    }
  },
}
</script>
