import { CAST_ROWS, CAST_HELP_DRAWER } from './cast-lexicon.generated.js'

/** Forward deck: reviewKey → canonical 8-bit answer (spaced nibbles). */
export const CAST_DECK_DATA = Object.fromEntries(CAST_ROWS.map((r) => [r.reviewKey, r.answer]))

/** Reverse deck: answer string → edge story (prompt). Keys are unique across 256 edges. */
export const CASTREV_DECK_DATA = Object.fromEntries(CAST_ROWS.map((r) => [r.answer, r.prompt]))

export const CAST_PROMPTS = Object.fromEntries(CAST_ROWS.map((r) => [r.reviewKey, r.prompt]))

export const CAST_TOOLTIPS = Object.fromEntries(CAST_ROWS.map((r) => [r.reviewKey, r.tooltip]))

export { CAST_HELP_DRAWER }
