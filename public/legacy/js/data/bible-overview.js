// ── Bible Overview ────────────────────────────────────────────────────────────
// Quiz answer = section name + range  (key = section number 1–10)

const BIBLE_OVERVIEW_DATA = {
   "1":"📖 Torah — Books 1–5 (5)",
   "2":"⚔️ History — Books 6–17 (12)",
   "3":"📜 Wisdom — Books 18–22 (5)",
   "4":"🔥 Major Prophets — Books 23–27 (5)",
   "5":"🌪️ Minor Prophets — Books 28–39 (12)",
   "6":"✝️ Gospels — Books 40–43 (4)",
   "7":"🚶 Acts — Book 44 (1)",
   "8":"✉️ Pauline Letters — Books 45–57 (13)",
   "9":"📩 General Letters — Books 58–65 (8)",
  "10":"🔥 Revelation — Book 66 (1)"
};

// Images use Major System mnemonic images for each section's representative book:
// Torah(1)→Genesis→Lace(50), History(2)→Joshua→Nero(24), Wisdom(3)→Psalms→Lace(50)
// MajProphets(4)→Isaiah→Cha-cha(66), MinProphets(5)→Jonah→Ra(4)
// Gospels(6)→Matthew→Navy(28), Acts(7)→Acts→Navy(28), Pauline(8)→Romans→Dash(16)
// General(9)→Hebrews→Dome(13), Revelation(10)→Revelation→Nun(22)
const BIBLE_OVERVIEW_IMAGES = (() => {
  const M = typeof MAJOR_IMAGES !== 'undefined' ? MAJOR_IMAGES : {};
  return {
    "1":  M[50],
    "2":  M[24],
    "3":  M[50],
    "4":  M[66],
    "5":  M[4],
    "6":  M[28],
    "7":  M[28],
    "8":  M[16],
    "9":  M[13],
    "10": M[22],
  };
})();
