<template>
  <div style="font-family:Segoe UI,system-ui,sans-serif;padding:2rem;background:#0f1724;color:#e6eef8;min-height:100vh">
    <h1>Mnemonic Training — Vue PoC</h1>
    <p>Proof-of-concept: Home mastery badge as a Vue component.</p>
    <div style="display:flex;gap:1rem;margin-top:1rem">
      <HomeBadge deck="major" :initial="initialMastery" />
      <HomeBadge deck="sem3" :initial="30" />
    </div>
  </div>
</template>

<script>
import HomeBadge from './components/HomeBadge.vue';

export default {
  name: 'App',
  components: { HomeBadge },
  data() {
    // read current mastery peak from localStorage if available
    const peaks = JSON.parse(localStorage.getItem('masteryPeak_v1') || '{}');
    return { initialMastery: peaks.major || 20 };
  }
}
</script>

<style>
/* simple styling to make the badge visible */
</style>
