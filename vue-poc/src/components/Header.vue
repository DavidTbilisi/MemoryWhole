<template>
  <header class="mb-4 flex items-center justify-between">
    <div class="hidden md:block font-extrabold text-lg bg-gradient-to-r from-purple-600 to-cyan-400 bg-clip-text text-transparent">Mnemonic Training</div>
    <div class="md:hidden"></div>
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
  },
  mounted() {
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
    if (typeof this.unlistenAuth === 'function') this.unlistenAuth()
  },
  methods: {
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
