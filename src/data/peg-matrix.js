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

const PEG_IMAGES = {
  audio: {
    0: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Achilles_fighting_against_Memnon_Leiden_Rijksmuseum_voor_Oudheden.jpg/330px-Achilles_fighting_against_Memnon_Leiden_Rijksmuseum_voor_Oudheden.jpg",
    1: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Sesame_seed_hamburger_buns.jpg/330px-Sesame_seed_hamburger_buns.jpg",
    2: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Skor_fr%C3%A5n_1700-_till_1960-talet_-_Nordiska_Museet_-_NMA.0056302.jpg/330px-Skor_fr%C3%A5n_1700-_till_1960-talet_-_Nordiska_Museet_-_NMA.0056302.jpg",
    3: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Usamljeni_jasen_-_panoramio_%28cropped%29.jpg/330px-Usamljeni_jasen_-_panoramio_%28cropped%29.jpg",
    4: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/L-door.png/330px-L-door.png",
    5: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Beehives_in_Butte_County_%282025%29-104A8312.jpg/330px-Beehives_in_Butte_County_%282025%29-104A8312.jpg",
    6: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Une_canne_de_marchand_Ch%C3%A2lus.jpg/330px-Une_canne_de_marchand_Ch%C3%A2lus.jpg",
    7: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Paradiso_Canto_31_%28148200393%29.jpg/330px-Paradiso_Canto_31_%28148200393%29.jpg",
    8: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Gate_of_the_BCR_Headquarters_Building_%28Bucharest%2C_Romania%29.jpg/330px-Gate_of_the_BCR_Headquarters_Building_%28Bucharest%2C_Romania%29.jpg",
    9: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Red_and_white_wine_in_glass.jpg/330px-Red_and_white_wine_in_glass.jpg"
  },
  visual: {
    0: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Many_balls.jpg/330px-Many_balls.jpg",
    1: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Paintbrushes.jpg/330px-Paintbrushes.jpg",
    2: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mute_Swan_Emsworth2.JPG/330px-Mute_Swan_Emsworth2.JPG",
    3: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Heart_anterior_exterior_view.png/330px-Heart_anterior_exterior_view.png",
    4: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Bavaria_Cruiser_45.jpg/330px-Bavaria_Cruiser_45.jpg",
    5: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/KamAZ-53213_Kranaufbau.jpg/330px-KamAZ-53213_Kranaufbau.jpg",
    6: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Saarlouis_Bombe.jpg/330px-Saarlouis_Bombe.jpg",
    7: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Felling_axe.jpg/330px-Felling_axe.jpg",
    8: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Half-hour_sand_glass_MET_ES268.jpg/330px-Half-hour_sand_glass_MET_ES268.jpg",
    9: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Congrats_bqt.jpg/330px-Congrats_bqt.jpg"
  }
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

// Generate pegmatrix images by combining audio (tens digit) and visual (units digit) side by side
const PEG_MATRIX_IMAGES = (() => {
  const out = {};
  for (let i = 0; i <= 99; i++) {
    const key = String(i).padStart(2, '0');
    const audioIdx = Math.floor(i / 10);
    const visualIdx = i % 10;
    out[key] = {
      audio: PEG_IMAGES.audio[audioIdx],
      visual: PEG_IMAGES.visual[visualIdx]
    };
  }
  return out;
})();

export { PEG_AUDIO, PEG_VISUAL, PEG_IMAGES, PEG_MATRIX_DATA, PEG_MATRIX_IMAGES }
