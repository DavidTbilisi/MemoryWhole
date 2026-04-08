// ── Binary (4-bit) ────────────────────────────────────────────────────────────
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


const BINARY_IMAGES = {
  "1000": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Large_bonfire.jpg/330px-Large_bonfire.jpg",
  "1001": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Saarlouis_Bombe.jpg/330px-Saarlouis_Bombe.jpg",
  "1010": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Grosser_Panda.JPG/330px-Grosser_Panda.JPG",
  "1011": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Sinosauropteryxfossil.jpg/330px-Sinosauropteryxfossil.jpg",
  "1100": "https://upload.wikimedia.org/wikipedia/en/thumb/0/02/Hammersmith_Ghost.PNG/330px-Hammersmith_Ghost.PNG",
  "1101": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Snail.jpg/330px-Snail.jpg",
  "1110": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/The_Sun_in_white_light.jpg/330px-The_Sun_in_white_light.jpg",
  "1111": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Air_Jordan_1_Banned.jpg/330px-Air_Jordan_1_Banned.jpg",
  "0000": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Colubridae-01.jpg/330px-Colubridae-01.jpg",
  "0001": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Target_223_Savage_10FP_25_shot.jpg/330px-Target_223_Savage_10FP_25_shot.jpg",
  "0010": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Blausen_0657_MultipolarNeuron.png/330px-Blausen_0657_MultipolarNeuron.png",
  "0011": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/330px-FullMoon2010.jpg",
  "0100": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/The_Sun_in_white_light.jpg/330px-The_Sun_in_white_light.jpg",
  "0101": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Padlock_kl%C3%B3dka_ubt.JPG/330px-Padlock_kl%C3%B3dka_ubt.JPG",
  "0110": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Goblin_illustration_from_19th_century.png/330px-Goblin_illustration_from_19th_century.png",
  "0111": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Damascus_Bowie.jpg/330px-Damascus_Bowie.jpg"
};
