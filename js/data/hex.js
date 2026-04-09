// ── Hex (4-bit / 1 hex digit) ───────────────────────────────────────────────
// Hex digit 0-F maps to AB CD where AB = element (MSB) and CD = quality (LSB)

const HEX_DATA = {
  '0': '🔥🔥 inferno wall',
  '1': '🧨 sparks shooting',
  '2': '🪵 glowing ember',
  '3': '♨️ steam explosion',
  '4': '🌵 burning wind',
  '5': '🌪 dust tornado',
  '6': '❄️💨 freezing gust',
  '7': '⛈ storm',
  '8': '♨️ boiling water',
  '9': '☀️ evaporation',
  A: '🧊 ice',
  B: '🌊 crashing wave',
  C: '🌋 lava',
  D: '🏜 cracked ground',
  E: '🧊🪨 frozen rock',
  F: '🪨💧 mud',
};

const HEX_META = [
  { hex: '0', bits: '0000', element: 'fire', quality: 'hot', event: 'inferno wall', emoji: '🔥🔥' },
  { hex: '1', bits: '0001', element: 'fire', quality: 'dry', event: 'sparks shooting', emoji: '🧨' },
  { hex: '2', bits: '0010', element: 'fire', quality: 'cold', event: 'glowing ember', emoji: '🪵' },
  { hex: '3', bits: '0011', element: 'fire', quality: 'wet', event: 'steam explosion', emoji: '♨️' },
  { hex: '4', bits: '0100', element: 'air', quality: 'hot', event: 'burning wind', emoji: '🌵' },
  { hex: '5', bits: '0101', element: 'air', quality: 'dry', event: 'dust tornado', emoji: '🌪' },
  { hex: '6', bits: '0110', element: 'air', quality: 'cold', event: 'freezing gust', emoji: '❄️💨' },
  { hex: '7', bits: '0111', element: 'air', quality: 'wet', event: 'storm', emoji: '⛈' },
  { hex: '8', bits: '1000', element: 'water', quality: 'hot', event: 'boiling water', emoji: '♨️' },
  { hex: '9', bits: '1001', element: 'water', quality: 'dry', event: 'evaporation', emoji: '☀️' },
  { hex: 'A', bits: '1010', element: 'water', quality: 'cold', event: 'ice', emoji: '🧊' },
  { hex: 'B', bits: '1011', element: 'water', quality: 'wet', event: 'crashing wave', emoji: '🌊' },
  { hex: 'C', bits: '1100', element: 'earth', quality: 'hot', event: 'lava', emoji: '🌋' },
  { hex: 'D', bits: '1101', element: 'earth', quality: 'dry', event: 'cracked ground', emoji: '🏜' },
  { hex: 'E', bits: '1110', element: 'earth', quality: 'cold', event: 'frozen rock', emoji: '🧊🪨' },
  { hex: 'F', bits: '1111', element: 'earth', quality: 'wet', event: 'mud', emoji: '🪨💧' },
];

const HEX_IMAGES = {
  // Empty by design so the app generates themed fallback cards for this deck.
};
