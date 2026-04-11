<template>
  <!-- Desktop Sidebar -->
  <nav class="hidden md:flex flex-col fixed left-0 top-0 h-screen w-52 bg-slate-900 border-r border-slate-700/50 z-30">
    <!-- Logo/Brand at top -->
    <div class="px-4 py-4 border-b border-slate-700/50">
      <div class="brand-mark">
        <div class="brand-title">MNEMONIC</div>
        <div class="brand-subtitle">Training Console</div>
      </div>
    </div>

    <!-- Main nav items -->
    <div class="flex-1 overflow-y-auto py-2 px-2 space-y-1">
      <button
        v-for="item in mainNavItems"
        :key="item.view"
        @click="$emit('navigate', item.view)"
        class="w-full min-h-[48px] flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors text-left"
        :class="isActive(item.view) ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'"
        :style="isActive(item.view) ? 'border-left: 2px solid var(--brand-1)' : 'border-left: 2px solid transparent'"
      >
        <span>{{ item.icon }}</span>
        <span class="text-sm">{{ item.label }}</span>
      </button>

      <!-- Deck-specific nav (only when activeDeck is set) -->
      <template v-if="activeDeck">
        <hr class="border-slate-700/50 my-2" />
        <div class="px-4 py-1 text-[10px] uppercase tracking-widest text-slate-500 truncate">
          {{ deckName }}
        </div>
        <button
          v-for="item in deckNavItems"
          :key="item.view"
          @click="$emit('navigate-deck', item.view, activeDeck)"
          class="w-full min-h-[48px] flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors text-left"
          :class="isActive(item.view) ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'"
          :style="isActive(item.view) ? 'border-left: 2px solid var(--brand-1)' : 'border-left: 2px solid transparent'"
        >
          <span>{{ item.icon }}</span>
          <span class="text-sm">{{ item.label }}</span>
        </button>
      </template>
    </div>

    <!-- Bottom section: theme + auth -->
    <div class="border-t border-slate-700/50 px-2 py-3 space-y-1">
      <!-- Theme picker -->
      <div>
        <button
          @click="themeExpanded = !themeExpanded"
          class="w-full min-h-[44px] flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
        >
          <span class="text-base">{{ isDark ? '🌙' : '☀️' }}</span>
          <span class="flex-1 text-sm text-left truncate">{{ selectedThemeLabel }}</span>
          <span class="text-[10px] text-slate-500">{{ themeExpanded ? '▲' : '▼' }}</span>
        </button>
        <div v-if="themeExpanded" class="mt-1 space-y-0.5 px-1">
          <div class="px-3 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">Dark</div>
          <button
            v-for="theme in darkThemeOptions"
            :key="theme.id"
            @click="selectTheme(theme.id)"
            class="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors"
            :class="theme.id === selectedTheme ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'"
          >
            <span>{{ theme.label }}</span>
            <span class="flex items-center gap-1">
              <span
                v-for="(swatch, idx) in themeSwatches(theme.id)"
                :key="idx"
                class="h-2.5 w-2.5 rounded-full border border-slate-700/80"
                :style="{ backgroundColor: swatch }"
              ></span>
            </span>
          </button>
          <div class="px-3 py-0.5 text-[10px] uppercase tracking-wider text-slate-500 mt-1">Light</div>
          <button
            v-for="theme in lightThemeOptions"
            :key="theme.id"
            @click="selectTheme(theme.id)"
            class="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors"
            :class="theme.id === selectedTheme ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'"
          >
            <span>{{ theme.label }}</span>
            <span class="flex items-center gap-1">
              <span
                v-for="(swatch, idx) in themeSwatches(theme.id)"
                :key="idx"
                class="h-2.5 w-2.5 rounded-full border border-slate-700/80"
                :style="{ backgroundColor: swatch }"
              ></span>
            </span>
          </button>
        </div>
      </div>

      <!-- Auth section -->
      <div class="pt-1 border-t border-slate-700/40">
        <div v-if="!signedIn">
          <button
            class="w-full min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold text-sm disabled:opacity-70 hover:bg-slate-100 transition-colors"
            :disabled="busy"
            @click="handleSignIn"
          >
            <span>🔑</span>
            <span>{{ busy ? 'Signing in...' : 'Sign in' }}</span>
          </button>
        </div>
        <div v-else ref="desktopAccountRoot">
          <button
            class="w-full min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 text-xs hover:bg-slate-800/50 transition-colors"
            @click="accountExpanded = !accountExpanded"
          >
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 shrink-0">{{ userInitials }}</span>
            <span class="flex-1 truncate text-left">{{ name }}</span>
            <span class="text-[10px] text-slate-500">{{ accountExpanded ? '▲' : '▼' }}</span>
          </button>
          <button
            v-if="accountExpanded"
            class="w-full min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-800/80 text-rose-200 text-xs disabled:opacity-70 hover:bg-rose-950/35 transition-colors"
            :disabled="busy"
            @click="handleSignOut"
          >
            <span>{{ busy ? 'Working...' : (signOutArmed ? 'Confirm sign out' : 'Sign out') }}</span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Mobile Bottom Tab Bar -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700/50 z-30 flex">
    <button
      v-for="item in mainNavItems"
      :key="item.view"
      @click="$emit('navigate', item.view)"
      class="flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors"
      :class="isActive(item.view) ? 'text-slate-100' : 'text-slate-400'"
    >
      <span class="text-lg leading-none">{{ item.icon }}</span>
      <span class="text-[10px] leading-tight">{{ item.label }}</span>
    </button>
  </nav>

  <!-- Mobile Drawer (when drawerOpen) -->
  <Teleport to="body">
    <div v-if="drawerOpen" class="md:hidden fixed inset-0 z-50">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60" @click="$emit('close-drawer')"></div>
      <!-- Panel -->
      <div class="absolute left-0 top-0 h-full w-72 bg-slate-900 shadow-2xl flex flex-col">
        <!-- Close button -->
        <button
          @click="$emit('close-drawer')"
          class="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors p-1"
        >✕</button>

        <!-- Logo/Brand at top -->
        <div class="px-4 py-4 border-b border-slate-700/50">
          <div class="brand-mark">
            <div class="brand-title">MNEMONIC</div>
            <div class="brand-subtitle">Training Console</div>
          </div>
        </div>

        <!-- Nav items -->
        <div class="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          <button
            v-for="item in mainNavItems"
            :key="item.view"
            @click="$emit('navigate', item.view); $emit('close-drawer')"
            class="w-full min-h-[48px] flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors text-left"
            :class="isActive(item.view) ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'"
            :style="isActive(item.view) ? 'border-left: 2px solid var(--brand-1)' : 'border-left: 2px solid transparent'"
          >
            <span>{{ item.icon }}</span>
            <span class="text-sm">{{ item.label }}</span>
          </button>

          <!-- Deck-specific nav in drawer -->
          <template v-if="activeDeck">
            <hr class="border-slate-700/50 my-2" />
            <div class="px-4 py-1 text-[10px] uppercase tracking-widest text-slate-500">
              {{ deckName }}
            </div>
            <button
              v-for="item in deckNavItems"
              :key="item.view"
              @click="$emit('navigate-deck', item.view, activeDeck); $emit('close-drawer')"
              class="w-full min-h-[48px] flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors text-left"
              :class="isActive(item.view) ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'"
              :style="isActive(item.view) ? 'border-left: 2px solid var(--brand-1)' : 'border-left: 2px solid transparent'"
            >
              <span>{{ item.icon }}</span>
              <span class="text-sm">{{ item.label }}</span>
            </button>
          </template>
        </div>

        <!-- Bottom section: theme + auth in drawer -->
        <div class="border-t border-slate-700/50 px-2 py-3 space-y-1">
          <!-- Theme picker -->
          <div>
            <button
              @click="themeExpanded = !themeExpanded"
              class="w-full min-h-[44px] flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
            >
              <span class="text-base">{{ isDark ? '🌙' : '☀️' }}</span>
              <span class="flex-1 text-sm text-left truncate">{{ selectedThemeLabel }}</span>
              <span class="text-[10px] text-slate-500">{{ themeExpanded ? '▲' : '▼' }}</span>
            </button>
            <div v-if="themeExpanded" class="mt-1 space-y-0.5 px-1">
              <div class="px-3 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">Dark</div>
              <button
                v-for="theme in darkThemeOptions"
                :key="theme.id"
                @click="selectTheme(theme.id)"
                class="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors"
                :class="theme.id === selectedTheme ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'"
              >
                <span>{{ theme.label }}</span>
                <span class="flex items-center gap-1">
                  <span
                    v-for="(swatch, idx) in themeSwatches(theme.id)"
                    :key="idx"
                    class="h-2.5 w-2.5 rounded-full border border-slate-700/80"
                    :style="{ backgroundColor: swatch }"
                  ></span>
                </span>
              </button>
              <div class="px-3 py-0.5 text-[10px] uppercase tracking-wider text-slate-500 mt-1">Light</div>
              <button
                v-for="theme in lightThemeOptions"
                :key="theme.id"
                @click="selectTheme(theme.id)"
                class="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors"
                :class="theme.id === selectedTheme ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'"
              >
                <span>{{ theme.label }}</span>
                <span class="flex items-center gap-1">
                  <span
                    v-for="(swatch, idx) in themeSwatches(theme.id)"
                    :key="idx"
                    class="h-2.5 w-2.5 rounded-full border border-slate-700/80"
                    :style="{ backgroundColor: swatch }"
                  ></span>
                </span>
              </button>
            </div>
          </div>

          <!-- Auth section in drawer -->
          <div class="pt-1 border-t border-slate-700/40">
            <div v-if="!signedIn">
              <button
                class="w-full min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold text-sm disabled:opacity-70 hover:bg-slate-100 transition-colors"
                :disabled="busy"
                @click="handleSignIn"
              >
                <span>🔑</span>
                <span>{{ busy ? 'Signing in...' : 'Sign in with Google' }}</span>
              </button>
            </div>
            <div v-else ref="drawerAccountRoot">
              <button
                class="w-full min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 text-xs hover:bg-slate-800/50 transition-colors"
                @click="drawerAccountExpanded = !drawerAccountExpanded"
              >
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 shrink-0">{{ userInitials }}</span>
                <span class="flex-1 truncate text-left">{{ name }}</span>
                <span class="text-[10px] text-slate-500">{{ drawerAccountExpanded ? '▲' : '▼' }}</span>
              </button>
              <button
                v-if="drawerAccountExpanded"
                class="w-full min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-800/80 text-rose-200 text-xs disabled:opacity-70 hover:bg-rose-950/35 transition-colors"
                :disabled="busy"
                @click="handleSignOut"
              >
                <span>{{ busy ? 'Working...' : (signOutArmed ? 'Confirm sign out' : 'Sign out') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { onAuthUserChanged, signInWithGoogle, signOutUser } from '../core/firebase-auth'
import { syncCloudForCurrentUser } from '../core/firebase-sync'
import { THEME_OPTIONS, applyTheme, getSavedTheme, getThemeSwatches } from '../core/theme.js'

export default {
  name: 'SideNav',
  props: {
    currentView: String,
    activeDeck: { type: Object, default: null },
    drawerOpen: { type: Boolean, default: false }
  },
  emits: ['navigate', 'navigate-deck', 'close-drawer', 'sync-status'],
  data() {
    return {
      // auth
      signedIn: false,
      name: '',
      busy: false,
      statusText: '',
      statusTone: 'neutral',
      unlistenAuth: null,
      signOutArmed: false,
      signOutArmTimer: null,
      accountExpanded: false,
      drawerAccountExpanded: false,
      // theme
      themeOptions: THEME_OPTIONS,
      selectedTheme: getSavedTheme(),
      themeExpanded: false,
      // nav
      mainNavItems: [
        { view: 'home', icon: '🏠', label: 'Home' },
        { view: 'training-log', icon: '📊', label: 'Training Log' },
        { view: 'ranking-info', icon: '🏆', label: 'Ranking' },
      ],
      deckNavItems: [
        { view: 'quiz-config', icon: '▶', label: 'Start Quiz' },
        { view: 'dashboard', icon: '📈', label: 'Dashboard' },
        { view: 'preview', icon: '👁', label: 'Preview' },
        { view: 'editor', icon: '✏️', label: 'Edit' },
      ],
    }
  },
  computed: {
    isDark() {
      return this.selectedTheme.startsWith('dark')
    },
    darkThemeOptions() {
      return this.themeOptions.filter(t => t.id.startsWith('dark-'))
    },
    lightThemeOptions() {
      return this.themeOptions.filter(t => t.id.startsWith('light-'))
    },
    selectedThemeLabel() {
      const found = this.themeOptions.find(t => t.id === this.selectedTheme)
      return found ? found.label : this.selectedTheme
    },
    userInitials() {
      const source = (this.name || '').trim()
      if (!source) return 'U'
      const parts = source.split(/\s+/).filter(Boolean)
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      const compact = source.replace(/[^a-zA-Z0-9]/g, '')
      return (compact.slice(0, 2) || 'U').toUpperCase()
    },
    deckName() {
      if (!this.activeDeck) return ''
      if (typeof this.activeDeck === 'string') return this.activeDeck
      return this.activeDeck.name || this.activeDeck.deck || 'Deck'
    },
  },
  watch: {
    statusTone(val) { this.$emit('sync-status', val) },
  },
  mounted() {
    document.addEventListener('click', this.onDocumentClick)
    this.unlistenAuth = onAuthUserChanged(async (user) => {
      this.signedIn = !!user
      this.name = user?.displayName || user?.email || ''
      if (user) {
        this.busy = true
        this.statusText = 'Syncing...'
        this.statusTone = 'info'
        try {
          await syncCloudForCurrentUser()
          this.statusText = 'Synced'
          this.statusTone = 'success'
        } catch (err) {
          console.error(err)
          this.statusText = 'Sync failed'
          this.statusTone = 'error'
        }
      } else {
        this.statusText = ''
        this.statusTone = 'neutral'
        this.signOutArmed = false
        this.accountExpanded = false
        this.drawerAccountExpanded = false
      }
      this.busy = false
    })
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocumentClick)
    if (typeof this.unlistenAuth === 'function') this.unlistenAuth()
    if (this.signOutArmTimer) clearTimeout(this.signOutArmTimer)
  },
  methods: {
    onDocumentClick(event) {
      const desktopRoot = this.$refs.desktopAccountRoot
      if (this.accountExpanded && desktopRoot && !desktopRoot.contains(event.target)) {
        this.accountExpanded = false
        this.signOutArmed = false
      }

      const drawerRoot = this.$refs.drawerAccountRoot
      if (this.drawerAccountExpanded && drawerRoot && !drawerRoot.contains(event.target)) {
        this.drawerAccountExpanded = false
        this.signOutArmed = false
      }
    },
    isActive(view) {
      return this.currentView === view
    },
    themeSwatches(themeId) {
      return getThemeSwatches(themeId)
    },
    selectTheme(themeId) {
      this.selectedTheme = applyTheme(themeId)
      this.themeExpanded = false
    },
    async handleSignIn() {
      if (this.busy) return
      this.busy = true
      try {
        await signInWithGoogle()
      } catch (err) {
        this.busy = false
        console.error(err)
        this.statusText = 'Sign-in failed'
        this.statusTone = 'error'
      }
    },
    async handleSignOut() {
      if (this.busy) return
      if (!this.signOutArmed) {
        this.signOutArmed = true
        if (this.signOutArmTimer) clearTimeout(this.signOutArmTimer)
        this.signOutArmTimer = setTimeout(() => {
          this.signOutArmed = false
          this.signOutArmTimer = null
        }, 3500)
        this.statusText = 'Tap again to confirm'
        this.statusTone = 'info'
        return
      }
      this.busy = true
      try {
        if (this.signOutArmTimer) { clearTimeout(this.signOutArmTimer); this.signOutArmTimer = null }
        this.signOutArmed = false
        this.accountExpanded = false
        this.drawerAccountExpanded = false
        await signOutUser()
        this.statusText = ''
        this.statusTone = 'neutral'
      } catch (err) {
        this.busy = false
        console.error(err)
        this.signOutArmed = false
        this.statusText = 'Sign-out failed'
        this.statusTone = 'error'
      }
    },
  }
}
</script>

<style scoped>
.brand-mark {
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.45);
  border-radius: 8px;
  padding: 0.38rem 0.55rem;
  line-height: 1.1;
}

.brand-title {
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  color: #e2e8f0;
}

.brand-subtitle {
  margin-top: 0.1rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #94a3b8;
}
</style>
