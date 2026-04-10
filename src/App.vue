<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 py-5">
    <div class="mx-auto w-full max-w-[1500px] px-4 md:px-8">
      <Header @toggle-shortcuts="toggleShortcutsHelp" />

      <div class="mt-2">
        <HomeView ref="homeView" v-if="view === 'home'" @start="openQuizConfig" @dashboard="openDashboard" @preview="openPreview" @edit="openEditor" @export="exportDeck" @view-ranking-info="showRankingInfo"/>
        <QuizConfig ref="quizConfigView" v-if="view === 'quiz-config'" :deck="activeDeck || 'major'" :auto-recovery="recoveryPreset" @back="showHome" @start="startQuizFromConfig" @start-drill="startDrillFromConfig" />
        <Dashboard ref="dashboardView" v-if="view === 'dashboard'" :deck="activeDeck" @back="showHome" />
        <Preview ref="previewView" v-if="view === 'preview'" :deck="activeDeck" @back="showHome" />
        <Editor ref="editorView" v-if="view === 'editor'" :deck="activeDeck || 'major'" @back="showHome" />
        <Stats ref="statsView" v-if="view === 'stats'" :session="session" @back="showHome" @dashboard="openDashboardFromStats" />
        <RankingInfoView ref="rankingInfoView" v-if="view === 'ranking-info'" @back="showHome" />
        <div v-if="view === 'quiz'">
          <Quiz ref="quizView" :key="quizKey" :deck="activeDeck || 'major'" :subset-keys="selectedSubsetKeys" :mode="quizMode" :drill-duration="drillDuration" @back="showHome" @finished="onQuizFinished" />
        </div>
      </div>

      <ShortcutsHelpModal
        :open="shortcutHelpOpen"
        :groups="shortcutHelpGroups"
        @close="closeShortcutsHelp"
      />
    </div>
  </div>
</template>

<script>
import Quiz from './components/Quiz.vue';
import Header from './components/Header.vue';
import ShortcutsHelpModal from './components/ShortcutsHelpModal.vue';
import HomeView from './views/Home.vue';
import QuizConfig from './views/QuizConfig.vue';
import Dashboard from './views/Dashboard.vue';
import Preview from './views/Preview.vue';
import Stats from './views/Stats.vue';
import RankingInfoView from './views/RankingInfoView.vue';
import Editor from './views/Editor.vue';
import { exportDeckPayload } from './core/deck-loader'
import { DECKS } from './data/decks'

export default {
  name: 'App',
  components: { Quiz, Header, ShortcutsHelpModal, HomeView, QuizConfig, Dashboard, Preview, Stats, RankingInfoView, Editor },
  data() {
    return {
      view: 'home',
      activeDeck: null,
      selectedSubsetKeys: [],
      session: null,
      quizKey: 0,
      quizMode: 'quiz',
      drillDuration: 60,
      recoveryPreset: false,
      shortcutHelpOpen: false,
      pendingShortcutPrefix: '',
      shortcutPrefixTimer: null,
    };
  },
  computed: {
    shortcutHelpGroups() {
      return [
        {
          title: 'Global Navigation',
          items: [
            { keys: 'Shift+/', action: 'Toggle shortcut help' },
            { keys: 'G then G / G then H', action: 'Go to Home' },
            { keys: 'G then Q', action: 'Go to Quiz Config (active deck)' },
            { keys: 'G then D', action: 'Go to Dashboard (active deck)' },
            { keys: 'G then P', action: 'Go to Preview (active deck)' },
            { keys: 'G then E', action: 'Go to Editor (active deck)' },
            { keys: 'G then R', action: 'Open Ranking docs + simulator' },
            { keys: 'H', action: 'Back to Home (from any non-home page)' },
            { keys: 'Esc', action: 'Close shortcut help' },
          ],
        },
        {
          title: 'Home',
          items: [
            { keys: 'J / K', action: 'Move deck focus down / up' },
            { keys: 'Space / Enter', action: 'Open focused deck in Quiz Config' },
            { keys: 'D / P / E / X', action: 'Focused deck: Dashboard / Preview / Editor / Export' },
            { keys: 'G then G / Shift+G', action: 'Jump to first / last deck' },
            { keys: '1..9', action: 'Open deck N in Quiz Config' },
            { keys: 'Shift+1..9', action: 'Open deck N Dashboard' },
            { keys: 'R', action: 'Open Ranking docs' },
          ],
        },
        {
          title: 'Quiz Config',
          items: [
            { keys: 'J / K', action: 'Move focus down / up groups' },
            { keys: 'Space / Enter', action: 'Toggle focused group' },
            { keys: 'G then G / Shift+G', action: 'Jump to first / last group' },
            { keys: 'A', action: 'Toggle all groups' },
            { keys: 'Q', action: 'Start quiz with selected groups' },
            { keys: 'W', action: 'Start speed drill with selected groups' },
            { keys: 'S', action: 'Select recovery suggestion' },
            { keys: 'R', action: 'Start recovery quiz' },
            { keys: 'T', action: 'Start recovery drill' },
            { keys: 'B / H', action: 'Back to Home' },
          ],
        },
        {
          title: 'Quiz / Drill',
          items: [
            { keys: 'A/S/D then J/K', action: 'Choose option by row + column (two-hand)' },
            { keys: 'Q/W/E then H/L', action: 'Alternative row + column layout' },
            { keys: '1..6', action: 'Choose option (fallback)' },
            { keys: 'Enter', action: 'Next question (after answer)' },
            { keys: 'N', action: 'Next question' },
            { keys: 'F', action: 'Finish and save' },
            { keys: 'B / H', action: 'Back to Home' },
          ],
        },
        {
          title: 'Preview',
          items: [
            { keys: '[ / H', action: 'Previous page / block' },
            { keys: '] / L', action: 'Next page / block' },
            { keys: 'B', action: 'Back to Home' },
          ],
        },
        {
          title: 'Editor & Stats',
          items: [
            { keys: 'Ctrl/Cmd+S', action: 'Save deck (Editor)' },
            { keys: 'I', action: 'Import deck JSON (Editor)' },
            { keys: 'E', action: 'Export deck JSON (Editor)' },
            { keys: 'T', action: 'Download template (Editor)' },
            { keys: 'D', action: 'Open deck dashboard (Stats)' },
          ],
        },
      ]
    },
  },
  mounted() {
    window.addEventListener('keydown', this.onGlobalKeydown)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onGlobalKeydown)
    this.clearShortcutPrefix()
  },
  methods: {
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
      else if (key === 'e') this.openEditor(deck)
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
        this.showHome()
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
        else if (key === 's') cfg.applyRecoverySelection()
        else if (key === 'r') cfg.startRecoveryQuiz()
        else if (key === 't') cfg.startRecoveryDrill()
        else if (key === 'b' || key === 'h') this.showHome()
        else return
        event.preventDefault()
        return
      }

      if (this.view === 'quiz') {
        const quiz = this.$refs.quizView
        if (!quiz) return
        if (key === 'n') quiz.nextQuestion()
        else if (key === 'f') quiz.finish('shortcut')
        else if (key === 'b') this.showHome()
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
          this.showHome()
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
        else if (key === 'b') this.showHome()
        else return
        event.preventDefault()
        return
      }

      if (this.view === 'stats') {
        if (key === 'd') this.openDashboardFromStats(this.session?.deck)
        else if (key === 'q') this.openQuizConfig(this.session?.deck || this.activeDeck || 'major')
        else if (key === 'b') this.showHome()
        else return
        event.preventDefault()
        return
      }

      if (this.view === 'dashboard' || this.view === 'ranking-info') {
        if (key === 'b') {
          this.showHome()
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
    openEditor(deck){ this.activeDeck = deck; this.view = 'editor'; },
    openDashboard(deck){ this.activeDeck = deck; this.view = 'dashboard'; },
    openPreview(deck){ this.activeDeck = deck; this.view = 'preview'; },
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
    showHome(){ this.view = 'home'; this.selectedSubsetKeys = []; this.recoveryPreset = false; },
    showRankingInfo(){ this.view = 'ranking-info'; },
    openDashboardFromStats(deck){ this.activeDeck = deck || this.activeDeck || 'major'; this.view = 'dashboard'; },
    onQuizFinished(session){
      this.session = session
      this.view = 'stats'
    }
  }
}
</script>

<style>
/* simple styling to make the badge visible */
</style>
