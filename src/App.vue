<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <SideNav
      :currentView="view"
      :activeDeck="activeDeck"
      :drawerOpen="drawerOpen"
      @navigate="onSideNavNavigate"
      @navigate-deck="onSideNavNavigateDeck"
      @close-drawer="drawerOpen = false"
      @sync-status="syncStatus = $event"
      @collapse-change="sideNavCollapsed = $event"
    />

    <div :class="sideNavCollapsed ? 'md:ml-14' : 'md:ml-52'" class="transition-[margin] duration-200 ease-in-out">
      <div class="mx-auto w-full max-w-[1500px] px-4 pt-5 pb-16 md:pb-5" :class="view === 'quiz' ? 'md:px-4' : 'md:px-8'">
        <Header
          :breadcrumbs="breadcrumbs"
          :syncStatus="syncStatus"
          @toggle-shortcuts="toggleShortcutsHelp"
          @toggle-drawer="drawerOpen = !drawerOpen"
          @breadcrumb-navigate="onBreadcrumbNavigate"
        />

        <div class="mt-2">
          <HomeView ref="homeView" v-if="view === 'home'" @start="openQuizConfig" @dashboard="openDashboard" @preview="openPreview" @edit="openEditor" @export="exportDeck" @view-ranking-info="showRankingInfo" @instant-start="instantStartQuiz" @open-champion-evaluation="openChampionEvaluation"/>
          <StackLibraryView v-if="view === 'stack-library'" @back="showHome" @start-drill="onStackStartDrill" />
          <ChampionEvaluation v-if="view === 'champion-evaluation'" @launch-goal="launchChampionGoal" />
          <QuizConfig ref="quizConfigView" v-if="view === 'quiz-config'" :deck="activeDeck || 'major'" :auto-recovery="recoveryPreset" @back="goBack" @start="startQuizFromConfig" @start-drill="startDrillFromConfig" @start-competition="startCompetitionFromConfig" />
          <Competition ref="competitionView" v-if="view === 'competition'" :key="competitionKey" :deck="activeDeck || 'major'" :subset-keys="selectedSubsetKeys" :item-count="competitionItemCount" :study-speed-sec="competitionStudySpeed" @back="goBack" @finished="onCompetitionFinished" />
          <CompetitionStats ref="competitionStatsView" v-if="view === 'competition-stats'" :session="session" @back="goBack" @replay="replayCompetition" @dashboard="openDashboardFromStats" />
          <Dashboard ref="dashboardView" v-if="view === 'dashboard'" :deck="activeDeck" @back="goBack" />
          <Preview ref="previewView" v-if="view === 'preview'" :deck="activeDeck" @back="goBack" />
          <Editor ref="editorView" v-if="view === 'editor'" :deck="activeDeck || 'major'" @back="goBack" />
          <Stats ref="statsView" v-if="view === 'stats'" :session="session" @back="goBack" @dashboard="openDashboardFromStats" @replay="replayQuiz" />
          <RankingInfoView ref="rankingInfoView" v-if="view === 'ranking-info'" @back="goBack" @view-leaderboard="openLeaderboard" />
          <LeaderboardView ref="leaderboardView" v-if="view === 'leaderboard'" @back="goBack" />
          <TrainingLog v-if="view === 'training-log'" @back="goBack" @dashboard="openDashboard" />
          <div v-if="view === 'quiz'">
            <Quiz ref="quizView" :key="quizKey" :deck="activeDeck || 'major'" :subset-keys="selectedSubsetKeys" :mode="quizMode" :drill-duration="drillDuration" @back="goBack" @finished="onQuizFinished" />
          </div>
        </div>

        <Toast />
        <ShortcutsHelpModal
          :open="shortcutHelpOpen"
          :groups="shortcutHelpGroups"
          @close="closeShortcutsHelp"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Quiz from './components/Quiz.vue';
import Header from './components/Header.vue';
import SideNav from './components/SideNav.vue';
import ShortcutsHelpModal from './components/ShortcutsHelpModal.vue';
import Toast from './components/Toast.vue';
import HomeView from './views/Home.vue';
import StackLibraryView from './views/StackLibrary.vue';
import QuizConfig from './views/QuizConfig.vue';
import Dashboard from './views/Dashboard.vue';
import Preview from './views/Preview.vue';
import Stats from './views/Stats.vue';
import RankingInfoView from './views/RankingInfoView.vue';
import LeaderboardView from './views/LeaderboardView.vue';
import Editor from './views/Editor.vue';
import TrainingLog from './views/TrainingLog.vue';
import Competition from './views/Competition.vue';
import CompetitionStats from './views/CompetitionStats.vue';
import ChampionEvaluation from './views/ChampionEvaluation.vue';
import { exportDeckPayload, migrateDeckSavedAtTimestamps } from './core/deck-loader'
import { DECKS } from './data/decks'
import { publishLeaderboardSnapshot } from './core/firebase-leaderboard'

export default {
  name: 'App',
  components: { Quiz, Header, SideNav, ShortcutsHelpModal, Toast, HomeView, StackLibraryView, QuizConfig, Dashboard, Preview, Stats, RankingInfoView, LeaderboardView, Editor, TrainingLog, Competition, CompetitionStats, ChampionEvaluation },
  data() {
    return {
      view: 'home',
      activeDeck: null,
      selectedSubsetKeys: [],
      session: null,
      quizKey: 0,
      quizMode: 'quiz',
      drillDuration: 60,
      competitionKey: 0,
      competitionItemCount: 10,
      competitionStudySpeed: 3,
      recoveryPreset: false,
      shortcutHelpOpen: false,
      pendingShortcutPrefix: '',
      shortcutPrefixTimer: null,
      navStack: [],
      drawerOpen: false,
      sideNavCollapsed: false,
      syncStatus: 'neutral',
      twoFingerSwipeTracking: false,
      twoFingerSwipeTriggered: false,
      twoFingerSwipeMode: '',
      twoFingerSwipeStartX: 0,
      twoFingerSwipeStartY: 0,
    };
  },
  computed: {
    breadcrumbs() {
      const labelFor = (view, deck) => {
        const map = {
          'home': 'Home', 'training-log': 'Training Log', 'ranking-info': 'Ranking',
          'leaderboard': 'Leaderboard', 'stats': 'Results', 'quiz': 'Quiz', 'quiz-config': 'Setup',
          'competition': 'Competition', 'competition-stats': 'Competition Results',
          'champion-evaluation': 'Champion Evaluation',
          'stack-library': 'Stack library',
        }
        if (view === 'dashboard') return (deck?.name || deck || 'Dashboard')
        if (view === 'preview') return (deck?.name || deck || 'Deck') + ' Preview'
        if (view === 'editor') return (deck?.name || deck || 'Deck') + ' Editor'
        return map[view] || view
      }
      const items = this.navStack.map(s => ({ label: labelFor(s.view, s.activeDeck), view: s.view, deck: s.activeDeck }))
      items.push({ label: labelFor(this.view, this.activeDeck), view: this.view, deck: this.activeDeck })
      return items
    },
    isTouchDevice() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0
    },
    shortcutHelpGroups() {
      const touch = this.isTouchDevice
      const v = this.view

      // Touch gesture groups (phone users)
      const touchGroups = {
        'quiz': [
          {
            title: 'Quiz — Speed Input',
            items: [
              { keys: 'Tap option', action: 'Select answer (auto-advances)' },
              { keys: 'Swipe right on option', action: 'Select that answer' },
              { keys: 'Auto-advance', action: 'Next question loads automatically' },
            ],
          },
          {
            title: 'Drill — Speed Input',
            items: [
              { keys: 'Tap right half', action: 'KNOW (instant)' },
              { keys: 'Tap left half', action: 'SKIP (instant)' },
              { keys: 'Swipe right', action: 'KNOW (with animation)' },
              { keys: 'Swipe left', action: 'SKIP (with animation)' },
            ],
          },
        ],
        'home': [
          {
            title: 'Home — Touch',
            items: [
              { keys: 'Tap card', action: 'Open deck dashboard' },
              { keys: 'Hold card (0.5s)', action: 'Instant quiz start (skip config)' },
              { keys: 'Tap Start Quiz', action: 'Open quiz config' },
            ],
          },
        ],
        'stats': [
          {
            title: 'Results',
            items: [
              { keys: 'Tap Replay', action: 'Restart same quiz instantly' },
            ],
          },
        ],
        '_global': [
          {
            title: 'Navigation',
            items: [
              { keys: 'Bottom tab bar', action: 'Home / Training Log / Ranking' },
              { keys: 'Hamburger menu', action: 'Full nav + theme + account' },
            ],
          },
        ],
      }

      // Keyboard groups (desktop users)
      const keyboardGroups = {
        '_global': [
          {
            title: 'Global Navigation',
            items: [
              { keys: 'Shift+/', action: 'Toggle shortcut help' },
              { keys: 'G then G / G then H', action: 'Go to Home' },
              { keys: 'G then Q', action: 'Go to Quiz Config (active deck)' },
              { keys: 'G then D', action: 'Go to Dashboard (active deck)' },
              { keys: 'G then P', action: 'Go to Preview (active deck)' },
              { keys: 'G then E', action: 'Go to Champion Evaluation' },
              { keys: 'G then O', action: 'Go to Editor (active deck)' },
              { keys: 'G then R', action: 'Open Ranking docs + simulator' },
              { keys: 'H', action: 'Back to Home (from any non-home page)' },
              { keys: 'Esc', action: 'Close shortcut help' },
            ],
          },
        ],
        'home': [
          {
            title: 'Home',
            items: [
              { keys: 'J / K', action: 'Move deck focus down / up' },
              { keys: 'Space / Enter', action: 'Open focused deck in Quiz Config' },
              { keys: 'D / P / I / X', action: 'Focused deck: Dashboard / Preview / Editor / Export' },
              { keys: 'E', action: 'Open Champion Evaluation' },
              { keys: 'G then G / Shift+G', action: 'Jump to first / last deck' },
              { keys: '1..9', action: 'Open deck N in Quiz Config' },
              { keys: 'Shift+1..9', action: 'Open deck N Dashboard' },
              { keys: 'R', action: 'Open Ranking docs' },
            ],
          },
        ],
        'quiz-config': [
          {
            title: 'Quiz Config',
            items: [
              { keys: 'J / K', action: 'Move focus down / up groups' },
              { keys: 'Space / Enter', action: 'Toggle focused group' },
              { keys: 'G then G / Shift+G', action: 'Jump to first / last group' },
              { keys: 'A', action: 'Toggle all groups' },
              { keys: 'Q', action: 'Start quiz with selected groups' },
              { keys: 'W', action: 'Start speed drill with selected groups' },
              { keys: 'C', action: 'Start competition mode' },
              { keys: 'S', action: 'Select recovery suggestion' },
              { keys: 'R', action: 'Start recovery quiz' },
              { keys: 'T', action: 'Start recovery drill' },
              { keys: 'B / H', action: 'Back to Home' },
            ],
          },
        ],
        'competition-stats': [
          {
            title: 'Competition Results',
            items: [
              { keys: 'R', action: 'Replay competition' },
              { keys: 'D', action: 'Open deck dashboard' },
              { keys: 'B / H', action: 'Back to Home' },
            ],
          },
        ],
        'quiz': [
          {
            title: 'Quiz / Drill',
            items: [
              { keys: 'A/S/D then J/K', action: 'Choose option by row + column (two-hand)' },
              { keys: 'Q/W/E then H/L', action: 'Alternative row + column layout' },
              { keys: '1..6', action: 'Choose option (fallback)' },
              { keys: 'Space / Enter', action: 'Next question (after answer)' },
              { keys: 'N', action: 'Next question' },
              { keys: 'F', action: 'Finish and save' },
              { keys: 'B / H', action: 'Back to Home' },
            ],
          },
        ],
        'preview': [
          {
            title: 'Preview',
            items: [
              { keys: '[ / H', action: 'Previous page / block' },
              { keys: '] / L', action: 'Next page / block' },
              { keys: 'B', action: 'Back to Home' },
            ],
          },
        ],
        'editor': [
          {
            title: 'Editor',
            items: [
              { keys: 'Ctrl/Cmd+S', action: 'Save deck' },
              { keys: 'I', action: 'Import deck JSON' },
              { keys: 'E', action: 'Export deck JSON' },
              { keys: 'T', action: 'Download template' },
            ],
          },
        ],
        'stats': [
          {
            title: 'Results',
            items: [
              { keys: 'R', action: 'Replay same quiz' },
              { keys: 'D', action: 'Open deck dashboard' },
              { keys: 'B / H', action: 'Back to Home' },
            ],
          },
        ],
      }

      const source = touch ? touchGroups : keyboardGroups
      const result = [...(source['_global'] || [])]
      if (source[v]) result.push(...source[v])
      return result
    },
  },
  watch: {
    view() { this.syncHash() },
    activeDeck() { this.syncHash() },
  },
  mounted() {
    migrateDeckSavedAtTimestamps()
    this.restoreFromHash()
    window.addEventListener('keydown', this.onGlobalKeydown)
    window.addEventListener('touchstart', this.onGlobalTouchStart, { passive: true })
    window.addEventListener('touchmove', this.onGlobalTouchMove, { passive: true })
    window.addEventListener('touchend', this.onGlobalTouchEnd, { passive: true })
    window.addEventListener('touchcancel', this.onGlobalTouchEnd, { passive: true })
    window.addEventListener('mnemonic-stats-updated', this.publishLeaderboardIfPossible)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onGlobalKeydown)
    window.removeEventListener('touchstart', this.onGlobalTouchStart)
    window.removeEventListener('touchmove', this.onGlobalTouchMove)
    window.removeEventListener('touchend', this.onGlobalTouchEnd)
    window.removeEventListener('touchcancel', this.onGlobalTouchEnd)
    window.removeEventListener('mnemonic-stats-updated', this.publishLeaderboardIfPossible)
    this.clearShortcutPrefix()
  },
  methods: {
    async publishLeaderboardIfPossible() {
      try {
        await publishLeaderboardSnapshot()
      } catch (err) {
        console.error('Leaderboard publish failed', err)
      }
    },
    syncHash() {
      // Don't persist transient views — redirect them to a sensible alternative on restore
      if (this.view === 'quiz' || this.view === 'stats') return
      const hash = this.activeDeck ? `${this.view}/${this.activeDeck}` : this.view
      if (location.hash !== '#' + hash) history.replaceState(null, '', '#' + hash)
    },
    restoreFromHash() {
      const raw = location.hash.slice(1)
      if (!raw) return
      const [view, deck] = raw.split('/')
      const restorable = ['home', 'dashboard', 'preview', 'editor', 'training-log', 'ranking-info', 'leaderboard', 'quiz-config', 'champion-evaluation', 'stack-library']
      if (!restorable.includes(view)) return
      this.view = view
      if (deck) this.activeDeck = deck
    },
    resetTwoFingerSwipe() {
      this.twoFingerSwipeTracking = false
      this.twoFingerSwipeTriggered = false
      this.twoFingerSwipeMode = ''
      this.twoFingerSwipeStartX = 0
      this.twoFingerSwipeStartY = 0
    },
    onGlobalTouchStart(event) {
      if (window.innerWidth >= 768) {
        this.resetTwoFingerSwipe()
        return
      }
      if (event.touches.length !== 2) {
        this.resetTwoFingerSwipe()
        return
      }
      const touchA = event.touches[0]
      const touchB = event.touches[1]
      this.twoFingerSwipeTracking = true
      this.twoFingerSwipeTriggered = false
      this.twoFingerSwipeMode = this.drawerOpen ? 'close' : 'open'
      this.twoFingerSwipeStartX = (touchA.clientX + touchB.clientX) / 2
      this.twoFingerSwipeStartY = (touchA.clientY + touchB.clientY) / 2
    },
    onGlobalTouchMove(event) {
      if (!this.twoFingerSwipeTracking || this.twoFingerSwipeTriggered) return
      if (event.touches.length !== 2) return
      const touchA = event.touches[0]
      const touchB = event.touches[1]
      const midX = (touchA.clientX + touchB.clientX) / 2
      const midY = (touchA.clientY + touchB.clientY) / 2
      const deltaX = midX - this.twoFingerSwipeStartX
      const deltaY = Math.abs(midY - this.twoFingerSwipeStartY)
      if (this.twoFingerSwipeMode === 'open' && deltaX > 90 && deltaY < 80) {
        this.drawerOpen = true
        this.twoFingerSwipeTriggered = true
      } else if (this.twoFingerSwipeMode === 'close' && deltaX < -90 && deltaY < 80) {
        this.drawerOpen = false
        this.twoFingerSwipeTriggered = true
      }
    },
    onGlobalTouchEnd() {
      this.resetTwoFingerSwipe()
    },
    isTypingTarget(target) {
      if (!target) return false
      if (target.isContentEditable) return true
      return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    },
    toggleShortcutsHelp() {
      this.shortcutHelpOpen = !this.shortcutHelpOpen
    },
    closeShortcutsHelp() {
      this.shortcutHelpOpen = false
    },
    armShortcutPrefix(prefix) {
      this.pendingShortcutPrefix = prefix
      if (this.shortcutPrefixTimer) clearTimeout(this.shortcutPrefixTimer)
      this.shortcutPrefixTimer = setTimeout(() => {
        this.pendingShortcutPrefix = ''
        this.shortcutPrefixTimer = null
      }, 1200)
    },
    clearShortcutPrefix() {
      this.pendingShortcutPrefix = ''
      if (this.shortcutPrefixTimer) {
        clearTimeout(this.shortcutPrefixTimer)
        this.shortcutPrefixTimer = null
      }
    },
    runGoToShortcut(key) {
      const deck = this.activeDeck || 'major'
      if (key === 'g' || key === 'h') this.showHome()
      else if (key === 'q') this.openQuizConfig({ deck, mode: 'default' })
      else if (key === 'd') this.openDashboard(deck)
      else if (key === 'p') this.openPreview(deck)
      else if (key === 'e') this.openChampionEvaluation()
      else if (key === 'o') this.openEditor(deck)
      else if (key === 'r') this.showRankingInfo()
    },
    onGlobalKeydown(event) {
      const key = String(event.key || '').toLowerCase()

      if ((event.shiftKey && key === '/') || key === '?') {
        this.toggleShortcutsHelp()
        event.preventDefault()
        return
      }

      if (key === 'escape' && this.shortcutHelpOpen) {
        this.closeShortcutsHelp()
        event.preventDefault()
        return
      }

      if (this.shortcutHelpOpen) return

      if (this.view === 'editor' && (event.ctrlKey || event.metaKey) && key === 's') {
        const editor = this.$refs.editorView
        if (editor) {
          editor.save()
          event.preventDefault()
        }
        return
      }

      if (this.isTypingTarget(document.activeElement)) return

      if (!['quiz-config', 'home'].includes(this.view) && this.pendingShortcutPrefix === 'g') {
        this.runGoToShortcut(key)
        this.clearShortcutPrefix()
        event.preventDefault()
        return
      }

      if (!['quiz-config', 'home'].includes(this.view) && key === 'g') {
        this.armShortcutPrefix('g')
        event.preventDefault()
        return
      }

      if (key === 'h' && !['home', 'preview', 'quiz'].includes(this.view)) {
        this.goBack()
        event.preventDefault()
        return
      }

      if (this.view === 'home') {
        const home = this.$refs.homeView
        if (!home) return
        if (this.pendingShortcutPrefix === 'g' && key === 'g') {
          home.moveCursorToStart()
          this.clearShortcutPrefix()
          event.preventDefault()
          return
        }
        if (key === 'g' && event.shiftKey) {
          home.moveCursorToEnd()
          this.clearShortcutPrefix()
          event.preventDefault()
          return
        }
        if (key === 'g') {
          this.armShortcutPrefix('g')
          event.preventDefault()
          return
        }
        if (this.pendingShortcutPrefix === 'g') {
          this.runGoToShortcut(key)
          this.clearShortcutPrefix()
          event.preventDefault()
          return
        }
        if (key === 'j') {
          home.moveCursor(1)
          event.preventDefault()
          return
        }
        if (key === 'k') {
          home.moveCursor(-1)
          event.preventDefault()
          return
        }
        if (key === ' ' || key === 'enter') {
          home.openFocusedQuizConfig()
          event.preventDefault()
          return
        }
        if (key === 'd') {
          home.openFocusedDashboard()
          event.preventDefault()
          return
        }
        if (key === 'p') {
          home.openFocusedPreview()
          event.preventDefault()
          return
        }
        if (key === 'e') {
          this.openChampionEvaluation()
          event.preventDefault()
          return
        }
        if (key === 'i') {
          home.openFocusedEditor()
          event.preventDefault()
          return
        }
        if (key === 'x') {
          home.exportFocusedDeck()
          event.preventDefault()
          return
        }
        if (/^[1-9]$/.test(key)) {
          const idx = Number(key) - 1
          const selected = DECKS[idx]
          if (selected?.deck) {
            if (event.shiftKey) this.openDashboard(selected.deck)
            else this.openQuizConfig(selected.deck)
            event.preventDefault()
          }
          return
        }
        if (key === 'r') {
          this.showRankingInfo()
          event.preventDefault()
        }
        return
      }

      if (this.view === 'quiz-config') {
        const cfg = this.$refs.quizConfigView
        if (!cfg) return
        if (this.pendingShortcutPrefix === 'g' && key === 'g') {
          cfg.moveCursorToStart()
          this.clearShortcutPrefix()
          event.preventDefault()
          return
        }
        if (key === 'g' && event.shiftKey) {
          cfg.moveCursorToEnd()
          this.clearShortcutPrefix()
          event.preventDefault()
          return
        }
        if (key === 'g') {
          this.armShortcutPrefix('g')
          event.preventDefault()
          return
        }
        if (key === 'j') cfg.moveCursor(1)
        else if (key === 'k') cfg.moveCursor(-1)
        else if (key === ' ' || key === 'enter') cfg.toggleFocusedGroup()
        else if (key === 'a') cfg.toggleAll()
        else if (key === 'q') cfg.startQuiz()
        else if (key === 'w') cfg.startDrill()
        else if (key === 'c') cfg.startCompetition()
        else if (key === 's') cfg.applyRecoverySelection()
        else if (key === 'r') cfg.startRecoveryQuiz()
        else if (key === 't') cfg.startRecoveryDrill()
        else if (key === 'b' || key === 'h') this.goBack()
        else return
        event.preventDefault()
        return
      }

      if (this.view === 'quiz') {
        const quiz = this.$refs.quizView
        if (!quiz) return
        if (key === 'n') quiz.nextQuestion()
        else if (key === 'f') quiz.finish('shortcut')
        else if (key === 'b') this.goBack()
        else return
        event.preventDefault()
        return
      }

      if (this.view === 'preview') {
        const preview = this.$refs.previewView
        if (!preview) return
        if (key === '[' || key === 'h') {
          if (preview.mode === 'sem3major-matrix') preview.goToSem3Block(-1)
          else preview.goToPage(preview.currentPage - 1)
        } else if (key === ']' || key === 'l') {
          if (preview.mode === 'sem3major-matrix') preview.goToSem3Block(1)
          else preview.goToPage(preview.currentPage + 1)
        } else if (key === 'b') {
          this.goBack()
        } else {
          return
        }
        event.preventDefault()
        return
      }

      if (this.view === 'editor') {
        const editor = this.$refs.editorView
        if (!editor) return
        if (key === 'i') editor.triggerImport()
        else if (key === 'e') editor.exportNow()
        else if (key === 't') editor.downloadTemplate()
        else if (key === 'b') this.goBack()
        else return
        event.preventDefault()
        return
      }

      if (this.view === 'competition-stats') {
        if (key === 'r') this.replayCompetition()
        else if (key === 'd') this.openDashboardFromStats(this.session?.deck)
        else if (key === 'b' || key === 'h') this.goBack()
        else return
        event.preventDefault()
        return
      }

      if (this.view === 'stats') {
        if (key === 'r') this.replayQuiz(this.session?.deck)
        else if (key === 'd') this.openDashboardFromStats(this.session?.deck)
        else if (key === 'q') this.openQuizConfig(this.session?.deck || this.activeDeck || 'major')
        else if (key === 'b') this.goBack()
        else return
        event.preventDefault()
        return
      }

      if (this.view === 'dashboard' || this.view === 'ranking-info' || this.view === 'leaderboard') {
        if (key === 'b') {
          this.goBack()
          event.preventDefault()
        }
      }
    },
    openQuizConfig(input){
      const payload = typeof input === 'string'
        ? { deck: input, mode: 'default' }
        : (input || {})
      this.activeDeck = payload.deck || 'major'
      this.recoveryPreset = payload.mode === 'recovery'
      this.selectedSubsetKeys = []
      this.view = 'quiz-config'
    },
    replayQuiz(deck) {
      this.activeDeck = deck || this.activeDeck || 'major'
      this.view = 'quiz'
      this.quizKey++
    },
    instantStartQuiz(deck) {
      this.navStack.push({ view: this.view, activeDeck: this.activeDeck })
      this.activeDeck = deck || 'major'
      this.selectedSubsetKeys = []
      this.quizMode = 'quiz'
      this.view = 'quiz'
      this.quizKey++
    },
    startQuizFromConfig(keys){
      this.selectedSubsetKeys = Array.isArray(keys) ? keys : []
      this.quizMode = 'quiz'
      this.view = 'quiz'
      this.quizKey++
    },
    startDrillFromConfig(keys){
      this.selectedSubsetKeys = Array.isArray(keys) ? keys : []
      this.quizMode = 'drill'
      this.view = 'quiz'
      this.quizKey++
    },
    navigateTo(view, deck = null, { replace = false } = {}) {
      const targetDeck = deck !== null ? deck : this.activeDeck
      // Don't push a duplicate entry if already on this view+deck
      if (this.view === view && this.activeDeck === targetDeck) return
      if (!replace) {
        this.navStack.push({ view: this.view, activeDeck: this.activeDeck })
      }
      this.view = view
      if (deck !== null) this.activeDeck = deck
    },
    goBack() {
      if (!this.navStack.length) { this.showHome(); return }
      const prev = this.navStack.pop()
      this.view = prev.view
      this.activeDeck = prev.activeDeck
    },
    openEditor(deck){ this.navigateTo('editor', deck) },
    openDashboard(deck){ this.navigateTo('dashboard', deck) },
    openPreview(deck){ this.navigateTo('preview', deck) },
    exportDeck(deck){
      const payload = exportDeckPayload(deck)
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `mnemonic-${deck}-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
    },
    showHome(){ this.navStack = []; this.view = 'home'; this.activeDeck = null; this.selectedSubsetKeys = []; this.recoveryPreset = false; },
    showRankingInfo(){ this.navigateTo('ranking-info') },
    openLeaderboard(){ this.navigateTo('leaderboard') },
    openTrainingLog(){ this.navigateTo('training-log') },
    openChampionEvaluation(){ this.navigateTo('champion-evaluation') },
    openDashboardFromStats(deck){ this.navigateTo('dashboard', deck || this.activeDeck || 'major') },
    onSideNavNavigate(viewName) {
      if (viewName === 'home') this.showHome()
      else if (viewName === 'stack-library') {
        this.navigateTo('stack-library', null)
        this.activeDeck = null
      }
      else if (viewName === 'training-log') this.openTrainingLog()
      else if (viewName === 'ranking-info') this.showRankingInfo()
      else if (viewName === 'leaderboard') this.openLeaderboard()
      else if (viewName === 'champion-evaluation') this.openChampionEvaluation()
      this.drawerOpen = false
    },
    onStackStartDrill(deckId) {
      const id = String(deckId || '').trim()
      if (!id) return
      this.navStack.push({ view: 'stack-library', activeDeck: null })
      this.openQuizConfig(id)
    },
    onSideNavNavigateDeck(viewName, deck) {
      // Remove any existing entry for the same view+deck from the stack to avoid duplicates
      this.navStack = this.navStack.filter(s => !(s.view === viewName && s.activeDeck === deck))
      if (viewName === 'quiz-config') this.openQuizConfig(deck)
      else if (viewName === 'dashboard') this.openDashboard(deck)
      else if (viewName === 'preview') this.openPreview(deck)
      else if (viewName === 'editor') this.openEditor(deck)
      this.drawerOpen = false
    },
    onBreadcrumbNavigate(crumb) {
      const stackIndex = this.navStack.findIndex(s => s.view === crumb.view && s.activeDeck === crumb.deck)
      if (stackIndex !== -1) {
        const target = this.navStack[stackIndex]
        this.navStack = this.navStack.slice(0, stackIndex)
        this.view = target.view
        this.activeDeck = target.activeDeck
      }
    },
    onQuizFinished(session){
      this.session = session
      this.view = 'stats'
    },
    startCompetitionFromConfig({ keys, itemCount, studySpeedSec }) {
      this.selectedSubsetKeys = Array.isArray(keys) ? keys : []
      this.competitionItemCount = itemCount || 10
      this.competitionStudySpeed = studySpeedSec || 3
      this.view = 'competition'
      this.competitionKey++
    },
    replayCompetition() {
      this.view = 'competition'
      this.competitionKey++
    },
    onCompetitionFinished(session) {
      this.session = session
      this.view = 'competition-stats'
    },
    launchChampionGoal(goal) {
      const deck = goal?.deck || this.activeDeck || 'major'
      const type = goal?.type

      if (type === 'drill') {
        this.navStack.push({ view: this.view, activeDeck: this.activeDeck })
        this.activeDeck = deck
        this.selectedSubsetKeys = []
        this.drillDuration = Math.max(10, Number(goal?.config?.durationSec || this.drillDuration || 60))
        this.quizMode = 'drill'
        this.view = 'quiz'
        this.quizKey++
        return
      }

      if (type === 'competition') {
        this.navStack.push({ view: this.view, activeDeck: this.activeDeck })
        this.activeDeck = deck
        this.selectedSubsetKeys = []
        this.competitionItemCount = Number(goal?.config?.itemCount || 10)
        this.competitionStudySpeed = Number(goal?.config?.studySpeedSec || 3)
        this.view = 'competition'
        this.competitionKey++
        return
      }

      if (type === 'review') {
        this.openQuizConfig({ deck, mode: 'recovery' })
        return
      }

      this.openQuizConfig({ deck, mode: 'default' })
    },
  }
}
</script>

<style>
/* simple styling to make the badge visible */
</style>
