import { MAJOR_DATA, MAJOR_IMAGES } from '../data/major-system'
import { SEM3_DATA, SEM3_IMAGES } from '../data/sem3'
import { MONTHS_DATA, MONTHS_IMAGES } from '../data/month-days'
import { CLOCKS_DATA, CLOCKS_IMAGES } from '../data/clocks'
import { PAO_DATA, PAO_IMAGES } from '../data/pao'
import { BINARY_DATA, BINARY_IMAGES } from '../data/binary'
import { BINARY8_DATA, BINARY8_IMAGES } from '../data/binary8'
import { HEX_DATA, HEX_IMAGES } from '../data/hex'
import { CALENDAR_DATA, CALENDAR_IMAGES } from '../data/calendar'
import { BIBLE_OVERVIEW_DATA } from '../data/bible-overview'
import { BIBLE_OVERVIEW_IMAGES } from '../data/bible-overview'
import { BIBLE_BOOKS_DATA, BIBLE_BOOKS_IMAGES } from '../data/bible-books'
import { PEG_AUDIO, PEG_VISUAL, PEG_IMAGES, PEG_MATRIX_DATA, PEG_MATRIX_IMAGES } from '../data/peg-matrix'
import { PEG_AUDIO_RU, PEG_VISUAL_RU, PEG_IMAGES_RU, PEG_MATRIX_RU_DATA, PEG_MATRIX_RU_IMAGES } from '../data/peg-matrix-ru'
import { readDeckMap, writeDeckMap, readJson, writeJson } from './storage'

export const DECK_EDITS_KEY = 'deckEdits_v1'
export const DECK_IMAGES_KEY = 'deckImages_v1'
export const DECK_ICONS_KEY = 'deckIcons_v1'
export const DECK_SAVED_AT_KEY = 'deckSavedAt_v1'

function stampDeckSavedAt(deck) {
  const map = readJson(DECK_SAVED_AT_KEY, {})
  map[deck] = Date.now()
  writeJson(DECK_SAVED_AT_KEY, map)
}

export function migrateDeckSavedAtTimestamps() {
  const timestamps = readJson(DECK_SAVED_AT_KEY, {})
  const edits = readJson(DECK_EDITS_KEY, {})
  const images = readJson(DECK_IMAGES_KEY, {})
  const icons = readJson(DECK_ICONS_KEY, {})

  const decksWithContent = new Set([
    ...Object.keys(edits),
    ...Object.keys(images),
    ...Object.keys(icons),
  ])

  let migrated = false
  for (const deck of decksWithContent) {
    if (!timestamps[deck]) {
      timestamps[deck] = Date.now()
      migrated = true
    }
  }

  if (migrated) writeJson(DECK_SAVED_AT_KEY, timestamps)
}

const DECK_EMOJI = {
  major: '🔢',
  sem3: '🧠',
  sem3major: '🧠',
  months: '📅',
  clocks: '🕐',
  pao: '🎭',
  binary: '⬛',
  binary8: '🔲',
  hex: '🔶',
  primes: '🔺',
  calendar: '🗓️',
  bibleoverview: '✝️',
  biblebooks: '📖',
  pegaudio: '🔊',
  pegvisual: '👁️',
  pegmatrix: '🔲',
  pegmatrixru: '🇷🇺',
}

const EMOJI_KEYWORDS = [
  ['sun', '☀️'], ['moon', '🌙'], ['star', '⭐'], ['cloud', '☁️'], ['rain', '🌧️'], ['snow', '❄️'], ['fire', '🔥'],
  ['water', '💧'], ['sea', '🌊'], ['tree', '🌳'], ['flower', '🌸'], ['leaf', '🍃'], ['mountain', '⛰️'],
  ['dog', '🐶'], ['cat', '🐱'], ['bird', '🐦'], ['fish', '🐟'], ['horse', '🐴'], ['lion', '🦁'], ['tiger', '🐯'],
  ['book', '📚'], ['bible', '📖'], ['clock', '🕐'], ['time', '⏱️'], ['car', '🚗'], ['train', '🚆'], ['plane', '✈️'],
  ['ship', '🚢'], ['door', '🚪'], ['house', '🏠'], ['heart', '❤️'], ['eye', '👁️'], ['ear', '👂'], ['hand', '✋'],
  ['brain', '🧠'], ['music', '🎵'], ['sound', '🔊'], ['light', '💡'], ['phone', '📱'], ['computer', '💻'],
  ['money', '💰'], ['king', '👑'], ['queen', '👸'], ['hero', '🦸'], ['wine', '🍷'], ['ball', '⚽'], ['bomb', '💣'],
  ['hook', '🪝'], ['gate', '🚧'], ['sword', '🗡️'], ['axe', '🪓'], ['dragon', '🐉'], ['angel', '😇'],
]

const DECK_DATA = {
  pegaudio: PEG_AUDIO,
  pegvisual: PEG_VISUAL,
  major: MAJOR_DATA,
  sem3: SEM3_DATA,
  months: MONTHS_DATA,
  clocks: CLOCKS_DATA,
  pao: PAO_DATA,
  binary: BINARY_DATA,
  binary8: BINARY8_DATA,
  hex: HEX_DATA,
  calendar: CALENDAR_DATA,
  bibleoverview: BIBLE_OVERVIEW_DATA,
  biblebooks: BIBLE_BOOKS_DATA,
  pegmatrix: PEG_MATRIX_DATA,
  pegmatrixru: PEG_MATRIX_RU_DATA,
}

const LIGHTWEIGHT_IMAGE_DECKS = new Set(['primes', 'sem3major'])

function isPrime(value) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  const limit = Math.floor(Math.sqrt(n))
  for (let candidate = 3; candidate <= limit; candidate += 2) {
    if (n % candidate === 0) return false
  }
  return true
}

function stripSem3Prefix(value) {
  const text = String(value || '').trim()
  const separator = ' - '
  return text.includes(separator) ? text.split(separator)[1] : text
}

function buildPrimeDataSync() {
  const major = getDeckDataSync('major')
  const sem3 = getDeckDataSync('sem3')
  const out = {}

  for (let value = 2; value <= 9999; value += 1) {
    if (!isPrime(value)) continue

    if (value < 100) {
      const lower = String(value).padStart(2, '0')
      out[String(value)] = `${lower} ${major[lower] || major[String(value)] || '—'} (Major)`
      continue
    }

    const padded = String(value).padStart(4, '0')
    const upper = padded.slice(0, 2)
    const lower = padded.slice(2)
    const sem3Key = `${upper}00`
    const sem3Value = stripSem3Prefix(sem3[sem3Key] || '—')
    const majorValue = major[lower] || '—'
    out[String(value)] = `${upper} ${sem3Value} (SEM3) + ${lower} ${majorValue} (Major)`
  }

  return out
}

function buildSem3MajorDataSync() {
  const major = getDeckDataSync('major')
  const sem3 = getDeckDataSync('sem3')
  const out = {}

  for (let value = 0; value <= 9999; value += 1) {
    const padded = String(value).padStart(4, '0')
    const upper = padded.slice(0, 2)
    const lower = padded.slice(2)
    const sem3Key = `${upper}00`
    const sem3Value = stripSem3Prefix(sem3[sem3Key] || '—')
    const majorValue = major[lower] || '—'
    out[padded] = `${upper} ${sem3Value} (SEM3) + ${lower} ${majorValue} (Major)`
  }

  return out
}

function buildPegAudioImages(matrixImages) {
  const out = {}
  for (let i = 0; i <= 9; i++) {
    // pegaudio[i] maps to pegmatrix image i0 (i.e., i*10)
    const key = String(i * 10).padStart(2, '0')
    const imgData = matrixImages[key]
    out[String(i)] = typeof imgData === 'object' ? imgData.audio : imgData
  }
  return out
}

function buildPegVisualImages(matrixImages) {
  const out = {}
  for (let j = 0; j <= 9; j++) {
    // pegvisual[j] maps to pegmatrix image 0j
    const key = String(j).padStart(2, '0')
    const imgData = matrixImages[key]
    out[String(j)] = typeof imgData === 'object' ? imgData.visual : imgData
  }
  return out
}

function buildPegAudioRuImages(matrixImages) {
  const out = {}
  for (let i = 0; i <= 9; i++) {
    const key = String(i * 10).padStart(2, '0')
    const imgData = matrixImages[key]
    out[String(i)] = typeof imgData === 'object' ? imgData.audio : imgData
  }
  return out
}

function buildPegVisualRuImages(matrixImages) {
  const out = {}
  for (let j = 0; j <= 9; j++) {
    const key = String(j).padStart(2, '0')
    const imgData = matrixImages[key]
    out[String(j)] = typeof imgData === 'object' ? imgData.visual : imgData
  }
  return out
}

const LEGACY_DEFAULT_IMAGES = {
  major: MAJOR_IMAGES,
  sem3: SEM3_IMAGES,
  months: MONTHS_IMAGES,
  clocks: CLOCKS_IMAGES,
  pao: PAO_IMAGES,
  binary: BINARY_IMAGES,
  binary8: BINARY8_IMAGES,
  hex: HEX_IMAGES,
  calendar: CALENDAR_IMAGES,
  bibleoverview: BIBLE_OVERVIEW_IMAGES,
  biblebooks: BIBLE_BOOKS_IMAGES,
  pegaudio: buildPegAudioImages(PEG_MATRIX_IMAGES),
  pegvisual: buildPegVisualImages(PEG_MATRIX_IMAGES),
  pegmatrix: PEG_MATRIX_IMAGES,
  pegaudioru: buildPegAudioRuImages(PEG_MATRIX_RU_IMAGES),
  pegvisualru: buildPegVisualRuImages(PEG_MATRIX_RU_IMAGES),
  pegmatrixru: PEG_MATRIX_RU_IMAGES,
}

function cloneMap(value) {
  return { ...(value || {}) }
}

function hashColor(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const n = Math.abs(h >>> 0)
  const hue = n % 360
  return `hsl(${hue} 62% 44%)`
}

function encodeSvg(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function pickEmoji(deck, text) {
  const raw = String(text || '').toLowerCase()
  for (const [needle, emoji] of EMOJI_KEYWORDS) {
    if (raw.includes(needle)) return emoji
  }
  return DECK_EMOJI[deck] || '🧩'
}

export function makeSideBySideImageDataUri(audioUrl = '', visualUrl = '') {
  const safeAudioUrl = String(audioUrl || '').replace(/"/g, '&quot;')
  const safeVisualUrl = String(visualUrl || '').replace(/"/g, '&quot;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200"><rect width="640" height="200" fill="#0f172a"/><image x="10" y="10" width="300" height="180" href="${safeAudioUrl}" preserveAspectRatio="xMidYMid slice"/><image x="330" y="10" width="300" height="180" href="${safeVisualUrl}" preserveAspectRatio="xMidYMid slice"/></svg>`
  return encodeSvg(svg)
}

export function makeEmojiFallbackDataUri(emoji = '🧩', label = 'No image') {
  const safeEmoji = String(emoji || '🧩')
  const safeLabel = String(label || 'No image')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="#0f172a"/><rect x="12" y="12" width="296" height="176" rx="16" fill="#111827" stroke="#334155"/><text x="160" y="102" text-anchor="middle" font-size="64">${safeEmoji}</text><text x="160" y="152" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="Verdana,Arial,sans-serif">${safeLabel}</text></svg>`
  return encodeSvg(svg)
}

export function makeSimpleEmojiFallbackDataUri(emoji = '🧩') {
  const safeEmoji = String(emoji || '🧩')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="#0f172a"/><rect x="12" y="12" width="296" height="176" rx="16" fill="#111827" stroke="#334155"/><text x="160" y="100" text-anchor="middle" font-size="80">${safeEmoji}</text></svg>`
  return encodeSvg(svg)
}

function makeDefaultImage(deck, key, assocText) {
  const top = hashColor(`${deck}:${key}:a`)
  const bottom = hashColor(`${deck}:${key}:b`)
  const emoji = pickEmoji(deck, assocText)
  const label = `${deck.toUpperCase()} ${String(key)}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${top}"/><stop offset="100%" stop-color="${bottom}"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><rect x="12" y="12" width="296" height="176" rx="16" fill="rgba(2,6,23,0.22)" stroke="rgba(255,255,255,0.25)"/><text x="24" y="76" fill="#e2e8f0" font-size="22" font-family="Verdana,Arial,sans-serif" font-weight="700">${label}</text><text x="24" y="134" font-size="56">${emoji}</text><text x="24" y="168" fill="#cbd5e1" font-size="14" font-family="Verdana,Arial,sans-serif">Replace via Editor > Image URL/Path</text></svg>`
  return encodeSvg(svg)
}

function buildDefaultDeckImages(deck) {
  const merged = getDeckDataSync(deck)
  const legacy = LEGACY_DEFAULT_IMAGES[deck] || {}
  const out = {}
  for (const [key, value] of Object.entries(merged)) {
    const normalizedKey = String(key)
    const paddedKey = normalizedKey.padStart(2, '0')
    const legacyImg = legacy[normalizedKey] || legacy[paddedKey]
    out[normalizedKey] = legacyImg || makeDefaultImage(deck, normalizedKey, String(value || ''))
  }
  return out
}

export function getDeckEmojiMapSync(deck) {
  return getDeckIconsSync(deck)
}

export function getDeckDefaultIconsSync(deck) {
  const merged = getDeckDataSync(deck)
  const out = {}
  for (const [key, value] of Object.entries(merged)) {
    out[String(key)] = pickEmoji(deck, String(value || ''))
  }
  return out
}

export function getDeckDefaultImagesSync(deck) {
  if (LIGHTWEIGHT_IMAGE_DECKS.has(deck)) return {}
  return buildDefaultDeckImages(deck)
}

export function getDeckBaseDataSync(deck) {
  if (deck === 'sem3major') return buildSem3MajorDataSync()
  if (deck === 'primes') return buildPrimeDataSync()
  const data = DECK_DATA[deck]
  if (!data) throw new Error(`Unknown deck: ${deck}`)
  return cloneMap(data)
}

export function getDeckEdits(deck) {
  return readDeckMap(DECK_EDITS_KEY, deck)
}

export function getDeckImageEdits(deck) {
  return readDeckMap(DECK_IMAGES_KEY, deck)
}

export function getDeckIconEdits(deck) {
  return readDeckMap(DECK_ICONS_KEY, deck)
}

export function saveDeckEdits(deck, edits) {
  const base = getDeckBaseDataSync(deck)
  const cleaned = {}

  for (const [key, value] of Object.entries(edits || {})) {
    if (!(key in base)) continue
    cleaned[String(key)] = String(value ?? '').trim()
  }

  writeDeckMap(DECK_EDITS_KEY, deck, cleaned)
  stampDeckSavedAt(deck)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mnemonic-deck-updated'))
  }
  return cleaned
}

export function saveDeckImageEdits(deck, images) {
  const base = getDeckBaseDataSync(deck)
  const defaults = buildDefaultDeckImages(deck)
  const cleaned = {}

  for (const [key, value] of Object.entries(images || {})) {
    if (!(key in base)) continue
    const next = String(value ?? '').trim()
    if (!next) continue
    if (next === defaults[String(key)]) continue
    cleaned[String(key)] = next
  }

  writeDeckMap(DECK_IMAGES_KEY, deck, cleaned)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mnemonic-deck-updated'))
  }
  return cleaned
}

export function saveDeckIconEdits(deck, icons) {
  const base = getDeckBaseDataSync(deck)
  const defaults = getDeckDefaultIconsSync(deck)
  const cleaned = {}

  for (const [key, value] of Object.entries(icons || {})) {
    if (!(key in base)) continue
    const next = String(value ?? '').trim()
    if (!next) continue
    if (next === defaults[String(key)]) continue
    cleaned[String(key)] = next
  }

  writeDeckMap(DECK_ICONS_KEY, deck, cleaned)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mnemonic-deck-updated'))
  }
  return cleaned
}

export function getDeckImagesSync(deck) {
  const defaults = buildDefaultDeckImages(deck)
  const edits = getDeckImageEdits(deck)
  return { ...defaults, ...edits }
}

export function getDeckIconsSync(deck) {
  const defaults = getDeckDefaultIconsSync(deck)
  const edits = getDeckIconEdits(deck)
  return { ...defaults, ...edits }
}

export function exportDeckPayload(deck) {
  return {
    deck,
    exportedAt: new Date().toISOString(),
    data: getDeckDataSync(deck),
    images: getDeckImagesSync(deck),
    icons: getDeckIconsSync(deck),
  }
}

export async function loadDeckData(deck) {
  return getDeckDataSync(deck)
}

export function getDeckDataSync(deck) {
  const base = getDeckBaseDataSync(deck)
  const edits = getDeckEdits(deck)
  return { ...base, ...edits }
}
