// ── Binary (4-bit) ────────────────────────────────────────────────────────────
// Quiz answer = cinematic Aristotelian element + quality event  ·  key = 4-bit binary string

const BINARY_DATA = {
  "0000": "🔥🔥 inferno wall of fire",
  "0001": "🧨 sparks shooting like bullets",
  "0010": "🪵 dying ember (glowing coal)",
  "0011": "♨️ steam explosion (fire + water clash)",
  "0100": "🌵 burning desert wind",
  "0101": "🌪 dust tornado (dry storm)",
  "0110": "❄️💨 freezing wind blast",
  "0111": "⛈ rainstorm with heavy wind",
  "1000": "♨️💧 boiling water bubbling violently",
  "1001": "☀️💧 evaporation (water vanishing upward)",
  "1010": "🧊 solid ice block cracking",
  "1011": "🌊 powerful wave crashing",
  "1100": "🌋 lava flowing from rock",
  "1101": "🏜 cracked dry ground splitting",
  "1110": "🧊🪨 frozen rock (permafrost chunk)",
  "1111": "🪨💧 thick mud being squished"
}

// Extra info for preview table
const BINARY_META = [
  { bits: "0000", element: "fire", quality: "hot", event: "inferno wall of fire", emoji: "🔥🔥" },
  { bits: "0001", element: "fire", quality: "dry", event: "sparks shooting like bullets", emoji: "🧨" },
  { bits: "0010", element: "fire", quality: "cold", event: "dying ember", emoji: "🪵" },
  { bits: "0011", element: "fire", quality: "wet", event: "steam explosion", emoji: "♨️" },
  { bits: "0100", element: "air", quality: "hot", event: "burning desert wind", emoji: "🌵" },
  { bits: "0101", element: "air", quality: "dry", event: "dust tornado", emoji: "🌪" },
  { bits: "0110", element: "air", quality: "cold", event: "freezing wind blast", emoji: "❄️💨" },
  { bits: "0111", element: "air", quality: "wet", event: "rainstorm with heavy wind", emoji: "⛈" },
  { bits: "1000", element: "water", quality: "hot", event: "boiling water bubbling violently", emoji: "♨️💧" },
  { bits: "1001", element: "water", quality: "dry", event: "evaporation", emoji: "☀️💧" },
  { bits: "1010", element: "water", quality: "cold", event: "solid ice block cracking", emoji: "🧊" },
  { bits: "1011", element: "water", quality: "wet", event: "powerful wave crashing", emoji: "🌊" },
  { bits: "1100", element: "earth", quality: "hot", event: "lava flowing from rock", emoji: "🌋" },
  { bits: "1101", element: "earth", quality: "dry", event: "cracked dry ground splitting", emoji: "🏜" },
  { bits: "1110", element: "earth", quality: "cold", event: "frozen rock", emoji: "🧊🪨" },
  { bits: "1111", element: "earth", quality: "wet", event: "thick mud being squished", emoji: "🪨💧" },
]

const BINARY_IMAGES = {
  // Empty by design so the app generates themed fallback cards for the new system.
}

export { BINARY_DATA, BINARY_META, BINARY_IMAGES }
