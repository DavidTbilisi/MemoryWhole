
// ── Binary (4-bit) — 2 bits for person, 2 bits for action/object/environment ──

const _PERSONS = {
  '00': { name: 'Giant', emoji: '🗿' },
  '01': { name: 'Mermaid', emoji: '🧜' },
  '10': { name: 'Mage', emoji: '🧙' },
  '11': { name: 'Dragon', emoji: '🐉' },
}

const _ACTIONS = {
  '00': { action: 'crushing', object: '🧱 rock', env: '🪨 Red cave' },
  '01': { action: 'flowing', object: '💧 water', env: '🌊 Blue ocean' },
  '10': { action: 'spreading', object: '☁️ cloud', env: '☁️ Green sky' },
  '11': { action: 'exploding', object: '⚡ lightning', env: '🌋 Purple storm volcano' },
}

const BINARY_DATA = {}
const BINARY_META = []

for (let i = 0; i < 16; i++) {
  const bits = i.toString(2).padStart(4, '0')
  const ab = bits.slice(0, 2)
  const cd = bits.slice(2, 4)
  const person = _PERSONS[ab]
  const act = _ACTIONS[cd]
  BINARY_DATA[bits] = `${person.emoji} ${person.name} ${act.action} ${act.object} in ${act.env}`
  BINARY_META.push({
    bits,
    ab, cd,
    person: person.name,
    personEmoji: person.emoji,
    action: act.action,
    object: act.object,
    environment: act.env,
  })
}

const BINARY_IMAGES = {}

export { BINARY_DATA, BINARY_META, BINARY_IMAGES }
