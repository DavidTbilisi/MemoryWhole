#!/usr/bin/env node
/**
 * Generates src/data/stack-fundamentals.generated.js — curated MCQ rows
 * aligned with LearningSystem SKILL + onboarding-path themes.
 *
 *   npm run sync:stack-fundamentals
 *
 * Optional: set LEARNING_SYSTEM_ROOT to a clone; first lines of SKILL.md /
 * onboarding-path.md are echoed into HELP text when files exist.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const outFile = join(repoRoot, 'src', 'data', 'stack-fundamentals.generated.js')

const DEFAULT_ROWS = [
  { key: 'stackfund_v1_01', prompt: 'What does the stack map primarily help you choose?', answer: 'Which encoding family to use next', tags: ['#map', '#stack'] },
  { key: 'stackfund_v1_02', prompt: 'Before NEDF or SEM3+Major for a relationship edge, the atlas recommends reaching for:', answer: 'CAST', tags: ['#cast', '#map'] },
  { key: 'stackfund_v1_03', prompt: 'Georgian node system is best for encoding:', answer: 'Static things (nodes) as 4-slot scenes', tags: ['#georgian', '#map'] },
  { key: 'stackfund_v1_04', prompt: 'NEDF is strongest when the target is a:', answer: 'Single concept you can name, essence, distinguish, and fail-test', tags: ['#nedf', '#map'] },
  { key: 'stackfund_v1_05', prompt: 'Confusion triage is mainly for:', answer: 'Picking the right recovery move when stuck', tags: ['#comprehension', '#map'] },
  { key: 'stackfund_v1_06', prompt: 'Comprehension protocol gates are about proving you can:', answer: 'Paraphrase, predict, and self-test — not vibes', tags: ['#comprehension', '#map'] },
  { key: 'stackfund_v1_07', prompt: 'Retrieval protocol emphasis is on:', answer: 'Cadence and honest grading of recall attempts', tags: ['#retrieval', '#map'] },
  { key: 'stackfund_v1_08', prompt: 'Collision handling in the stack is about:', answer: 'Separating confusable encodings before they ossify', tags: ['#collision', '#map'] },
  { key: 'stackfund_v1_09', prompt: 'Measurement framework cards nudge you to log:', answer: 'Dimensions of performance, not only streaks', tags: ['#measurement', '#map'] },
  { key: 'stackfund_v1_10', prompt: 'Binary / hex drills in this console pair with:', answer: 'Bit-matrix stories consistent with the atlas', tags: ['#binary', '#hex', '#map'] },
  { key: 'stackfund_v1_11', prompt: 'Heuristic palace / domain patterns sit in the stack as:', answer: 'Advanced pattern libraries after foundations', tags: ['#heuristic', '#domain', '#map'] },
  { key: 'stackfund_v1_12', prompt: 'Onboarding path levels are useful for:', answer: 'Sequencing skills so prerequisites stay explicit', tags: ['#map', '#onboarding'] },
]

const WRONG_POOL = [
  'Random mnemonics without a gate',
  'Only speed, never accuracy',
  'Skipping comprehension checks entirely',
  'Encoding everything as PAO first',
  'Ignoring collisions until recall fails',
  'Using CAST for static nouns with no relation',
  'Replacing SRS with vibes',
  'One deck for all domains blindly',
  'Never measuring weak slices',
  'Georgian letters for pure edge stories',
  'NEDF for whole graphs without slots',
  'Major system for relational gates only',
]

const DEFAULT_HELP = `Stack fundamentals (MemoryWhole)

These items summarize how the LearningSystem atlas orders skills: map → gates → encodings → operations → maintenance.

Deep reading stays in the atlas (theSystem/*.md). This deck is for quick discrimination and vocabulary of the stack itself.

Tags on each row (in generated data) support future filters: #map #comprehension #nedf #cast #georgian #binary #hex #retrieval #collision #measurement #heuristic #domain #onboarding
`

function tryReadHead(root, rel, maxLines = 40) {
  if (!root) return ''
  try {
    const text = readFileSync(join(root, rel), 'utf8')
    return text.split(/\r?\n/).slice(0, maxLines).join('\n')
  } catch {
    return ''
  }
}

function main() {
  const envRoot = process.env.LEARNING_SYSTEM_ROOT
  const root = envRoot || join(repoRoot, '..', 'LearningSystem')
  const skill = tryReadHead(root, join('theSystem', 'SKILL.md'))
  const onboard = tryReadHead(root, join('theSystem', 'onboarding-path.md'))
  const extra = [skill && '--- excerpt: theSystem/SKILL.md ---\n' + skill, onboard && '--- excerpt: theSystem/onboarding-path.md ---\n' + onboard].filter(Boolean).join('\n\n')
  let helpDrawer = [DEFAULT_HELP, extra].filter(Boolean).join('\n\n')
  const maxHelp = 28000
  if (helpDrawer.length > maxHelp) helpDrawer = helpDrawer.slice(0, maxHelp) + '\n\n… (truncated; set LEARNING_SYSTEM_ROOT to regenerate full excerpts)\n'

  const rows = DEFAULT_ROWS.map((r) => ({
    ...r,
    distractors: WRONG_POOL.filter((w) => w !== r.answer).slice(0, 8),
  }))

  const deckMap = Object.fromEntries(rows.map((r) => [r.key, r.answer]))
  const prompts = Object.fromEntries(rows.map((r) => [r.key, r.prompt]))
  const tags = Object.fromEntries(rows.map((r) => [r.key, r.tags]))

  const body = `/* eslint-disable */
// AUTO-GENERATED by scripts/sync-stack-fundamentals.mjs
// Regenerate: npm run sync:stack-fundamentals

export const STACK_FUNDAMENTALS_VERSION = 1
export const STACK_FUNDAMENTALS_GENERATED_AT = ${JSON.stringify(new Date().toISOString())}
export const STACK_FUNDAMENTALS_HELP = ${JSON.stringify(helpDrawer)}
export const STACK_FUNDAMENTALS_ROWS = ${JSON.stringify(rows, null, 2)}
export const STACK_FUNDAMENTALS_DECK = ${JSON.stringify(deckMap, null, 2)}
export const STACK_FUNDAMENTALS_PROMPTS = ${JSON.stringify(prompts, null, 2)}
export const STACK_FUNDAMENTALS_TAGS = ${JSON.stringify(tags, null, 2)}
`

  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, body, 'utf8')
  console.log(`Wrote ${rows.length} stack fundamentals items → ${outFile}`)
}

main()
