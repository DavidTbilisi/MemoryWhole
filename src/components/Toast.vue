<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl pointer-events-auto"
          :class="toastClass(toast.type)"
        >
          <span class="text-base leading-none shrink-0">{{ toastIcon(toast.type) }}</span>
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'Toast',
  data() {
    return {
      toasts: [],
      nextId: 0,
    }
  },
  mounted() {
    window.addEventListener('mnemonic-toast', this.onToast)
  },
  beforeUnmount() {
    window.removeEventListener('mnemonic-toast', this.onToast)
  },
  methods: {
    onToast(event) {
      const { message, type = 'success', duration = 3000 } = event.detail
      const id = this.nextId++
      this.toasts.push({ id, message, type })
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id)
      }, duration)
    },
    toastClass(type) {
      if (type === 'success') return 'bg-slate-900 border-emerald-500/40 text-emerald-300'
      if (type === 'cloud')   return 'bg-slate-900 border-cyan-500/40 text-cyan-300'
      if (type === 'error')   return 'bg-slate-900 border-rose-500/40 text-rose-300'
      return 'bg-slate-900 border-slate-600 text-slate-200'
    },
    toastIcon(type) {
      if (type === 'success') return '✓'
      if (type === 'cloud')   return '☁'
      if (type === 'error')   return '✕'
      return 'ℹ'
    },
  },
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.2s ease-out; }
.toast-leave-active { transition: all 0.25s ease-in; }
.toast-enter-from  { opacity: 0; transform: translateY(8px) scale(0.97); }
.toast-leave-to    { opacity: 0; transform: translateY(4px) scale(0.97); }
</style>
