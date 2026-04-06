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

const PEG_IMAGES_RU = {
  audio: {
    0: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/TableSaltRussia.jpg/330px-TableSaltRussia.jpg",
    1: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/The_English_Gentleman_Richard_Brathwait_by_Robert_Vaughan_1630.jpg/330px-The_English_Gentleman_Richard_Brathwait_by_Robert_Vaughan_1630.jpg",
    2: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Portrait_of_owls.jpg/330px-Portrait_of_owls.jpg",
    3: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Jury_box_cropped.jpg/330px-Jury_box_cropped.jpg",
    4: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/TwoDumbbells.JPG/330px-TwoDumbbells.JPG",
    5: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/3399_-_Fiescheralp_-_Hotel_Eggishorn.JPG/330px-3399_-_Fiescheralp_-_Hotel_Eggishorn.JPG",
    6: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Goosebumps_in_cat.jpg/330px-Goosebumps_in_cat.jpg",
    7: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/%D0%9A%D1%80%D0%B5%D1%81%D1%82%D1%8C%D1%8F%D0%BD%D1%81%D0%BA%D0%B0%D1%8F_%D1%81%D0%B5%D0%BC%D1%8C%D1%8F_%D0%A2%D1%8E%D1%80%D1%8F%D0%BA%D0%BE%D0%B2%D1%8B%D1%85.JPG/330px-%D0%9A%D1%80%D0%B5%D1%81%D1%82%D1%8C%D1%8F%D0%BD%D1%81%D0%BA%D0%B0%D1%8F_%D1%81%D0%B5%D0%BC%D1%8C%D1%8F_%D0%A2%D1%8E%D1%80%D1%8F%D0%BA%D0%BE%D0%B2%D1%8B%D1%85.JPG",
    8: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Kose-K%C3%A4bli_tee.jpg/330px-Kose-K%C3%A4bli_tee.jpg",
    9: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Reeve_and_Serfs.jpg/330px-Reeve_and_Serfs.jpg"
  },
  visual: {
    0: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Cercle_bleu_barre.svg/langru-330px-Cercle_bleu_barre.svg.png",
    1: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/LA2_Skultuna_kontorsljusstake.jpg/330px-LA2_Skultuna_kontorsljusstake.jpg",
    2: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Mute.swan.touchdown.arp.jpg/330px-Mute.swan.touchdown.arp.jpg",
    3: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Heart_numlabels.svg/langru-330px-Heart_numlabels.svg.png",
    4: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/%D0%A0%D0%B8%D1%81%D1%83%D0%BD%D0%BA%D0%B8_%D0%BA_%D1%81%D1%82%D0%B0%D1%82%D1%8C%D0%B5_%C2%AB%D0%9F%D0%B0%D1%80%D1%83%D1%81%D0%B0%C2%BB._%D0%92%D0%BE%D0%B5%D0%BD%D0%BD%D0%B0%D1%8F_%D1%8D%D0%BD%D1%86%D0%B8%D0%BA%D0%BB%D0%BE%D0%BF%D0%B5%D0%B4%D0%B8%D1%8F_%D0%A1%D1%8B%D1%82%D0%B8%D0%BD%D0%B0_%28%D0%A1%D0%B0%D0%BD%D0%BA%D1%82-%D0%9F%D0%B5%D1%82%D0%B5%D1%80%D0%B1%D1%83%D1%80%D0%B3%2C_1911-1915%29.jpg/330px-%D0%A0%D0%B8%D1%81%D1%83%D0%BD%D0%BA%D0%B8_%D0%BA_%D1%81%D1%82%D0%B0%D1%82%D1%8C%D0%B5_%C2%AB%D0%9F%D0%B0%D1%80%D1%83%D1%81%D0%B0%C2%BB._%D0%92%D0%BE%D0%B5%D0%BD%D0%BD%D0%B0%D1%8F_%D1%8D%D0%BD%D1%86%D0%B8%D0%BA%D0%BB%D0%BE%D0%BF%D0%B5%D0%B4%D0%B8%D1%8F_%D0%A1%D1%8B%D1%82%D0%B8%D0%BD%D0%B0_%28%D0%A1%D0%B0%D0%BD%D0%BA%D1%82-%D0%9F%D0%B5%D1%82%D0%B5%D1%80%D0%B1%D1%83%D1%80%D0%B3%2C_1911-1915%29.jpg",
    5: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/KamAZ-53213_Kranaufbau.jpg/330px-KamAZ-53213_Kranaufbau.jpg",
    6: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Bandy.jpg/330px-Bandy.jpg",
    7: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Axt_2.jpg/330px-Axt_2.jpg",
    8: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/MuseumBellerive.JPG/330px-MuseumBellerive.JPG",
    9: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Congrats_bqt.jpg/330px-Congrats_bqt.jpg"
  }
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
