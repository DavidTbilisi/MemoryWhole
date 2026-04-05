// ── Peg Matrix RU (00–99) ─────────────────────────────────────────────────
// A 10×10 grid combining two Russian peg systems:
//   Peg Audio  (tens digit, rhyme-based): 0=соль 1=господин 2=сова   3=жюри   4=гири
//                                         5=кровать 6=шерсть 7=семья 8=осень  9=челядь
//   Peg Visual (units digit, shape-based):0=🛟круг  1=🕯свеча 2=🦢лебедь 3=❤️сердце 4=⛵парус
//                                         5=🪝крюк  6=🏒клюшка 7=🪓топор 8=⛄снеговик 9=🎈шарик
//
// Quiz answer = "AudioPeg + VisualPeg"  (key = zero-padded two-digit string)

const PEG_AUDIO_RU = {
  0: 'соль',      1: 'господин', 2: 'сова',   3: 'жюри',    4: 'гири',
  5: 'кровать',   6: 'шерсть',   7: 'семья',  8: 'осень',   9: 'челядь'
};

const PEG_VISUAL_RU = {
  0: '🛟 круг',   1: '🕯 свеча',    2: '🦢 лебедь',   3: '❤️ сердце',    4: '⛵ парус',
  5: '🪝 крюк',   6: '🏒 клюшка',   7: '🪓 топор',     8: '⛄ снеговик',  9: '🎈 шарик'
};

// Generate all 100 combinations
const PEG_MATRIX_RU_DATA = (() => {
  const d = {};
  for (let i = 0; i <= 99; i++) {
    const key = String(i).padStart(2, '0');
    d[key] = `${PEG_AUDIO_RU[Math.floor(i / 10)]} + ${PEG_VISUAL_RU[i % 10]}`;
  }
  return d;
})();
