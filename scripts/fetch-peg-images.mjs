// Fetches Wikipedia thumbnail URLs for all 20 Peg Matrix concepts.
// Run once: node scripts/fetch-peg-images.mjs
// Paste the printed PEG_IMAGES object into js/data/peg-matrix.js

const PEG_AUDIO  = { 0:'Hero', 1:'Bun', 2:'Shoe', 3:'Tree', 4:'Door', 5:'Hive', 6:'Sticks', 7:'Heaven', 8:'Gate', 9:'Wine' };
const PEG_VISUAL = { 0:'Ball', 1:'Paintbrush', 2:'Swan', 3:'Heart', 4:'Yacht', 5:'Hook', 6:'Bomb', 7:'Axe', 8:'Hourglass', 9:'Balloon' };

async function fetchWikipediaImage(word) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.thumbnail?.source || null;
  } catch (e) {
    console.error(`  Failed for "${word}": ${e.message}`);
    return null;
  }
}

async function main() {
  const audio  = {};
  const visual = {};

  console.error('Fetching audio peg images...');
  for (const [i, word] of Object.entries(PEG_AUDIO)) {
    console.error(`  ${i}: ${word}`);
    audio[i] = await fetchWikipediaImage(word);
  }

  console.error('Fetching visual peg images...');
  for (const [i, word] of Object.entries(PEG_VISUAL)) {
    console.error(`  ${i}: ${word}`);
    visual[i] = await fetchWikipediaImage(word);
  }

  const lines = (obj) =>
    Object.entries(obj)
      .map(([k, v]) => `  ${k}: ${v ? `"${v}"` : 'null'}`)
      .join(',\n');

  console.log(`const PEG_IMAGES = {
  audio: {
${lines(audio)}
  },
  visual: {
${lines(visual)}
  }
};`);
}

main();
