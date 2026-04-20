# MNEMONIC Training Console

Web app for building and training mnemonic systems (Major, PAO, Bible, Peg, Clocks, and others) with quiz mode, speed drills, analytics, rank progression, and spaced-repetition review.

## Highlights

- Multiple memory decks with image and icon support.
- Standard quiz mode with 6 options per prompt.
- Speed drill mode with score, streak, and timing metrics.
- Spaced repetition with decay modeling and due-item prioritization.
- Learning prognosis (retention, due load, risk, and short-term forecast).
- Recovery mode to focus weak items for faster rank rebound.
- Deck editor, preview tables/matrices, and deck export.
- Local persistence in browser storage.
- Optional Firebase auth + cloud sync.

## Tech Stack

- Vue 3
- Vite 5
- Tailwind CSS
- ECharts
- Firebase (optional auth + sync)
- Playwright (E2E scripts)

## Quick Start

### Prerequisites

- Node.js 18+ (recommended 20+)
- npm 9+

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open the local URL shown by Vite (usually http://localhost:5173).

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Favicon and App Icons

Favicon assets are served from the Vite public root.

- [public/favicon.ico](public/favicon.ico)
- [public/favicon-16x16.png](public/favicon-16x16.png)
- [public/favicon-32x32.png](public/favicon-32x32.png)
- [public/apple-touch-icon.png](public/apple-touch-icon.png)
- [public/android-chrome-192x192.png](public/android-chrome-192x192.png)
- [public/android-chrome-512x512.png](public/android-chrome-512x512.png)
- [public/site.webmanifest](public/site.webmanifest)

HTML icon wiring is configured in [index.html](index.html).

## Main App Flow

1. Open **Stack library** (sidebar) to browse atlas-aligned modules, read canonical doc links, and jump into drills (e.g. **Stack fundamentals**, **CAST**).
2. Select a deck from Home (including **Stack fundamentals**, **CAST edges** / **CAST reverse**, and classic mnemonic decks).
3. Configure subset/groups in quiz config.
4. Train with:
- Quiz (accuracy-oriented)
- Speed drill (time pressure and streak)
5. During **CAST** / **Stack fundamentals** quizzes, open **CAST help** or **Stack notes** for bundled offline reference.
6. Save session and inspect performance in Dashboard and Stats.
7. Use Recovery Suggestion to focus weak or overdue prompts.

## Spaced Repetition and Prognosis

The review system stores per-item state such as:

- ease
- repetitions
- lapses
- intervalDays
- stabilityDays
- lastReviewedAt
- nextDueAt

Retention estimate follows an exponential forgetting curve using elapsed time and stability.

Dashboard prognosis summarizes:

- retention now
- projected retention (short horizon)
- due count / overdue count
- risk count
- estimated daily load

Core implementation:

- [src/core/spaced-repetition.js](src/core/spaced-repetition.js)
- [src/core/quiz-engine.js](src/core/quiz-engine.js)

## Key Directories

- [src](src): Vue app source
- [src/components](src/components): reusable UI components
- [src/views](src/views): page-level screens
- [src/core](src/core): business logic (quiz, analytics, storage, sync, theme)
- [src/data](src/data): deck datasets
- [public](public): static assets served as-is
- [tests](tests): Playwright tests/specs
- [scripts](scripts): utility scripts and smoke checks

## Data and Persistence

Primary local storage keys are managed in analytics/review modules, including:

- analytics
- deck stats
- session history
- drill records
- review state
- deck edits/images/icons

Relevant modules:

- [src/core/analytics.js](src/core/analytics.js)
- [src/core/storage.js](src/core/storage.js)
- [src/core/deck-loader.js](src/core/deck-loader.js)

## Stack library & content sync (whole-system spine)

- **Stack library** ([`src/views/StackLibrary.vue`](src/views/StackLibrary.vue)): module cards, links to `theSystem/*.md` on GitHub (configurable base), and **Start drill** for decks that already exist in MemoryWhole.
- **Manifest:** `npm run sync:stack-manifest` writes [`src/data/stack-manifest.generated.js`](src/data/stack-manifest.generated.js) (`STACK_MANIFEST_MODULES`, doc URLs). Override source base: `ATLAS_DOC_BASE=https://.../theSystem npm run sync:stack-manifest`.
- **Stack fundamentals deck:** `npm run sync:stack-fundamentals` writes [`src/data/stack-fundamentals.generated.js`](src/data/stack-fundamentals.generated.js) (MCQ rows + tags + help). With `LEARNING_SYSTEM_ROOT` set, SKILL / onboarding excerpts are inlined (length-capped).
- **One-shot:** `npm run sync:stack` runs manifest + fundamentals + CAST generators.

Per-item **tags** (`#map`, `#cast`, …) live in `STACK_FUNDAMENTALS_TAGS` for future Recovery/filter wiring; review storage shape is unchanged.

## CAST content (LearningSystem sync)

CAST decks are generated from the same option tables as the LearningSystem CAST playground (`src/data/castLexicon.js`).

1. Clone [LearningSystem](https://github.com/DavidTbilisi/LearningSystem) beside this repo (or set `LEARNING_SYSTEM_ROOT` to its root path).
2. Regenerate the checked-in artifact:

```bash
npm run sync:cast
```

This writes [src/data/cast-lexicon.generated.js](src/data/cast-lexicon.generated.js) (256 edges: story → spaced 2-bit groups `AB CD EF GH`, plus bundled help text for the in-quiz drawer). If no local clone is found, the script uses bundled option tables so the command still completes.

**Review keys:** items use stable ids `cast1_<16-hex>` derived from the 8-bit pattern. If you change the hashing scheme in the sync script, existing spaced-repetition rows for `cast` in `reviewState_v1` will not match new keys (treat as a one-time migration: clear review state for `cast` / `castrev` or accept orphaned entries).

Requires **Node.js 18+** (same as the rest of the app). No Vite upgrade is required for the generator.

## Firebase Notes

Auth/sync logic is in:

- [src/core/firebase-auth.js](src/core/firebase-auth.js)
- [src/core/firebase-sync.js](src/core/firebase-sync.js)

Ensure Firebase config/environment is set appropriately before enabling production sync.

## Testing and Validation

From [package.json](package.json):

- **Unit:** `npm run test:unit` (Vitest, `tests/unit/**/*.test.js`)
- **Playwright (Vue app):** use [playwright-vue.config.js](playwright-vue.config.js) so Vite serves the SPA (including `/MemoryWhole/` base). Example:

```bash
npx playwright test --config=playwright-vue.config.js
```

- **Playwright (default config):** `npx playwright test` (legacy static server on port 3131)
- Utility verification scripts from [scripts](scripts)

## Customization

### Add or adjust deck content

Edit deck data in [src/data](src/data) and associated image/icon maps. For CAST, edit the generator or upstream LearningSystem lexicon, then run `npm run sync:cast`.

### UI changes

Primary app shell and navigation:

- [src/App.vue](src/App.vue)
- [src/components/Header.vue](src/components/Header.vue)

### Quiz behavior

- [src/components/Quiz.vue](src/components/Quiz.vue)
- [src/core/quiz-engine.js](src/core/quiz-engine.js)

## Troubleshooting

- If icons do not update, hard-refresh browser cache.
- If stale session data affects behavior, clear local storage and retry.
- If build size warnings appear, consider route-based/code splitting in Vite.

## License

No explicit license file is currently included in this repository.
