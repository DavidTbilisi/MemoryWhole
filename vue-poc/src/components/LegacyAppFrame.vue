<template>
  <section class="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
    <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-xs text-slate-400">
      <span>Legacy MemoryWhole (full parity)</span>
      <a class="text-cyan-400 hover:text-cyan-300" href="/legacy/index.html" target="_blank" rel="noopener">Open in new tab</a>
    </div>
    <iframe
      src="/legacy/index.html"
      title="MemoryWhole Legacy App"
      class="w-full h-[85vh] bg-slate-950"
    />
  </section>
</template>

<script>
export default {
  name: 'LegacyAppFrame'
}
</script>
