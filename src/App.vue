<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 py-5">
    <div class="mx-auto w-full max-w-[1500px] px-4 md:px-8">
      <Header />

      <div class="mt-2">
        <HomeView v-if="view === 'home'" @start="openQuizConfig" @dashboard="openDashboard" @preview="openPreview" @edit="openEditor" @export="exportDeck" @view-ranking-info="showRankingInfo"/>
        <QuizConfig v-if="view === 'quiz-config'" :deck="activeDeck || 'major'" @back="showHome" @start="startQuizFromConfig" @start-drill="startDrillFromConfig" />
        <Dashboard v-if="view === 'dashboard'" :deck="activeDeck" @back="showHome" />
        <Preview v-if="view === 'preview'" :deck="activeDeck" @back="showHome" />
        <Editor v-if="view === 'editor'" :deck="activeDeck || 'major'" @back="showHome" />
        <Stats v-if="view === 'stats'" :session="session" @back="showHome" @dashboard="openDashboardFromStats" />
        <RankingInfoView v-if="view === 'ranking-info'" @back="showHome" />
        <div v-if="view === 'quiz'">
          <Quiz :key="quizKey" :deck="activeDeck || 'major'" :subset-keys="selectedSubsetKeys" :mode="quizMode" :drill-duration="drillDuration" @back="showHome" @finished="onQuizFinished" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Quiz from './components/Quiz.vue';
import Header from './components/Header.vue';
import HomeView from './views/Home.vue';
import QuizConfig from './views/QuizConfig.vue';
import Dashboard from './views/Dashboard.vue';
import Preview from './views/Preview.vue';
import Stats from './views/Stats.vue';
import RankingInfoView from './views/RankingInfoView.vue';
import Editor from './views/Editor.vue';
import { exportDeckPayload } from './core/deck-loader'

export default {
  name: 'App',
  components: { Quiz, Header, HomeView, QuizConfig, Dashboard, Preview, Stats, RankingInfoView, Editor },
  data() {
    return { view: 'home', activeDeck: null, selectedSubsetKeys: [], session: null, quizKey: 0, quizMode: 'quiz', drillDuration: 60 };
  },
  methods: {
    openQuizConfig(deck){
      this.activeDeck = deck
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
    showHome(){ this.view = 'home'; this.selectedSubsetKeys = []; },
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
