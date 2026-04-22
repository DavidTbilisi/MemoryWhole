// ── Binary (8-bit cross-matrix deck) ──────────────────────────────────────────
// Key = 8-bit binary string (ABCDEFGH)
//
// Encoding:
//   AB → Character (Person)
//   CD → Action (Form)
//   EF → Object
//   GH → Environment
//
// 4-bit matrix layout (both matrices share this structure):
//
//   Element ↓ \ State →  | 00 Solid | 01 Liquid | 10 Gas | 11 Plasma
//   ─────────────────────┼──────────┼───────────┼────────┼──────────
//   00 Earth             | 0000     | 0001      | 0010   | 0011
//   01 Water             | 0100     | 0101      | 0110   | 0111
//   10 Air               | 1000     | 1001      | 1010   | 1011
//   11 Fire              | 1100     | 1101      | 1110   | 1111


// ── Persons (AB) ──
const _PERSONS = {
    '00': { name: 'Giant', emoji: '🗿', element: 'earth' },
    '01': { name: 'Mermaid', emoji: '🧜', element: 'water' },
    '10': { name: 'Mage', emoji: '🧙', element: 'air' },
    '11': { name: 'Dragon', emoji: '🐉', element: 'fire' },
}

// ── Actions (CD) ──
const _ACTIONS = {
    '00': 'crushing',
    '01': 'flowing',
    '10': 'spreading',
    '11': 'exploding',
}

// ── Objects (EF) ──
const _OBJECTS = {
    '00': { name: 'rock', emoji: '🧱' },
    '01': { name: 'water', emoji: '💧' },
    '10': { name: 'cloud', emoji: '☁️' },
    '11': { name: 'lightning', emoji: '⚡' },
}

// ── Environments + Color (GH) ──
const _ENVIRONMENTS = {
    '00': { scene: '🪨 Red cave', desc: 'glowing rock cavern' },
    '01': { scene: '🌊 Blue ocean', desc: 'deep water world' },
    '10': { scene: '☁️ Green sky', desc: 'floating toxic clouds' },
    '11': { scene: '🌋 Purple storm volcano', desc: 'lava + lightning storm' },
}

// ── Generate all 256 entries ───────────────────────────────────────────────────

const BINARY_DATA = {}
const BINARY_META = []

for (let i = 0; i < 256; i++) {
    const bits = i.toString(2).padStart(8, '0')
    const ab = bits.slice(0, 2)   // person
    const cd = bits.slice(2, 4)   // action
    const ef = bits.slice(4, 6)   // object
    const gh = bits.slice(6, 8)   // environment

    const person = _PERSONS[ab]
    const action = _ACTIONS[cd]
    const object = _OBJECTS[ef]
    const env = _ENVIRONMENTS[gh]

    BINARY_DATA[bits] = `${person.emoji} ${person.name} ${action} ${object.emoji} ${object.name} in ${env.scene}`

    BINARY_META.push({
        bits,
        nibble1: bits.slice(0, 4),
        nibble2: bits.slice(4, 8),
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

const BINARY_IMAGES = {}

export { BINARY_DATA, BINARY_META, BINARY_IMAGES }
