// ── Peg Matrix (00–99) ────────────────────────────────────────────────────────
// A 10×10 grid that combines two peg systems:
//   Peg Audio  (tens digit, rhyme-based): 0=Hero  1=Bun   2=Shoe  3=Tree  4=Door
//                                         5=Hive  6=Sticks 7=Heaven 8=Gate 9=Wine
//   Peg Visual (units digit, shape-based):0=Ball  1=Paintbrush 2=Swan   3=Heart 4=Yacht
//                                         5=Hook  6=Bomb  7=Axe   8=Hourglass 9=Balloon
//
// Quiz answer = "AudioPeg + VisualPeg"  (key = zero-padded two-digit string)

const PEG_AUDIO = {
  0: 'Hero',   1: 'Bun',    2: 'Shoe',   3: 'Tree',  4: 'Door',
  5: 'Hive',   6: 'Sticks', 7: 'Heaven', 8: 'Gate',  9: 'Wine'
};

const PEG_VISUAL = {
  0: 'Ball',   1: 'Paintbrush', 2: 'Swan',      3: 'Heart',    4: 'Yacht',
  5: 'Hook',   6: 'Bomb',       7: 'Axe',        8: 'Hourglass', 9: 'Balloon'
};

// Generate all 100 combinations
const PEG_MATRIX_DATA = (() => {
  const d = {};
  for (let i = 0; i <= 99; i++) {
    const key = String(i).padStart(2, '0');
    d[key] = `${PEG_AUDIO[Math.floor(i / 10)]} + ${PEG_VISUAL[i % 10]}`;
  }
  return d;
})();
