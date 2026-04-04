const LS_KEY = 'majorSystemData_v2';

const DEFAULTS = {
   0:"Saw",   1:"Day",   2:"Noah",  3:"Mew",    4:"Ra",
   5:"Law",   6:"Jaw",   7:"Key",   8:"Ava",    9:"Bay",
  10:"Daze", 11:"Dad",  12:"DNA",  13:"Dome",  14:"Dairy",
  15:"Dale", 16:"Dash", 17:"Dog",  18:"Diva",  19:"Dab",
  20:"NASA", 21:"Net",  22:"Nun",  23:"Name",  24:"Nero",
  25:"Nail", 26:"Niche",27:"Nag",  28:"Navy",  29:"Nab",
  30:"Mace", 31:"Mat",  32:"Man",  33:"Ma'am", 34:"Mare",
  35:"Mail", 36:"Mash", 37:"Mac",  38:"Mafia", 39:"Map",
  40:"Race", 41:"Rat",  42:"Rain", 43:"Ram",   44:"Ra-ra",
  45:"Rail", 46:"Rage", 47:"Rack", 48:"Rafia", 49:"Rap",
  50:"Lace", 51:"Lad",  52:"Lane", 53:"Lama",  54:"Lair",
  55:"Lily", 56:"Lash", 57:"Lake", 58:"Lava",  59:"Lab",
  60:"Chase",61:"Chat", 62:"Chain",63:"Chime", 64:"Chair",
  65:"Cello",66:"Cha-cha",67:"Check",68:"Chaff",69:"Chap",
  70:"Case", 71:"Cat",  72:"Can",  73:"Cameo", 74:"Car",
  75:"Call", 76:"Cage", 77:"Cake", 78:"Cafe",  79:"Cab",
  80:"Face", 81:"Fad",  82:"Fan",  83:"Fame",  84:"Fair",
  85:"Fall", 86:"Fish", 87:"Fog",  88:"Fife",  89:"Fab",
  90:"Base", 91:"Bat",  92:"Ban",  93:"Bam",   94:"Bar",
  95:"Ball", 96:"Bash", 97:"Back", 98:"Beef",  99:"Babe"
};

const SEM3_DATA = {
  "0100":"Vision - Dinosaur",  "0200":"Vision - Nobility",   "0300":"Vision - Moonlight",
  "0400":"Vision - Ravine",    "0500":"Vision - Lightning",   "0600":"Vision - Church",
  "0700":"Vision - Concorde",  "0800":"Vision - Fire",        "0900":"Vision - Painting",
  "1000":"Sound - Sing",       "1100":"Sound - Drum",         "1200":"Sound - Neigh",
  "1300":"Sound - Moan",       "1400":"Sound - Roar",         "1500":"Sound - Lap",
  "1600":"Sound - Shh",        "1700":"Sound - Gong",         "1800":"Sound - Violine",
  "1900":"Sound - Piano",      "2000":"Smell - Seaweed",      "2100":"Smell - Tar",
  "2200":"Smell - Nutmeg",     "2300":"Smell - Mint",         "2400":"Smell - Rose",
  "2500":"Smell - Leather",    "2600":"Smell - Cheese",       "2700":"Smell - Coffee",
  "2800":"Smell - Forest",     "2900":"Smell - Bread",        "3000":"Taste - Spaghetti",
  "3100":"Taste - Tomato",     "3200":"Taste - Nuts",         "3300":"Taste - Mango",
  "3400":"Taste - Rhubarb",    "3500":"Taste - Lemon",        "3600":"Taste - Cherry",
  "3700":"Taste - Custard",    "3800":"Taste - Fudge",        "3900":"Taste - Banana",
  "4000":"Touch - Sand",       "4100":"Touch - Dump",         "4200":"Touch - Newspaper",
  "4300":"Touch - Mud",        "4400":"Touch - Rock",         "4500":"Touch - Lather",
  "4600":"Touch - Jelly",      "4700":"Touch - Grass",        "4800":"Touch - Velvet",
  "4900":"Touch - Bark",       "5000":"Sensation - Swim",     "5100":"Sensation - Dancing",
  "5200":"Sensation - Nuzzling","5300":"Sensation - Mingling","5400":"Sensation - Rubbing",
  "5500":"Sensation - Loving", "5600":"Sensation - Shaking",  "5700":"Sensation - Climbing",
  "5800":"Sensation - Flying", "5900":"Sensation - Peace",    "6000":"Animals - Zebra",
  "6100":"Animals - Deer",     "6200":"Animals - Newt",       "6300":"Animals - Monkey",
  "6400":"Animals - Rhino",    "6500":"Animals - Elephant",   "6600":"Animals - Giraffe",
  "6700":"Animals - Kangaroo", "6800":"Animals - Fox",        "6900":"Animals - Bear",
  "7000":"Birds - Seagull",    "7100":"Birds - Duck",         "7200":"Birds - Nighteagle",
  "7300":"Birds - Magpie",     "7400":"Birds - Robin",        "7500":"Birds - Lark",
  "7600":"Birds - Chicken",    "7700":"Birds - Kingfisher",   "7800":"Birds - Flamingo",
  "7900":"Birds - Peacock",    "8000":"Rainbow - Red",        "8100":"Rainbow - Orange",
  "8200":"Rainbow - Yellow",   "8300":"Rainbow - Green",      "8400":"Rainbow - Blue",
  "8500":"Rainbow - Indigo",   "8600":"Rainbow - Violet",     "8700":"Rainbow - Black",
  "8800":"Rainbow - Gray",     "8900":"Rainbow - White",      "9000":"Solar-System - Sun",
  "9100":"Solar-System - Mercury","9200":"Solar-System - Venus","9300":"Solar-System - Earth",
  "9400":"Solar-System - Mars","9500":"Solar-System - Jupiter","9600":"Solar-System - Saturn",
  "9700":"Solar-System - Uranus","9800":"Solar-System - Neptune","9900":"Solar-System - Pluto"
};

// ── Month Days (Georgian ABC) ─────────────────────────────────────────────
// Quiz answer = first word of each mnemonic sentence
const MONTHS_DATA = {
   "1":"არწივი",   "2":"ბუ",         "3":"გოჭი",       "4":"დინოზავრი",
   "5":"ენოტი",    "6":"ვეშაპი",     "7":"ზებრა",      "8":"თხუნელა",
   "9":"ირემი",   "10":"კატა",      "11":"ლოკოკინა",  "12":"მგელი",
  "13":"ნიანგი",    "14":"ოფოფი",     "15":"პეპელა",    "16":"ჟირაფი",
  "17":"რჩეული", "18":"სპილო",     "19":"ტორნადო",   "20":"ულაყი",
  "21":"ფლამინგო","22":"ქამელეონი", "23":"ღამურა",    "24":"ყვავი",
  "25":"შველი",  "26":"ჩიტი",      "27":"ცხვარი",    "28":"ძროხა",
  "29":"წიწილა", "30":"ჭიამაია",   "31":"ხარი",      "32":"ჯიხვი",
  "33":"ჰიპოპოტამი"
};

// Full mnemonic sentences for the preview table
const MONTHS_FULL = {
   "1":"არწივი ანანო ამაღლებულ აივანზე",
   "2":"ბუ ბექა ბებერ ბუდეში",
   "3":"გოჭი გრიგოლი გალუმპული გემზე",
   "4":"დინოზავრი დიანა დახრილ დერეფანში",
   "5":"ენოტი ელენე ეკოლოგიურ ეზოში",
   "6":"ვეშაპი ვეფხვი ვიკა ვრცელი ვენტილატორთან",
   "7":"ზებრა ზვიადი ზუსტი ზონა",
   "8":"თხუნელა თხა თეკლა თბილი თარო",
   "9":"ირემი ირმა იშვიათი იატაკი",
  "10":"კატა კნუტი კურდღელი კესო კეთილი კარადა",
  "11":"ლოკოკინა ლიკა ლამაზი ლოგინი",
  "12":"მგელი მარიამი მგრძნობიარე მინდორი",
  "13":"ნიანგი ნინი ნაზი ნაძვნარი",
  "14":"ოფოფი ობობა ოთარი ოსტატური ოთახი",
  "15":"პეპელა პაპუნა პატიოსანი პურის ქარხანა",
  "16":"ჟირაფი ჟოზე ჟანგიან ჟალუზებთან",
  "17":"რჩეული რეზო რბილი რაფა",
  "18":"სპილო სოფო სასიამოვნო სკამი",
  "19":"ტურა ტერენტი ტკბილი ტუალეტი",
  "20":"ულაყი ულისე უდარდელი უჯრაში",
  "21":"ფლამინგო ფატი ფრთხილი ფანჯარასთან",
  "22":"ქამელეონი ქეთი ქარიანი ქოლგის ქვეშ",
  "23":"ღამურა ღვთისო ღრმა ღობე",
  "24":"ყვავი ყარამან ყვავილოვანი ყუთი",
  "25":"შველი შორენა შუშხუნა შუქნიშანთან",
  "26":"ჩიტი ჩიორა ჩუმი ჩანთაში",
  "27":"ცხვარი ციცინო ცნობისმოყვარე ცარიელ კუთხეში",
  "28":"ძროხა ძიძია ძველი ძეგლთან",
  "29":"წიწილა წიკო წითელი წინა ოთახში",
  "30":"ჭიამაია ჭრელა ჭრელ ჭიშკართან",
  "31":"ხარი ხატია ხუთვარსკვლავიან ხეზე",
  "32":"ჯიხვი ჯეინი ჯანსაღ ჯემში",
  "33":"ჰიპოპოტამი ჰექტორი ჰარმონიულ ჰოლში"
};

// ── Binary (4-bit) ───────────────────────────────────────────────────────
// Quiz answer = "emoji image (syllable)"  ·  key = 4-bit binary string
const BINARY_DATA = {
  "0000": "🐍 snake (sa)",
  "0001": "🎯 target (to)",
  "0010": "🧬 neuron (na)",
  "0011": "🌙 moon (mo)",
  "0100": "☀️ sun (ra)",
  "0101": "🔒 lock (lo)",
  "0110": "👺 goblin (ga)",
  "0111": "🔪 knife (ko)",
  "1000": "🔥 fire (fa)",
  "1001": "💣 bomb (bo)",
  "1010": "🐼 panda (pa)",
  "1011": "🦕 dinosaur (da)",
  "1100": "👻 ghost (ha)",
  "1101": "🐌 snail (sna)",
  "1110": "⭐ star (sta)",
  "1111": "👟 shoe (sho)"
};

// Extra info for preview table
const BINARY_META = [
  { bits:"0000", syllable:"sa",  image:"snake",    emoji:"🐍" },
  { bits:"0001", syllable:"to",  image:"target",   emoji:"🎯" },
  { bits:"0010", syllable:"na",  image:"neuron",   emoji:"🧬" },
  { bits:"0011", syllable:"mo",  image:"moon",     emoji:"🌙" },
  { bits:"0100", syllable:"ra",  image:"sun",      emoji:"☀️" },
  { bits:"0101", syllable:"lo",  image:"lock",     emoji:"🔒" },
  { bits:"0110", syllable:"ga",  image:"goblin",   emoji:"👺" },
  { bits:"0111", syllable:"ko",  image:"knife",    emoji:"🔪" },
  { bits:"1000", syllable:"fa",  image:"fire",     emoji:"🔥" },
  { bits:"1001", syllable:"bo",  image:"bomb",     emoji:"💣" },
  { bits:"1010", syllable:"pa",  image:"panda",    emoji:"🐼" },
  { bits:"1011", syllable:"da",  image:"dinosaur", emoji:"🦕" },
  { bits:"1100", syllable:"ha",  image:"ghost",    emoji:"👻" },
  { bits:"1101", syllable:"sna", image:"snail",    emoji:"🐌" },
  { bits:"1110", syllable:"sta", image:"star",     emoji:"⭐" },
  { bits:"1111", syllable:"sho", image:"shoe",     emoji:"👟" },
];

// ── Calendar Months ──────────────────────────────────────────────────────
// Quiz answer = icon name for each month
const CALENDAR_DATA = {
   "1":"Umbrella",    // January  – Rainy & cold
   "2":"Heart",       // February – Valentine's Day
   "3":"Snowman",     // March    – Freezing month
   "4":"Easter Egg",  // April    – Easter
   "5":"Mother",      // May      – Mother's Day
   "6":"Bride",       // June     – June's Bride
   "7":"Cowboy Hat",  // July     – Independence Day
   "8":"Sun",         // August   – Very hot month
   "9":"Maple Leaf",  // September– Start of Fall
  "10":"Pumpkin",     // October  – Halloween
  "11":"Turkey",      // November – Thanksgiving
  "12":"Santa"        // December – Christmas
};

// ── Bible Overview ───────────────────────────────────────────────────────
// Quiz answer = section name + range  (key = section number 1-10)
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

// ── Bible Books ───────────────────────────────────────────────────────────
// Quiz answer = book name  (key = canonical book number 1-66)
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

// Extra info for preview table (from Bible_66_Cinematic_Mnemonics.json)
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

// ── Clocks ────────────────────────────────────────────────────────────────
// Quiz answer = clock name
const CLOCKS_DATA = {
  "12:00":"Wells Cathedral clock",
  "13:00":"Zytglogge",
  "14:00":"Prague Astronomical Clock",
  "15:00":"St Mark's Clock",
  "16:00":"Ulm Town Hall Astronomical Clock",
  "17:00":"Sighișoara Clock Tower",
  "18:00":"Astronomical Clock of Lyon",
  "19:00":"Spasskaya Tower Clock",
  "20:00":"Atlas Clock",
  "21:00":"Big Ben",
  "22:00":"Église Sainte-Croix Clock",
  "23:00":"Dolmabahçe Clock Tower",
  "00:00":"City Hall Clock",
  "01:00":"Orsay Station Clock",
  "02:00":"Edwardian Clock & Tower",
  "03:00":"Grand Central Terminal Clock",
  "04:00":"Anker Clock",
  "05:00":"Peace Tower",
  "06:00":"Selfridges Clock",
  "07:00":"Binns Clock",
  "08:00":"Allen-Bradley Clock Tower",
  "09:00":"World Clock",
  "10:00":"Leaning Clock Tower",
  "11:00":"Makkah Royal Clock Tower"
};

// Extra info shown in the preview table only
const CLOCKS_META = [
  { time:"12:00", name:"Wells Cathedral clock",          location:"England",               year:"1392", mnemonic:"DuMB Nun"      },
  { time:"13:00", name:"Zytglogge",                      location:"Bern, Switzerland",     year:"1405", mnemonic:"Tears Lollipop"},
  { time:"14:00", name:"Prague Astronomical Clock",      location:"Czech, Prague",         year:"1410", mnemonic:"Tart sauce"    },
  { time:"15:00", name:"St Mark's Clock",                location:"Venice, Italy",         year:"1499", mnemonic:"Drop Baby"     },
  { time:"16:00", name:"Ulm Town Hall Astronomical Clock",location:"Germany",              year:"1520", mnemonic:"TeLeNewS"      },
  { time:"17:00", name:"Sighișoara Clock Tower",         location:"Romania",               year:"1648", mnemonic:"DJ roof"       },
  { time:"18:00", name:"Astronomical Clock of Lyon",     location:"France, Lyon",          year:"1661", mnemonic:"Attach Judah"  },
  { time:"19:00", name:"Spasskaya Tower Clock",          location:"Russia",                year:"1852", mnemonic:"Devil Nail"    },
  { time:"20:00", name:"Atlas Clock",                    location:"Tiffany, NYC",          year:"1853", mnemonic:"Diva Lamb"     },
  { time:"21:00", name:"Big Ben",                        location:"London",                year:"1859", mnemonic:"Tough Lip"     },
  { time:"22:00", name:"Église Sainte-Croix Clock",      location:"Nantes, France",        year:"1860", mnemonic:"TV jazz"       },
  { time:"23:00", name:"Dolmabahçe Clock Tower",         location:"Istanbul, Türkiye",     year:"1895", mnemonic:"Diva Pail"     },
  { time:"00:00", name:"City Hall Clock",                location:"Philadelphia",           year:"1898", mnemonic:"Dive Buffet"   },
  { time:"01:00", name:"Orsay Station Clock",            location:"Paris",                 year:"1900", mnemonic:"Top Sauce"     },
  { time:"02:00", name:"Edwardian Clock & Tower",        location:"US, Dorchester",        year:"1905", mnemonic:"shTePSeLi"     },
  { time:"03:00", name:"Grand Central Terminal Clock",   location:"New York City",         year:"1913", mnemonic:"Top Dome"      },
  { time:"04:00", name:"Anker Clock",                    location:"Vienna, Austria",       year:"1914", mnemonic:"Debater"       },
  { time:"05:00", name:"Peace Tower",                    location:"Ottawa, Canada",        year:"1920", mnemonic:"Top news"      },
  { time:"06:00", name:"Selfridges Clock",               location:"London, Oxford St",     year:"1931", mnemonic:"Dope mad"      },
  { time:"07:00", name:"Binns Clock",                    location:"Edinburgh, Scotland",   year:"1960", mnemonic:"Top Jazz"      },
  { time:"08:00", name:"Allen-Bradley Clock Tower",      location:"Milwaukee, Wisconsin",  year:"1962", mnemonic:"BaBaJaN"       },
  { time:"09:00", name:"World Clock",                    location:"Urania, Berlin",        year:"1969", mnemonic:"Top Shop"      },
  { time:"10:00", name:"Leaning Clock Tower",            location:"Tbilisi",               year:"2011", mnemonic:"Nasty Date"    },
  { time:"11:00", name:"Makkah Royal Clock Tower",       location:"Mecca, Saudi Arabia",   year:"2011", mnemonic:"Nasty Date"    },
];
