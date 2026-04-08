<template>
  <div class="space-y-6">
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
export default {
  name: 'RankingInfo'
}
</script>

<style scoped>
</style>
