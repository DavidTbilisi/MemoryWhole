// Provide empty PAO_IMAGES for compatibility
export const PAO_IMAGES = {};

// ── PAO System (Person-Action-Object, 0–9, 3-digit encoding) ────────────────

// People (0–9)
export const PAO_PEOPLE = [
	{ num: 0, person: 'Socrates', consonant: 'S' },
	{ num: 1, person: 'Thor', consonant: 'T' },
	{ num: 2, person: 'Napoleon', consonant: 'N' },
	{ num: 3, person: 'Moses', consonant: 'M' },
	{ num: 4, person: 'Robin Hood', consonant: 'R' },
	{ num: 5, person: 'Loki', consonant: 'L' },
	{ num: 6, person: 'Jack Sparrow', consonant: 'J' },
	{ num: 7, person: 'King Arthur', consonant: 'K' },
	{ num: 8, person: 'Frankenstein', consonant: 'F' },
	{ num: 9, person: 'Batman', consonant: 'B' },
];

// Actions (0–9)
export const PAO_ACTIONS = [
	{ num: 0, action: 'Sawing', consonant: 'S' },
	{ num: 1, action: 'Throwing', consonant: 'T' },
	{ num: 2, action: 'Nailing', consonant: 'N' },
	{ num: 3, action: 'Melting', consonant: 'M' },
	{ num: 4, action: 'Ripping', consonant: 'R' },
	{ num: 5, action: 'Launching', consonant: 'L' },
	{ num: 6, action: 'Juggling', consonant: 'J' },
	{ num: 7, action: 'Kicking', consonant: 'K' },
	{ num: 8, action: 'Flying', consonant: 'F' },
	{ num: 9, action: 'Burning', consonant: 'B' },
];

// Objects (0–9)
export const PAO_OBJECTS = [
	{ num: 0, object: 'Sword', consonant: 'S' },
	{ num: 1, object: 'Torch', consonant: 'T' },
	{ num: 2, object: 'Net', consonant: 'N' },
	{ num: 3, object: 'Map', consonant: 'M' },
	{ num: 4, object: 'Ring', consonant: 'R' },
	{ num: 5, object: 'Ladder', consonant: 'L' },
	{ num: 6, object: 'Shield', consonant: 'SH' },
	{ num: 7, object: 'Goblet', consonant: 'G' },
	{ num: 8, object: 'Flag', consonant: 'F' },
	{ num: 9, object: 'Bomb', consonant: 'B' },
];

// Helper: get PAO scene for a 3-digit number
export function getPAOScene(num) {
	const n = String(num).padStart(3, '0');
	const p = PAO_PEOPLE[parseInt(n[0], 10)];
	const a = PAO_ACTIONS[parseInt(n[1], 10)];
	const o = PAO_OBJECTS[parseInt(n[2], 10)];
	return `${p.person} ${a.action.toLowerCase()} a ${o.object.toLowerCase()}`;
}

// Compatibility: export PAO_DATA as a mapping for quiz (just 10 people, 10 actions, 10 objects)
export const PAO_DATA = {};
// People
for (let i = 0; i < 10; ++i) {
	PAO_DATA[`P${i}`] = `${PAO_PEOPLE[i].person} (${PAO_PEOPLE[i].consonant})`;
}
// Actions
for (let i = 0; i < 10; ++i) {
	PAO_DATA[`A${i}`] = `${PAO_ACTIONS[i].action} (${PAO_ACTIONS[i].consonant})`;
}
// Objects
for (let i = 0; i < 10; ++i) {
	PAO_DATA[`O${i}`] = `${PAO_OBJECTS[i].object} (${PAO_OBJECTS[i].consonant})`;
}

