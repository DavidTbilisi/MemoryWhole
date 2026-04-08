<template>
  <div class="flex gap-4 mb-4">
    <div class="bg-[#071421] px-3 py-2 rounded-xl text-sm text-slate-300">Correct: <strong class="text-white font-bold">{{ correct }}</strong></div>
    <div class="bg-[#071421] px-3 py-2 rounded-xl text-sm text-slate-300">Wrong: <strong class="text-white font-bold">{{ wrong }}</strong></div>
    <div class="bg-[#071421] px-3 py-2 rounded-xl text-sm text-slate-300">Streak: <strong class="text-white font-bold">{{ streak }}</strong></div>
    <div class="bg-[#071421] px-3 py-2 rounded-xl text-sm text-slate-300">Avg: <strong class="text-white font-bold">{{ avg }}</strong></div>
  </div>
</template>

<script>
export default {
  name: 'ScoreBar',
  data(){ return { correct:0, wrong:0, streak:0, avg:'—' } }
}
</script>
