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
