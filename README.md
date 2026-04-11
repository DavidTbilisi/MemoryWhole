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

1. Select a deck from Home.
2. Configure subset/groups in quiz config.
3. Train with:
- Quiz (accuracy-oriented)
- Speed drill (time pressure and streak)
4. Save session and inspect performance in Dashboard and Stats.
5. Use Recovery Suggestion to focus weak or overdue prompts.

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

## Firebase Notes

Auth/sync logic is in:

- [src/core/firebase-auth.js](src/core/firebase-auth.js)
- [src/core/firebase-sync.js](src/core/firebase-sync.js)

Ensure Firebase config/environment is set appropriately before enabling production sync.

## Stripe Premium Setup

Premium billing uses Stripe Billing with Firebase Functions.

Detailed architecture and lifecycle notes live in [docs/stripe-premium.md](docs/stripe-premium.md).

Frontend env:

- `VITE_PREMIUM_API_BASE`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_DEV_PREMIUM_EMAILS`
- `VITE_ADMIN_EMAILS`

Functions env:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `APP_BASE_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `ADMIN_EMAILS`

Functions source lives in [functions/src/index.js](functions/src/index.js). Subscription status is mirrored into Firestore at `users/{uid}/billing/subscription`, and the client unlocks premium features from that document.

Developer/admin notes:

- Emails in `VITE_DEV_PREMIUM_EMAILS` always get Pro in the client, even without an active Stripe subscription.
- Emails in `VITE_ADMIN_EMAILS` plus `ADMIN_EMAILS` see an admin panel in the account drawer and can grant Pro to another user by email or Firebase UID.

## Testing and Validation

There is no single npm test script in [package.json](package.json), but you can run:

- Playwright specs from [tests](tests)
- Utility verification scripts from [scripts](scripts)

Example Playwright run:

```bash
npx playwright test
```

## Customization

### Add or adjust deck content

Edit deck data in [src/data](src/data) and associated image/icon maps.

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
