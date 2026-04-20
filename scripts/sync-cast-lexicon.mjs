#!/usr/bin/env node
/**
 * Builds src/data/cast-lexicon.generated.js from LearningSystem castLexicon.js
 * (4 option tables → 256 CAST edge rows).
 *
 * Usage:
 *   npm run sync:cast
 *   LEARNING_SYSTEM_ROOT=/path/to/LearningSystem npm run sync:cast
 *
 * If LEARNING_SYSTEM_ROOT is unset, tries ../LearningSystem then ../../LearningSystem.
 * If no local clone, uses bundled option tables (same as upstream main as of sync script).
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const outFile = join(repoRoot, 'src', 'data', 'cast-lexicon.generated.js')

/** Bundled fallback — keep in sync with LearningSystem `src/data/castLexicon.js` option tables. */
const BUNDLED = {
  characterOpts: [
    { bits: '00', label: 'Giant', arrow: '→ hub', role: 'Hub / controller', pickWhen: 'One side clearly owns, routes, or dominates the dependency (hub-like control).' },
    { bits: '01', label: 'Mermaid', arrow: '↔ peer', role: 'Partner exchange', pickWhen: 'Bidirectional peer flow — equals negotiating, syncing, or swapping with each other.' },
    { bits: '10', label: 'Mage', arrow: '→ service', role: 'Helper / subtle', pickWhen: 'Outbound help or subtle influence — service, filter, adapter, not the throne.' },
    { bits: '11', label: 'Dragon', arrow: '← reverse', role: 'Reactor / triggered', pickWhen: 'Target pushes back or the edge is reactionary — reverse pressure, exception, trigger.' },
  ],
  actionOpts: [
    { bits: '00', label: 'crushing', strength: 'strong control', meaning: 'controls / owns', pickWhen: 'The edge tightly constrains or owns what happens downstream (hard gate, ownership).' },
    { bits: '01', label: 'flowing', strength: 'medium feed', meaning: 'feeds / supplies', pickWhen: 'Steady pipeline or medium coupling — continuous supply, default data path.' },
    { bits: '10', label: 'spreading', strength: 'weak influence', meaning: 'influences / affects', pickWhen: 'Soft touch, optional branches, background nudges — weak but non-trivial coupling.' },
    { bits: '11', label: 'exploding', strength: 'critical transform', meaning: 'transforms / breaks', pickWhen: 'Phase change, breakages, spikes — the edge rewrites state or kicks a rare path.' },
  ],
  streamOpts: [
    { bits: '00', label: 'rock', flows: 'data / structure', pickWhen: 'Schema, layout, invariants — things that “sit” as structure more than live traffic.' },
    { bits: '01', label: 'water', flows: 'energy / resources', pickWhen: 'Throughput, budgets, power, capacity — consumables and rates, not message shape.' },
    { bits: '10', label: 'cloud', flows: 'information / signals', pickWhen: 'APIs, configs, telemetry, handshakes — *signaling* and payloads, not the bedrock schema.' },
    { bits: '11', label: 'stone', flows: 'events / triggers', pickWhen: 'Discrete commits, ticks, incidents — countable state changes rather than continuous flow.' },
  ],
  timeOpts: [
    { bits: '00', label: 'red cave', stability: 'permanent', pickWhen: 'Treat as law or bedrock — rarely renegotiated in the story you are encoding.' },
    { bits: '01', label: 'blue ocean', stability: 'mostly active', pickWhen: 'Long-lived background — usually on, but not as rigid as “never changes”.' },
    { bits: '10', label: 'green sky', stability: 'conditional', pickWhen: 'Holds only under modes, flags, environments, or version branches.' },
    { bits: '11', label: 'purple storm', stability: 'temporal', pickWhen: 'Bursts, deadlines, spikes — explicitly time-bounded windows.' },
  ],
}

const DEFAULT_HELP = `CAST — Character / Action / Stream / Time (8 bits = four 2-bit slots)

Character (AB) — direction lives in the role
• Giant → hub — one side owns, routes, or dominates the dependency.
• Mermaid ↔ peer — bidirectional equals negotiating, syncing, swapping.
• Mage → service — outbound help, filter, adapter; not the throne.
• Dragon ← reverse — target pushes back; reactionary edge, trigger.

Concrete arrow tip: name WHO has the initiative on the edge first; that pins Character (AB). Then classify control vs feed vs influence vs rupture for Action (CD).

Action (CD): crushing / flowing / spreading / exploding — strength of coupling or transform.

Stream (EF): rock / water / cloud / stone — structure vs throughput vs signals vs discrete events.

Time (GH): red cave / blue ocean / green sky / purple storm — how stable the relation is in your story.

Answer format in quizzes: four spaced 2-bit groups (Character Action Stream Time), e.g. \`10 11 10 00\` — two bits per slot in order AB CD EF GH.
`

function stableReviewKey(binary8) {
  const h = createHash('sha256').update(`cast_v1|${binary8}`).digest('hex').slice(0, 16)
  return `cast1_${h}`
}

function buildRows(mod) {
  const { characterOpts, actionOpts, streamOpts, timeOpts } = mod
  const rows = []
  for (const c of characterOpts) {
    for (const a of actionOpts) {
      for (const s of streamOpts) {
        for (const t of timeOpts) {
          const ab = c.bits
          const cd = a.bits
          const ef = s.bits
          const gh = t.bits
          const binary8 = `${ab}${cd}${ef}${gh}`
          const answer = `${ab} ${cd} ${ef} ${gh}`
          const prompt = `${c.label} (${c.arrow}) · ${a.label} · ${s.label} (${s.flows}) · ${t.label}`
          const tooltip = [
            `AB — ${c.pickWhen}`,
            `CD — ${a.pickWhen}`,
            `EF — ${s.pickWhen}`,
            `GH — ${t.pickWhen}`,
          ].join(' ')
          rows.push({
            reviewKey: stableReviewKey(binary8),
            answer,
            prompt,
            tooltip,
            binary8,
          })
        }
      }
    }
  }
  return rows
}

async function tryImportLexicon() {
  const envRoot = process.env.LEARNING_SYSTEM_ROOT
  const candidates = [
    envRoot && join(envRoot, 'src', 'data', 'castLexicon.js'),
    join(repoRoot, '..', 'LearningSystem', 'src', 'data', 'castLexicon.js'),
    join(repoRoot, '..', '..', 'LearningSystem', 'src', 'data', 'castLexicon.js'),
  ].filter(Boolean)

  for (const abs of candidates) {
    try {
      const mod = await import(pathToFileURL(abs).href)
      if (mod.characterOpts && mod.actionOpts && mod.streamOpts && mod.timeOpts) {
        console.log('Loaded cast lexicon from:', abs)
        return mod
      }
    } catch {
      /* try next */
    }
  }
  console.warn('No local LearningSystem castLexicon.js — using bundled option tables.')
  return BUNDLED
}

function readHelpExtra(root) {
  if (!root) return ''
  const md = join(root, 'theSystem', 'cast-system.md')
  try {
    const text = readFileSync(md, 'utf8')
    const lines = text.split(/\r?\n/)
    const start = lines.findIndex((l) => l.includes('AB =') || l.includes('Character  00'))
    if (start >= 0) return ['---', 'From LearningSystem theSystem/cast-system.md (excerpt):', ...lines.slice(start, start + 25)].join('\n')
  } catch {
    /* ignore */
  }
  return ''
}

async function main() {
  const mod = await tryImportLexicon()
  const rows = buildRows(mod)
  const envRoot = process.env.LEARNING_SYSTEM_ROOT
  const root = envRoot && envRoot.length ? envRoot : join(repoRoot, '..', 'LearningSystem')
  const extra = readHelpExtra(root)
  const helpDrawer = [DEFAULT_HELP, extra].filter(Boolean).join('\n\n')

  const payload = {
    generatedAt: new Date().toISOString(),
    rowCount: rows.length,
    rows,
    helpDrawer,
  }

  const body = `/* eslint-disable */
// AUTO-GENERATED by scripts/sync-cast-lexicon.mjs — do not edit by hand.
// Regenerate: npm run sync:cast

export const CAST_GENERATED_AT = ${JSON.stringify(payload.generatedAt)}
export const CAST_ROW_COUNT = ${payload.rowCount}
export const CAST_HELP_DRAWER = ${JSON.stringify(payload.helpDrawer)}
export const CAST_ROWS = ${JSON.stringify(payload.rows, null, 2)}
`

  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, body, 'utf8')
  console.log(`Wrote ${rows.length} rows → ${outFile}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
