// ── Binary 8-bit cross-matrix deck ────────────────────────────────────────────
// Key = 8-bit binary string (ABCDEFGH)
//
// Encoding:
//   AB → Element row  (Character)  — Matrix 1 vertical axis   ← USED
//   CD → State column (Form)       — Matrix 1 horizontal axis ← modifier (ignored in base)
//   EF → Element row  (Setting)    — Matrix 2 vertical axis   ← modifier (ignored in base)
//   GH → State column (Action)     — Matrix 2 horizontal axis ← USED
//
// Core scene   = Character(AB) × Action(GH)   [cross-matrix: Row₁ × Column₂]
// Variation    = Form(CD)      + Setting(EF)  [the "ignored" bits add detail]
//
// 4-bit matrix layout (both matrices share this structure):
//
//   Element ↓ \ State →  | 00 Solid | 01 Liquid | 10 Gas | 11 Plasma
//   ─────────────────────┼──────────┼───────────┼────────┼──────────
//   00 Earth             | 0000     | 0001      | 0010   | 0011
//   01 Water             | 0100     | 0101      | 0110   | 0111
//   10 Air               | 1000     | 1001      | 1010   | 1011
//   11 Fire              | 1100     | 1101      | 1110   | 1111

// ── Characters (AB = element row of Matrix 1) ─────────────────────────────────
const _CHARS = {
    '00': { name: 'Stone Golem', emoji: '🗿', element: 'earth' },
    '01': { name: 'Sea Witch', emoji: '🧜', element: 'water' },
    '10': { name: 'Storm Eagle', emoji: '🦅', element: 'air' },
    '11': { name: 'Lava Titan', emoji: '🌋', element: 'fire' },
}

// ── Forms — how the character appears (CD = state column of Matrix 1, "ignored") ──
const _FORMS = {
    '00': 'armored in stone',
    '01': 'dripping and dissolving',
    '10': 'wreathed in mist',
    '11': 'crackling with electricity',
}

// ── Settings — where the scene happens (EF = element row of Matrix 2, "ignored") ──
const _SETTINGS = {
    '00': 'in crumbling ruins',
    '01': 'above rising floodwaters',
    '10': 'inside a raging tornado',
    '11': 'amid a wall of flames',
}

// ── Actions (GH = state column of Matrix 2) ───────────────────────────────────
const _ACTIONS = {
    '00': { text: 'crushes everything flat', state: 'solid' },
    '01': { text: 'drowns the landscape', state: 'liquid' },
    '10': { text: 'fades into rising smoke', state: 'gas' },
    '11': { text: 'ignites the air itself', state: 'plasma' },
}

// ── Generate all 256 entries ───────────────────────────────────────────────────
//    Template: "[emoji] [Character], [Form], [Action] [Setting]"

const BINARY8_DATA = {}
const BINARY8_META = []

for (let i = 0; i < 256; i++) {
    const bits = i.toString(2).padStart(8, '0')
    const ab = bits.slice(0, 2)   // element  → character
    const cd = bits.slice(2, 4)   // state    → form modifier
    const ef = bits.slice(4, 6)   // element  → setting modifier
    const gh = bits.slice(6, 8)   // state    → action

    const ch = _CHARS[ab]
    const act = _ACTIONS[gh]

    BINARY8_DATA[bits] = `${ch.emoji} ${ch.name}, ${_FORMS[cd]}, ${act.text} ${_SETTINGS[ef]}`

    BINARY8_META.push({
        bits,
        nibble1: bits.slice(0, 4),
        nibble2: bits.slice(4, 8),
        ab, cd, ef, gh,
        character: ch.name,
        element: ch.element,
        form: _FORMS[cd],
        action: act.text,
        actionState: act.state,
        setting: _SETTINGS[ef],
        emoji: ch.emoji,
    })
}

const BINARY8_IMAGES = {}

export { BINARY8_DATA, BINARY8_META, BINARY8_IMAGES }
