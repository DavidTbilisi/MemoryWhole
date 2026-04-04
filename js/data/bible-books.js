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
