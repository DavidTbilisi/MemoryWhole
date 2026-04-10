<template>
  <div class="space-y-6">
    <RankSimulator />

    <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="text-2xl">🧪</div>
        <h2 class="text-xl font-bold text-cyan-300">Simulator Inputs Explained</h2>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-4">
          <h3 class="font-semibold text-slate-100">Global accuracy</h3>
          <p class="mt-1 text-sm text-slate-400">
            Percentage of correct answers across all attempts. Example: 100% means every attempt is correct.
          </p>
          <p class="mt-2 text-xs text-slate-500">
            Higher global accuracy increases both Global Rank and Synthetic Rank.
          </p>
        </div>

        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-4">
          <h3 class="font-semibold text-slate-100">Deck coverage</h3>
          <p class="mt-1 text-sm text-slate-400">
            Number of decks you have practiced, shown as used decks over total decks. Example: 9 / 16.
          </p>
          <p class="mt-2 text-xs text-slate-500">
            Global score is capped by coverage ratio, so more deck coverage raises your ceiling.
          </p>
        </div>

        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-4">
          <h3 class="font-semibold text-slate-100">Average mastery</h3>
          <p class="mt-1 text-sm text-slate-400">
            Mean of your deck mastery peaks. Example: 100% means all included decks reached full mastery.
          </p>
          <p class="mt-2 text-xs text-slate-500">
            This is the largest component in Synthetic Rank (60% weight).
          </p>
        </div>

        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-4">
          <h3 class="font-semibold text-slate-100">Deck diversity</h3>
          <p class="mt-1 text-sm text-slate-400">
            Number of distinct decks you actively train, used for diversity bonus.
          </p>
          <p class="mt-2 text-xs text-slate-500">
            Adds bonus points to Synthetic Rank (up to +10), rewarding breadth not just depth.
          </p>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="text-2xl">🧭</div>
        <h2 class="text-xl font-bold text-emerald-300">What Matters Most and How to Raise It</h2>
      </div>

      <p class="text-slate-300 mb-4">
        Priority order for faster rank growth: <strong>Global accuracy</strong> → <strong>Deck coverage</strong> → <strong>Average mastery</strong> → <strong>Deck diversity</strong>.
      </p>

      <div class="space-y-3">
        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-4">
          <h3 class="font-semibold text-slate-100">1) Global accuracy (highest impact)</h3>
          <p class="mt-1 text-sm text-slate-400">Why: it directly drives Global Rank and also contributes to Synthetic Rank.</p>
          <ul class="mt-2 space-y-1 text-sm text-slate-300 ml-4">
            <li>• Do short clean sessions (10-20 answers).</li>
            <li>• Stop after 2-3 misses, then switch to weak-item recovery.</li>
            <li>• Prioritize due and weak prompts before full-deck runs.</li>
            <li>• Focus on correctness first, then speed.</li>
          </ul>
        </div>

        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-4">
          <h3 class="font-semibold text-slate-100">2) Deck coverage</h3>
          <p class="mt-1 text-sm text-slate-400">Why: coverage controls your Global Rank ceiling.</p>
          <ul class="mt-2 space-y-1 text-sm text-slate-300 ml-4">
            <li>• Add at least one newly-practiced deck each week.</li>
            <li>• Keep previously-practiced decks active with maintenance sessions.</li>
            <li>• Track coverage ratio and avoid long gaps on old decks.</li>
          </ul>
        </div>

        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-4">
          <h3 class="font-semibold text-slate-100">3) Average mastery</h3>
          <p class="mt-1 text-sm text-slate-400">Why: this is the largest Synthetic Rank component (60%).</p>
          <ul class="mt-2 space-y-1 text-sm text-slate-300 ml-4">
            <li>• Pick one deck and push a new peak each cycle.</li>
            <li>• Alternate recovery subsets with full-deck verification runs.</li>
            <li>• Repeat weak clusters until they become stable.</li>
          </ul>
        </div>

        <div class="rounded-lg border border-slate-700/70 bg-slate-900/45 p-4">
          <h3 class="font-semibold text-slate-100">4) Deck diversity</h3>
          <p class="mt-1 text-sm text-slate-400">Why: adds bonus to Synthetic Rank (up to +10), but is not the primary driver.</p>
          <ul class="mt-2 space-y-1 text-sm text-slate-300 ml-4">
            <li>• Rotate across different deck types during the week.</li>
            <li>• Use breadth as a bonus after accuracy and coverage are stable.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Global Rank Explanation -->
    <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="text-2xl">🌍</div>
        <h2 class="text-xl font-bold text-cyan-400">Global Rank</h2>
      </div>
      <p class="text-slate-300 mb-4">
        Your <strong>Global Rank</strong> reflects your overall mastery across all memory decks. It's based purely on accuracy—the percentage of quiz answers you get correct.
      </p>
      <div class="bg-slate-800/40 rounded-lg p-4 space-y-3">
        <div>
          <h3 class="font-semibold text-slate-200 mb-1">How it's calculated:</h3>
          <p class="text-slate-400 text-sm">
            Total Correct Answers ÷ Total Attempts × 100 = Your Global Accuracy %
          </p>
        </div>
        <div>
          <h3 class="font-semibold text-slate-200 mb-1">What it shows:</h3>
          <ul class="text-slate-400 text-sm space-y-1 ml-4">
            <li>✓ Your overall consistency across all decks</li>
            <li>✓ Raw accuracy performance</li>
            <li>✓ How well you've memorized associations</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Synthetic Rank Explanation -->
    <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="text-2xl">⚗️</div>
        <h2 class="text-xl font-bold text-violet-400">Synthetic Rank</h2>
      </div>
      <p class="text-slate-300 mb-4">
        Your <strong>Synthetic Rank</strong> is a composite score that measures your complete memory mastery. It combines multiple factors to give you a holistic view of your progress.
      </p>
      <div class="bg-slate-800/40 rounded-lg p-4 space-y-3">
        <div>
          <h3 class="font-semibold text-slate-200 mb-2">How it's calculated:</h3>
          <div class="text-slate-400 text-sm space-y-2">
            <div class="flex justify-between items-center bg-slate-700/30 rounded p-2">
              <span>Average Mastery Peak</span>
              <span class="font-semibold">60%</span>
            </div>
            <div class="flex justify-between items-center bg-slate-700/30 rounded p-2">
              <span>Global Accuracy</span>
              <span class="font-semibold">40%</span>
            </div>
            <div class="flex justify-between items-center bg-violet-700/20 rounded p-2 border border-violet-600/30">
              <span>Deck Diversity Bonus</span>
              <span class="font-semibold">+0 to +10</span>
            </div>
            <div class="text-center mt-2 text-sm">
              <span class="text-slate-500">= Composite Score (0–100)</span>
            </div>
          </div>
        </div>
        <div>
          <h3 class="font-semibold text-slate-200 mb-1">What it shows:</h3>
          <ul class="text-slate-400 text-sm space-y-1 ml-4">
            <li>✓ Your peak performance on each deck (mastery ceiling)</li>
            <li>✓ Consistent accuracy across all practice</li>
            <li>✓ Breadth of mastery (bonus for learning multiple decks)</li>
            <li>✓ Overall progression and growth</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Ranking Tiers -->
    <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="text-2xl">🏆</div>
        <h2 class="text-xl font-bold text-amber-400">Anime Ranking Scale</h2>
      </div>
      <p class="text-slate-300 mb-4">
        Both rankings use a 14-tier anime grading system, from legendary to incomplete:
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="bg-slate-800/40 rounded-lg p-3 border-l-4 border-red-500">
          <div class="font-semibold text-slate-200 mb-1">SSS+ (95%+) — Legendary</div>
          <p class="text-slate-400 text-xs">Perfect or near-perfect mastery</p>
        </div>
        <div class="bg-slate-800/40 rounded-lg p-3 border-l-4 border-pink-500">
          <div class="font-semibold text-slate-200 mb-1">SS (86%+) — Supreme</div>
          <p class="text-slate-400 text-xs">Exceptional consistency</p>
        </div>
        <div class="bg-slate-800/40 rounded-lg p-3 border-l-4 border-purple-500">
          <div class="font-semibold text-slate-200 mb-1">S (80%+) — Exceptional</div>
          <p class="text-slate-400 text-xs">Strong performance</p>
        </div>
        <div class="bg-slate-800/40 rounded-lg p-3 border-l-4 border-blue-600">
          <div class="font-semibold text-slate-200 mb-1">A (70%+) — Excellent</div>
          <p class="text-slate-400 text-xs">Solid, reliable performance</p>
        </div>
        <div class="bg-slate-800/40 rounded-lg p-3 border-l-4 border-blue-500">
          <div class="font-semibold text-slate-200 mb-1">B (50%+) — Fair</div>
          <p class="text-slate-400 text-xs">Acceptable with room to grow</p>
        </div>
        <div class="bg-slate-800/40 rounded-lg p-3 border-l-4 border-cyan-500">
          <div class="font-semibold text-slate-200 mb-1">C–D (0%+) — Learning</div>
          <p class="text-slate-400 text-xs">Early stages, keep practicing</p>
        </div>
      </div>
    </div>

    <!-- Tips to Improve -->
    <div class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#0f0f23] to-slate-950 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="text-2xl">⚡</div>
        <h2 class="text-xl font-bold text-lime-400">How to Improve Your Ranks</h2>
      </div>
      <div class="space-y-3">
        <div class="bg-slate-800/40 rounded-lg p-4">
          <h3 class="font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <span>📈</span> Raise Global Rank
          </h3>
          <ul class="text-slate-400 text-sm space-y-1 ml-4">
            <li>• Focus on accuracy: Take quizzes more carefully</li>
            <li>• Review weak items that appear frequently</li>
            <li>• Practice consistently to reinforce memory</li>
            <li>• Aim for 90%+ accuracy on completed decks</li>
          </ul>
        </div>
        <div class="bg-slate-800/40 rounded-lg p-4">
          <h3 class="font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <span>🎯</span> Raise Synthetic Rank
          </h3>
          <ul class="text-slate-400 text-sm space-y-1 ml-4">
            <li>• Push mastery peaks higher on each deck</li>
            <li>• Maintain consistent accuracy throughout</li>
            <li>• Learn more decks to unlock diversity bonus</li>
            <li>• Balance depth (high peaks) with breadth (more decks)</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RankSimulator from './RankSimulator.vue'

export default {
  name: 'RankingInfo',
  components: { RankSimulator },
}
</script>

<style scoped>
</style>
