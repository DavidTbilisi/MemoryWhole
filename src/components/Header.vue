<template>
  <header class="mb-4 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
    <div class="hidden md:flex items-center">
      <div class="brand-mark">
        <div class="brand-title">MNEMONIC</div>
        <div class="brand-subtitle">Training Console</div>
      </div>
    </div>

    <div class="flex justify-center">
      <div ref="themeMenuRoot" class="relative inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/50 px-2 py-1">
        <span class="text-[11px] uppercase tracking-wider text-slate-400">Theme</span>
        <button
          class="inline-flex items-center gap-2 rounded bg-slate-800 px-2 py-1 text-xs text-slate-100 outline-none"
          @click="toggleThemeMenu"
          v-tooltip="'Switch app theme'"
        >
          <span>{{ selectedThemeLabel }}</span>
          <span class="inline-flex items-center gap-1">
            <span
              v-for="(swatch, idx) in selectedThemeSwatches"
              :key="`selected-swatch-${idx}`"
              class="h-2.5 w-2.5 rounded-full border border-slate-700/80"
              :style="{ backgroundColor: swatch }"
            ></span>
          </span>
        </button>

        <div v-if="themeMenuOpen" class="absolute right-0 top-[calc(100%+0.35rem)] z-20 w-64 rounded-lg border border-slate-700/80 bg-slate-900/95 p-2 shadow-2xl backdrop-blur">
          <div class="mb-1 px-1 text-[11px] uppercase tracking-wider text-slate-400">Dark</div>
          <button
            v-for="theme in darkThemeOptions"
            :key="theme.id"
            class="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-slate-800"
            :class="theme.id === selectedTheme ? 'bg-slate-800 text-white' : 'text-slate-200'"
            @click="selectTheme(theme.id)"
          >
            <span>{{ theme.label }}</span>
            <span class="inline-flex items-center gap-1">
              <span
                v-for="(swatch, idx) in themeSwatches(theme.id)"
                :key="`${theme.id}-dark-${idx}`"
                class="h-2.5 w-2.5 rounded-full border border-slate-700/80"
                :style="{ backgroundColor: swatch }"
              ></span>
            </span>
          </button>

          <div class="my-1 border-t border-slate-700/70"></div>
          <div class="mb-1 px-1 text-[11px] uppercase tracking-wider text-slate-400">Light</div>
          <button
            v-for="theme in lightThemeOptions"
            :key="theme.id"
            class="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-slate-800"
            :class="theme.id === selectedTheme ? 'bg-slate-800 text-white' : 'text-slate-200'"
            @click="selectTheme(theme.id)"
          >
            <span>{{ theme.label }}</span>
            <span class="inline-flex items-center gap-1">
              <span
                v-for="(swatch, idx) in themeSwatches(theme.id)"
                :key="`${theme.id}-light-${idx}`"
                class="h-2.5 w-2.5 rounded-full border border-slate-700/80"
                :style="{ backgroundColor: swatch }"
              ></span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-col items-end gap-1">
      <div v-if="!signedIn">
        <button
          class="px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold shadow disabled:opacity-70"
          :disabled="busy"
          @click="handleSignIn"
          v-tooltip="'Sign in with your Google account'"
        >
          {{ busy ? 'Signing in...' : 'Sign in with Google' }}
        </button>
      </div>
      <div v-else class="flex items-center gap-2">
        <span class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 text-xs font-bold text-slate-200 md:hidden">{{ userInitials }}</span>
        <span class="hidden md:inline text-sm text-slate-200">{{ name }}</span>
        <button
          class="px-3 py-2 rounded-lg border border-slate-700 text-slate-200 disabled:opacity-70"
          :disabled="busy"
          @click="handleSignOut"
          v-tooltip="'Sign out of your account'"
        >
          {{ busy ? 'Working...' : 'Sign out' }}
        </button>
      </div>
      <div v-if="statusText" :class="['text-xs', statusClass]">{{ statusText }}</div>
    </div>
  </header>
</template>

<script>
import { onAuthUserChanged, signInWithGoogle, signOutUser } from '../core/firebase-auth'
import { syncCloudForCurrentUser } from '../core/firebase-sync'
import { THEME_OPTIONS, applyTheme, getSavedTheme, getThemeSwatches } from '../core/theme'

export default {
  name: 'Header',
  data() {
    return {
      signedIn: false,
      name: '',
      busy: false,
      statusText: '',
      statusTone: 'neutral',
      unlistenAuth: null,
      themeOptions: THEME_OPTIONS,
      selectedTheme: getSavedTheme(),
      themeMenuOpen: false,
    }
  },
  computed: {
    userInitials() {
      const source = (this.name || '').trim()
      if (!source) return 'U'
      const parts = source.split(/\s+/).filter(Boolean)
      if (parts.length >= 2) {
        return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
      }
      const compact = source.replace(/[^a-zA-Z0-9]/g, '')
      return (compact.slice(0, 2) || 'U').toUpperCase()
    },
    statusClass() {
      if (this.statusTone === 'success') return 'text-emerald-300'
      if (this.statusTone === 'error') return 'text-rose-300'
      if (this.statusTone === 'info') return 'text-sky-300'
      return 'text-slate-400'
    },
    darkThemeOptions() {
      return this.themeOptions.filter((theme) => theme.id.startsWith('dark-'))
    },
    lightThemeOptions() {
      return this.themeOptions.filter((theme) => theme.id.startsWith('light-'))
    },
    selectedThemeLabel() {
      const found = this.themeOptions.find((theme) => theme.id === this.selectedTheme)
      return found ? found.label : this.selectedTheme
    },
    selectedThemeSwatches() {
      return getThemeSwatches(this.selectedTheme)
    },
  },
  mounted() {
    document.addEventListener('click', this.onDocumentClick)
    this.unlistenAuth = onAuthUserChanged(async (user) => {
      this.signedIn = !!user
      this.name = user?.displayName || user?.email || ''

      if (user) {
        this.busy = true
        this.statusText = 'Syncing cloud data...'
        this.statusTone = 'info'
        try {
          await syncCloudForCurrentUser()
          this.statusText = 'Synced'
          this.statusTone = 'success'
        } catch (err) {
          console.error(err)
          this.statusText = 'Sync failed. Local data is still available.'
          this.statusTone = 'error'
        }
      } else {
        this.statusText = ''
        this.statusTone = 'neutral'
      }

      this.busy = false
    })
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocumentClick)
    if (typeof this.unlistenAuth === 'function') this.unlistenAuth()
  },
  methods: {
    themeSwatches(themeId) {
      return getThemeSwatches(themeId)
    },
    toggleThemeMenu() {
      this.themeMenuOpen = !this.themeMenuOpen
    },
    selectTheme(themeId) {
      this.selectedTheme = applyTheme(themeId)
      this.themeMenuOpen = false
    },
    onDocumentClick(event) {
      if (!this.themeMenuOpen) return
      const root = this.$refs.themeMenuRoot
      if (!root || root.contains(event.target)) return
      this.themeMenuOpen = false
    },
    async handleSignIn() {
      if (this.busy) return
      this.busy = true
      try {
        await signInWithGoogle()
      } catch (err) {
        this.busy = false
        console.error(err)
        this.statusText = 'Google sign-in failed. Please try again.'
        this.statusTone = 'error'
      }
    },
    async handleSignOut() {
      if (this.busy) return
      this.busy = true
      try {
        await signOutUser()
        this.statusText = ''
        this.statusTone = 'neutral'
      } catch (err) {
        this.busy = false
        console.error(err)
        this.statusText = 'Sign-out failed. Please try again.'
        this.statusTone = 'error'
      }
    },
  },
}
</script>

<style scoped>
.brand-mark {
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.45);
  border-radius: 10px;
  padding: 0.42rem 0.62rem;
  line-height: 1.1;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.3), 0 8px 22px rgba(2, 6, 23, 0.2);
}

.brand-title {
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  color: #e2e8f0;
}

.brand-subtitle {
  margin-top: 0.12rem;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #94a3b8;
}
</style>
