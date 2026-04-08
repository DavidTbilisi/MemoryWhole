import { MAJOR_IMAGES } from './major-system'

// ── Bible Books ───────────────────────────────────────────────────────────────
// Quiz answer = book name  (key = canonical book number 1–66)

const BIBLE_BOOKS_DATA = {
  // ── Torah (1–5) ──────────────────────────────────────────────────────
   "1":"Genesis",        "2":"Exodus",          "3":"Leviticus",
   "4":"Numbers",        "5":"Deuteronomy",
  // ── History (6–17) ──────────────────────────────────────────────────
   "6":"Joshua",         "7":"Judges",          "8":"Ruth",
   "9":"1 Samuel",      "10":"2 Samuel",       "11":"1 Kings",
  "12":"2 Kings",       "13":"1 Chronicles",   "14":"2 Chronicles",
  "15":"Ezra",          "16":"Nehemiah",        "17":"Esther",
  // ── Wisdom (18–22) ──────────────────────────────────────────────────
  "18":"Job",           "19":"Psalms",          "20":"Proverbs",
  "21":"Ecclesiastes",  "22":"Song of Solomon",
  // ── Major Prophets (23–27) ──────────────────────────────────────────
  "23":"Isaiah",        "24":"Jeremiah",        "25":"Lamentations",
  "26":"Ezekiel",       "27":"Daniel",
  // ── Minor Prophets (28–39) ──────────────────────────────────────────
  "28":"Hosea",         "29":"Joel",            "30":"Amos",
  "31":"Obadiah",       "32":"Jonah",           "33":"Micah",
  "34":"Nahum",         "35":"Habakkuk",        "36":"Zephaniah",
  "37":"Haggai",        "38":"Zechariah",       "39":"Malachi",
  // ── Gospels (40–43) ─────────────────────────────────────────────────
  "40":"Matthew",       "41":"Mark",            "42":"Luke",
  "43":"John",
  // ── Acts (44) ───────────────────────────────────────────────────────
  "44":"Acts",
  // ── Pauline Letters (45–57) ─────────────────────────────────────────
  "45":"Romans",        "46":"1 Corinthians",   "47":"2 Corinthians",
  "48":"Galatians",     "49":"Ephesians",       "50":"Philippians",
  "51":"Colossians",    "52":"1 Thessalonians", "53":"2 Thessalonians",
  "54":"1 Timothy",     "55":"2 Timothy",       "56":"Titus",
  "57":"Philemon",
  // ── General Letters (58–65) ─────────────────────────────────────────
  "58":"Hebrews",       "59":"James",           "60":"1 Peter",
  "61":"2 Peter",       "62":"1 John",          "63":"2 John",
  "64":"3 John",        "65":"Jude",
  // ── Revelation (66) ─────────────────────────────────────────────────
  "66":"Revelation"
};

// Extra info for preview table (cinematic mnemonics)
const BIBLE_BOOKS_META = [
  // ── Torah ──────────────────────────────────────────────────────────────
  { order:1,  book:"Genesis",         ch:50,  section:"Torah",          major:"Lace",     mnemonic:"Genie wraps the newborn Earth in glowing lace" },
  { order:2,  book:"Exodus",          ch:40,  section:"Torah",          major:"Race",     mnemonic:"People sprint through an EXIT while a race track splits the sea" },
  { order:3,  book:"Leviticus",       ch:27,  section:"Torah",          major:"Nag",      mnemonic:"Priest Levi chased by a nagging voice of laws" },
  { order:4,  book:"Numbers",         ch:36,  section:"Torah",          major:"Mash",     mnemonic:"Ra mashes numbers into the sky" },
  { order:5,  book:"Deuteronomy",     ch:34,  section:"Torah",          major:"Mare",     mnemonic:"A mare stomps laws shouting do it again" },
  // ── History ────────────────────────────────────────────────────────────
  { order:6,  book:"Joshua",          ch:24,  section:"History",        major:"Nero",     mnemonic:"Joshua burns walls like Nero destroying Jericho" },
  { order:7,  book:"Judges",          ch:21,  section:"History",        major:"Net",      mnemonic:"Judges trapped in a net deciding cases" },
  { order:8,  book:"Ruth",            ch:4,   section:"History",        major:"Ra",       mnemonic:"Ruth follows Ra through wheat fields" },
  { order:9,  book:"1 Samuel",        ch:31,  section:"History",        major:"Mat",      mnemonic:"Samuel anoints a king on a mat" },
  { order:10, book:"2 Samuel",        ch:24,  section:"History",        major:"Nero",     mnemonic:"David crowned while Nero burns behind" },
  { order:11, book:"1 Kings",         ch:22,  section:"History",        major:"Nun",      mnemonic:"A nun crowns Solomon" },
  { order:12, book:"2 Kings",         ch:25,  section:"History",        major:"Nail",     mnemonic:"Kings nailed to collapsing throne" },
  { order:13, book:"1 Chronicles",    ch:29,  section:"History",        major:"Nab",      mnemonic:"Scribe nabs history scrolls" },
  { order:14, book:"2 Chronicles",    ch:36,  section:"History",        major:"Mash",     mnemonic:"History mashed together" },
  { order:15, book:"Ezra",            ch:10,  section:"History",        major:"Daze",     mnemonic:"Ezra rebuilds in a daze" },
  { order:16, book:"Nehemiah",        ch:13,  section:"History",        major:"Dome",     mnemonic:"A dome rises rebuilding walls" },
  { order:17, book:"Esther",          ch:10,  section:"History",        major:"Daze",     mnemonic:"Esther spins in royal daze" },
  // ── Wisdom ─────────────────────────────────────────────────────────────
  { order:18, book:"Job",             ch:42,  section:"Wisdom",         major:"Rain",     mnemonic:"Job stands under endless rain" },
  { order:19, book:"Psalms",          ch:150, section:"Wisdom",         major:"Day-Lace", mnemonic:"David sings wrapping sun in lace" },
  { order:20, book:"Proverbs",        ch:31,  section:"Wisdom",         major:"Mat",      mnemonic:"Wisdom written on a mat" },
  { order:21, book:"Ecclesiastes",    ch:12,  section:"Wisdom",         major:"DNA",      mnemonic:"Life loops like broken DNA" },
  { order:22, book:"Song of Solomon", ch:8,   section:"Wisdom",         major:"Ava",      mnemonic:"Lovers dance around Ava" },
  // ── Major Prophets ─────────────────────────────────────────────────────
  { order:23, book:"Isaiah",          ch:66,  section:"Maj. Prophets",  major:"Cha-cha",  mnemonic:"Prophet dances cha-cha while shouting" },
  { order:24, book:"Jeremiah",        ch:52,  section:"Maj. Prophets",  major:"Lane",     mnemonic:"Jeremiah cries in a lonely lane" },
  { order:25, book:"Lamentations",    ch:5,   section:"Maj. Prophets",  major:"Law",      mnemonic:"People weep under crushing law" },
  { order:26, book:"Ezekiel",         ch:48,  section:"Maj. Prophets",  major:"Rafia",    mnemonic:"Visions wrapped in rafia" },
  { order:27, book:"Daniel",          ch:12,  section:"Maj. Prophets",  major:"DNA",      mnemonic:"Lions circle glowing DNA" },
  // ── Minor Prophets ─────────────────────────────────────────────────────
  { order:28, book:"Hosea",           ch:14,  section:"Min. Prophets",  major:"Dairy",    mnemonic:"Marriage dripping like spoiled dairy" },
  { order:29, book:"Joel",            ch:3,   section:"Min. Prophets",  major:"Mew",      mnemonic:"Mew cries as fire rains" },
  { order:30, book:"Amos",            ch:9,   section:"Min. Prophets",  major:"Bay",      mnemonic:"Judgment rises from bay" },
  { order:31, book:"Obadiah",         ch:1,   section:"Min. Prophets",  major:"Day",      mnemonic:"One burning day destroys nation" },
  { order:32, book:"Jonah",           ch:4,   section:"Min. Prophets",  major:"Ra",       mnemonic:"Jonah swallowed calling Ra" },
  { order:33, book:"Micah",           ch:7,   section:"Min. Prophets",  major:"Key",      mnemonic:"Justice unlocked by key" },
  { order:34, book:"Nahum",           ch:3,   section:"Min. Prophets",  major:"Mew",      mnemonic:"Mew declares destruction" },
  { order:35, book:"Habakkuk",        ch:3,   section:"Min. Prophets",  major:"Mew",      mnemonic:"Mew questions God" },
  { order:36, book:"Zephaniah",       ch:3,   section:"Min. Prophets",  major:"Mew",      mnemonic:"Mew screams storm judgment" },
  { order:37, book:"Haggai",          ch:2,   section:"Min. Prophets",  major:"Noah",     mnemonic:"Noah rebuilds temple" },
  { order:38, book:"Zechariah",       ch:14,  section:"Min. Prophets",  major:"Dairy",    mnemonic:"Visions drip like dairy" },
  { order:39, book:"Malachi",         ch:4,   section:"Min. Prophets",  major:"Ra",       mnemonic:"Prophet glows like Ra" },
  // ── Gospels ────────────────────────────────────────────────────────────
  { order:40, book:"Matthew",         ch:28,  section:"Gospels",        major:"Navy",     mnemonic:"Gospel spreads across navy fleet" },
  { order:41, book:"Mark",            ch:16,  section:"Gospels",        major:"Dash",     mnemonic:"Fast dash telling story" },
  { order:42, book:"Luke",            ch:24,  section:"Gospels",        major:"Nero",     mnemonic:"Doctor writes while Nero burns" },
  { order:43, book:"John",            ch:21,  section:"Gospels",        major:"Net",      mnemonic:"Divine message spreads like net" },
  // ── Acts ───────────────────────────────────────────────────────────────
  { order:44, book:"Acts",            ch:28,  section:"Acts",           major:"Navy",     mnemonic:"Apostles travel navy routes" },
  // ── Pauline Letters ────────────────────────────────────────────────────
  { order:45, book:"Romans",          ch:16,  section:"Pauline",        major:"Dash",     mnemonic:"Faith spreads in dash" },
  { order:46, book:"1 Corinthians",   ch:16,  section:"Pauline",        major:"Dash",     mnemonic:"Church chaos in dash" },
  { order:47, book:"2 Corinthians",   ch:13,  section:"Pauline",        major:"Dome",     mnemonic:"Paul under pressure dome" },
  { order:48, book:"Galatians",       ch:6,   section:"Pauline",        major:"Jaw",      mnemonic:"Freedom spoken from jaw" },
  { order:49, book:"Ephesians",       ch:6,   section:"Pauline",        major:"Jaw",      mnemonic:"Unity declared by jaw" },
  { order:50, book:"Philippians",     ch:4,   section:"Pauline",        major:"Ra",       mnemonic:"Joy shines like Ra" },
  { order:51, book:"Colossians",      ch:4,   section:"Pauline",        major:"Ra",       mnemonic:"Christ shines like Ra" },
  { order:52, book:"1 Thessalonians", ch:5,   section:"Pauline",        major:"Law",      mnemonic:"Waiting under law" },
  { order:53, book:"2 Thessalonians", ch:3,   section:"Pauline",        major:"Mew",      mnemonic:"Confusion like mew" },
  { order:54, book:"1 Timothy",       ch:6,   section:"Pauline",        major:"Jaw",      mnemonic:"Teaching from jaw" },
  { order:55, book:"2 Timothy",       ch:4,   section:"Pauline",        major:"Ra",       mnemonic:"Final light like Ra" },
  { order:56, book:"Titus",           ch:3,   section:"Pauline",        major:"Mew",      mnemonic:"Guidance like mew" },
  { order:57, book:"Philemon",        ch:1,   section:"Pauline",        major:"Day",      mnemonic:"Forgiveness in one day" },
  // ── General Letters ────────────────────────────────────────────────────
  { order:58, book:"Hebrews",         ch:13,  section:"General",        major:"Dome",     mnemonic:"Christ above in dome" },
  { order:59, book:"James",           ch:5,   section:"General",        major:"Law",      mnemonic:"Faith tested under law" },
  { order:60, book:"1 Peter",         ch:5,   section:"General",        major:"Law",      mnemonic:"Suffering under law" },
  { order:61, book:"2 Peter",         ch:3,   section:"General",        major:"Mew",      mnemonic:"Warnings like mew" },
  { order:62, book:"1 John",          ch:5,   section:"General",        major:"Law",      mnemonic:"Love bound by law" },
  { order:63, book:"2 John",          ch:1,   section:"General",        major:"Day",      mnemonic:"Truth in one day" },
  { order:64, book:"3 John",          ch:1,   section:"General",        major:"Day",      mnemonic:"Hospitality in one day" },
  { order:65, book:"Jude",            ch:1,   section:"General",        major:"Day",      mnemonic:"Defend faith in one day" },
  // ── Revelation ─────────────────────────────────────────────────────────
  { order:66, book:"Revelation",      ch:22,  section:"Revelation",     major:"Nun",      mnemonic:"End revealed by nun" },
];

// Images use the Major System mnemonic image for each book's associated word.
// book → major word → MAJOR_IMAGES key (number)
// Genesis→Lace(50), Exodus→Race(40), Leviticus→Nag(27), Numbers→Mash(36), Deuteronomy→Mare(34)
// Joshua→Nero(24), Judges→Net(21), Ruth→Ra(4), 1Sam→Mat(31), 2Sam→Nero(24)
// 1Kings→Nun(22), 2Kings→Nail(25), 1Chr→Nab(29), 2Chr→Mash(36), Ezra→Daze(10)
// Nehemiah→Dome(13), Esther→Daze(10), Job→Rain(42), Psalms→Day(1)+Lace(50)→use Lace(50)
// Proverbs→Mat(31), Ecclesiastes→DNA(12), SongOfSol→Ava(8)
// Isaiah→Cha-cha(66), Jeremiah→Lane(52), Lamentations→Law(5), Ezekiel→Rafia(48), Daniel→DNA(12)
// Hosea→Dairy(14), Joel→Mew(3), Amos→Bay(9), Obadiah→Day(1), Jonah→Ra(4)
// Micah→Key(7), Nahum→Mew(3), Habakkuk→Mew(3), Zephaniah→Mew(3), Haggai→Noah(2)
// Zechariah→Dairy(14), Malachi→Ra(4)
// Matthew→Navy(28), Mark→Dash(16), Luke→Nero(24), John→Net(21), Acts→Navy(28)
// Romans→Dash(16), 1Cor→Dash(16), 2Cor→Dome(13), Galatians→Jaw(6), Ephesians→Jaw(6)
// Philippians→Ra(4), Colossians→Ra(4), 1Thes→Law(5), 2Thes→Mew(3), 1Tim→Jaw(6)
// 2Tim→Ra(4), Titus→Mew(3), Philemon→Day(1)
// Hebrews→Dome(13), James→Law(5), 1Pet→Law(5), 2Pet→Mew(3), 1John→Law(5)
// 2John→Day(1), 3John→Day(1), Jude→Day(1), Revelation→Nun(22)
const BIBLE_BOOKS_IMAGES = (() => {
  const M = MAJOR_IMAGES || {};
  return {
    "1": M[50],  "2": M[40],  "3": M[27],  "4": M[36],  "5": M[34],
    "6": M[24],  "7": M[21],  "8": M[4],   "9": M[31],  "10": M[24],
    "11": M[22], "12": M[25], "13": M[29], "14": M[36], "15": M[10],
    "16": M[13], "17": M[10], "18": M[42], "19": M[50], "20": M[31],
    "21": M[12], "22": M[8],  "23": M[66], "24": M[52], "25": M[5],
    "26": M[48], "27": M[12], "28": M[14], "29": M[3],  "30": M[9],
    "31": M[1],  "32": M[4],  "33": M[7],  "34": M[3],  "35": M[3],
    "36": M[3],  "37": M[2],  "38": M[14], "39": M[4],  "40": M[28],
    "41": M[16], "42": M[24], "43": M[21], "44": M[28], "45": M[16],
    "46": M[16], "47": M[13], "48": M[6],  "49": M[6],  "50": M[4],
    "51": M[4],  "52": M[5],  "53": M[3],  "54": M[6],  "55": M[4],
    "56": M[3],  "57": M[1],  "58": M[13], "59": M[5],  "60": M[5],
    "61": M[3],  "62": M[5],  "63": M[1],  "64": M[1],  "65": M[1],
    "66": M[22],
  };
})();

export { BIBLE_BOOKS_DATA, BIBLE_BOOKS_IMAGES }
