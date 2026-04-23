#!/usr/bin/env node
/**
 * dump_decks.mjs
 *
 * Exports all MemoryWhole deck data to a single JSON file so the Python
 * Anki converter can work without needing to parse JavaScript.
 *
 * Run via vite-node (handles Vite's extension-less imports):
 *   npx vite-node tools/anki/dump_decks.mjs            # all decks → stdout
 *   npx vite-node tools/anki/dump_decks.mjs --deck major
 *   npx vite-node tools/anki/dump_decks.mjs -o decks.json
 *   npx vite-node tools/anki/dump_decks.mjs --list     # list available decks
 *
 * Or use the convenience script:
 *   node tools/anki/dump_decks.mjs   (also works for most decks)
 *
 * Output shape per deck:
 *   {
 *     "name": "Human-readable name",
 *     "data": { "key": "association value", ... },
 *     "images": { "key": "https://...", ... },   // may be empty
 *     "icons":  { "key": "🧑", ... },            // optional
 *     "prompts":{ "key": "question text", ... }, // CAST/stack decks
 *     "meta":   [...]                            // optional raw meta array
 *   }
 */

import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'
import { writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '../../src/data')

// On Windows, dynamic import() requires a file:// URL, not a raw path.
function srcUrl(filename) {
  return pathToFileURL(join(SRC, filename)).href
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  const limit = Math.floor(Math.sqrt(n))
  for (let c = 3; c <= limit; c += 2) if (n % c === 0) return false
  return true
}

function stripSem3Prefix(text) {
  const t = String(text || '').trim()
  return t.includes(' - ') ? t.split(' - ')[1] : t
}

async function tryImport(path, fallback = {}) {
  try {
    return await import(path)
  } catch (e) {
    process.stderr.write(`[warn] Could not import ${path}: ${e.message}\n`)
    return fallback
  }
}

// ── Import all data modules ──────────────────────────────────────────────────

const { BINARY_DATA, BINARY_META, BINARY_IMAGES } =
  await tryImport(srcUrl('binary.js'))

const { HEX_DATA, HEX_META, HEX_IMAGES } =
  await tryImport(srcUrl('hex.js'))

const { MAJOR_DATA, MAJOR_IMAGES } =
  await tryImport(srcUrl('major-system.js'))

const { SEM3_DATA, SEM3_IMAGES } =
  await tryImport(srcUrl('sem3.js'))

const { MONTHS_DATA, MONTHS_IMAGES } =
  await tryImport(srcUrl('month-days.js'))

const { CLOCKS_DATA, CLOCKS_IMAGES } =
  await tryImport(srcUrl('clocks.js'))

const { CALENDAR_DATA, CALENDAR_IMAGES } =
  await tryImport(srcUrl('calendar.js'))

const { BIBLE_OVERVIEW_DATA, BIBLE_OVERVIEW_IMAGES } =
  await tryImport(srcUrl('bible-overview.js'))

const { BIBLE_BOOKS_DATA, BIBLE_BOOKS_IMAGES } =
  await tryImport(srcUrl('bible-books.js'))

const { PAO_DATA, PAO_IMAGES, PAO_ICONS, getPAOSceneLabel } =
  await tryImport(srcUrl('pao.js'))

const { PEG_MATRIX_DATA, PEG_MATRIX_IMAGES } =
  await tryImport(srcUrl('peg-matrix.js'))

const { PEG_MATRIX_RU_DATA, PEG_MATRIX_RU_IMAGES } =
  await tryImport(srcUrl('peg-matrix-ru.js'))

const { CAST_DECK_DATA, CASTREV_DECK_DATA, CAST_PROMPTS } =
  await tryImport(srcUrl('cast.js'))

const { STACKFUND_DECK_DATA, STACKFUND_PROMPTS } =
  await tryImport(srcUrl('stack-fundamentals.js'))

// ── Dynamic deck builders ────────────────────────────────────────────────────

function buildPaoScenes() {
  if (!PAO_DATA || !getPAOSceneLabel) return {}
  const out = {}
  for (let v = 0; v < 1000; v++) {
    const key = String(v).padStart(3, '0')
    out[key] = getPAOSceneLabel(key, PAO_DATA)
  }
  return out
}

function buildPrimes() {
  if (!MAJOR_DATA || !SEM3_DATA) return {}
  const out = {}
  for (let v = 2; v <= 9999; v++) {
    if (!isPrime(v)) continue
    if (v < 100) {
      const lower = String(v).padStart(2, '0')
      out[String(v)] = `${lower} ${MAJOR_DATA[lower] || MAJOR_DATA[String(v)] || '—'} (Major)`
    } else {
      const padded = String(v).padStart(4, '0')
      const upper = padded.slice(0, 2)
      const lower = padded.slice(2)
      const sem3 = stripSem3Prefix(SEM3_DATA[`${upper}00`] || '—')
      out[String(v)] = `${upper} ${sem3} (SEM3) + ${lower} ${MAJOR_DATA[lower] || '—'} (Major)`
    }
  }
  return out
}

function buildSem3Major() {
  if (!MAJOR_DATA || !SEM3_DATA) return {}
  const out = {}
  for (let v = 0; v <= 9999; v++) {
    const padded = String(v).padStart(4, '0')
    const upper = padded.slice(0, 2)
    const lower = padded.slice(2)
    const sem3 = stripSem3Prefix(SEM3_DATA[`${upper}00`] || '—')
    out[padded] = `${upper} ${sem3} (SEM3) + ${lower} ${MAJOR_DATA[lower] || '—'} (Major)`
  }
  return out
}

// PEG matrix images: each value is {audio, visual} or a plain string
function flattenPegImages(matrixImages) {
  if (!matrixImages) return {}
  const out = {}
  for (const [key, val] of Object.entries(matrixImages)) {
    if (val && typeof val === 'object') {
      // Pick whichever sub-image exists
      out[key] = val.audio || val.visual || ''
    } else {
      out[key] = String(val || '')
    }
  }
  return out
}

// ── Deck registry ─────────────────────────────────────────────────────────────

const DECKS = {
  binary: {
    name: 'Binary (8-bit)',
    description: '256 patterns · 8-bit cross-matrix · Giant/Mermaid/Mage/Dragon',
    data: BINARY_DATA || {},
    images: BINARY_IMAGES || {},
    meta: BINARY_META || [],
  },
  hex: {
    name: 'Hex (Aristotelian)',
    description: '16 symbols 0-F · element × quality',
    data: HEX_DATA || {},
    images: HEX_IMAGES || {},
    meta: HEX_META || [],
  },
  major: {
    name: 'Major System',
    description: '100 items · number → word encoding',
    data: MAJOR_DATA || {},
    images: MAJOR_IMAGES || {},
  },
  sem3: {
    name: 'SEM3',
    description: '100 items · sense × object matrix',
    data: SEM3_DATA || {},
    images: SEM3_IMAGES || {},
  },
  months: {
    name: 'Month Days (Georgian ABC)',
    description: '33 items · Georgian alphabet × month-day mnemonics',
    data: MONTHS_DATA || {},
    images: MONTHS_IMAGES || {},
  },
  clocks: {
    name: 'Famous Clocks',
    description: '24 items · hour → famous clock',
    data: CLOCKS_DATA || {},
    images: CLOCKS_IMAGES || {},
  },
  calendar: {
    name: 'Calendar Months',
    description: '12 items · month → mnemonic object',
    data: CALENDAR_DATA || {},
    images: CALENDAR_IMAGES || {},
  },
  bibleoverview: {
    name: 'Bible Overview',
    description: '10 sections · canonical structure',
    data: BIBLE_OVERVIEW_DATA || {},
    images: BIBLE_OVERVIEW_IMAGES || {},
  },
  biblebooks: {
    name: 'Bible Books',
    description: '66 books · order and identification',
    data: BIBLE_BOOKS_DATA || {},
    images: BIBLE_BOOKS_IMAGES || {},
  },
  pao: {
    name: 'PAO (Parts)',
    description: '30 items · Person / Action / Object for digits 0-9',
    data: PAO_DATA || {},
    images: PAO_IMAGES || {},
    icons: PAO_ICONS || {},
  },
  paoscenes: {
    name: 'PAO (Full Scenes)',
    description: '1000 scenes · combined 3-digit PAO encoding',
    data: buildPaoScenes(),
    images: {},
  },
  pegmatrix: {
    name: 'Peg Matrix',
    description: '100 items · Audio × Visual peg combinations',
    data: PEG_MATRIX_DATA || {},
    images: flattenPegImages(PEG_MATRIX_IMAGES),
  },
  pegmatrixru: {
    name: 'Peg Matrix RU',
    description: '100 items · Russian audio × visual pegs',
    data: PEG_MATRIX_RU_DATA || {},
    images: flattenPegImages(PEG_MATRIX_RU_IMAGES),
  },
  cast: {
    name: 'CAST edges',
    description: '256 edges · story → byte encoding (Character/Action/Stream/Time)',
    data: CAST_DECK_DATA || {},
    images: {},
    prompts: CAST_PROMPTS || {},
  },
  castrev: {
    name: 'CAST reverse',
    description: '256 edges · byte → story (reverse CAST lookup)',
    data: CASTREV_DECK_DATA || {},
    images: {},
  },
  stackfund: {
    name: 'Stack fundamentals',
    description: '12 items · stack map + logic gates',
    data: STACKFUND_DECK_DATA || {},
    images: {},
    prompts: STACKFUND_PROMPTS || {},
  },
  primes: {
    name: 'Prime Numbers',
    description: '1229 primes ≤ 9999 · Major + SEM3 composite mnemonics',
    data: buildPrimes(),
    images: {},
  },
  sem3major: {
    name: 'SEM3 Major',
    description: '10,000 items · 4-digit composite SEM3 × Major encoding',
    data: buildSem3Major(),
    images: {},
  },
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const listOnly = args.includes('--list')
const deckArg = (() => {
  const i = args.indexOf('--deck')
  return i !== -1 ? args[i + 1] : null
})()
const outArg = (() => {
  const i = args.indexOf('-o')
  return i !== -1 ? args[i + 1] : null
})()

if (listOnly) {
  for (const [id, deck] of Object.entries(DECKS)) {
    const size = Object.keys(deck.data).length
    console.log(`  ${id.padEnd(14)} ${String(size).padStart(6)} items  ${deck.name}`)
  }
  process.exit(0)
}

if (deckArg && !DECKS[deckArg]) {
  process.stderr.write(`Unknown deck: "${deckArg}"\nAvailable: ${Object.keys(DECKS).join(', ')}\n`)
  process.exit(1)
}

const output = deckArg ? { [deckArg]: DECKS[deckArg] } : DECKS
const json = JSON.stringify(output, null, 2)

if (outArg) {
  writeFileSync(outArg, json, 'utf8')
  process.stderr.write(`Wrote ${outArg}\n`)
} else {
  process.stdout.write(json)
}
