// ── Hex (4-bit / 1 hex digit, using Binary deck mapping) ────────────────
// Hex digit 0-F maps to 4 bits, which are split as:
//   AB (Person), CD (Action), EF (Object), GH (Environment)
// For hex, we use only the first 4 bits (ABCD), so:
//   AB = Person, CD = Action
//   Object and Environment are set to '00' for consistency

// Import the same mapping as binary.js
const _PERSONS = {
  '00': { name: 'Giant', emoji: '🗿', element: 'earth' },
  '01': { name: 'Mermaid', emoji: '🧜', element: 'water' },
  '10': { name: 'Mage', emoji: '🧙', element: 'air' },
  '11': { name: 'Dragon', emoji: '🐉', element: 'fire' },
}

const _ACTIONS = {
  '00': 'crushing',
  '01': 'flowing',
  '10': 'spreading',
  '11': 'exploding',
}

const _OBJECTS = {
  '00': { name: 'rock', emoji: '🧱' },
  '01': { name: 'water', emoji: '💧' },
  '10': { name: 'cloud', emoji: '☁️' },
  '11': { name: 'lightning', emoji: '⚡' },
}

const _ENVIRONMENTS = {
  '00': { scene: '🪨 Red cave', desc: 'glowing rock cavern' },
  '01': { scene: '🌊 Blue ocean', desc: 'deep water world' },
  '10': { scene: '☁️ Green sky', desc: 'floating toxic clouds' },
  '11': { scene: '🌋 Purple storm volcano', desc: 'lava + lightning storm' },
}

const HEX_DATA = {}
const HEX_META = []

for (let i = 0; i < 16; i++) {
  const hex = i.toString(16).toUpperCase()
  const bits = i.toString(2).padStart(4, '0')
  const ab = bits.slice(0, 2)   // person
  const cd = bits.slice(2, 4)   // action
  // For hex, set object and environment to '00' for consistency
  const ef = '00'
  const gh = '00'

  const person = _PERSONS[ab]
  const action = _ACTIONS[cd]
  const object = _OBJECTS[ef]
  const env = _ENVIRONMENTS[gh]

  HEX_DATA[hex] = `${person.emoji} ${person.name} ${action} ${object.emoji} ${object.name} in ${env.scene}`

  HEX_META.push({
    hex,
    bits,
    ab, cd, ef, gh,
    person: person.name,
    personEmoji: person.emoji,
    action,
    object: object.name,
    objectEmoji: object.emoji,
    environment: env.scene,
    environmentDesc: env.desc,
  })
}

const HEX_IMAGES = {}

export { HEX_DATA, HEX_META, HEX_IMAGES }
