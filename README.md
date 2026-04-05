# MemoryWhole

A web app for mastering mnemonic systems. Train your memory using proven techniques like the Major System, PAO, Peg Matrix, and more — with spaced repetition, speed drills, detailed analytics, and cross-device sync.

Built for memory competitors, language learners, and anyone who wants to memorize large amounts of information efficiently.

---

## What It Does

You pick a mnemonic deck (e.g. Major System 0–99), and the app quizzes you on your associations. It tracks which items you get wrong or slow, and weights them higher so you practice them more. Over time, you build fluency.

**Modes:**
- **Standard Quiz** — work through a deck at your own pace
- **Speed Drill** — 60-second timed challenge, scored by accuracy and speed

**Decks:**
- Major System (0–99)
- SEM3 (sensory categories, 0–99)
- PAO System (Person–Action–Object, 0–99 across 10 franchises)
- Peg Matrix (100 items, audio × visual)
- Пег Матрица RU (Russian Peg Matrix)
- Famous Clocks (24 clock times)
- Calendar Months, Month Days, Bible Overview, Bible Books, Binary 4-bit

**Other features:**
- Edit your own associations for any deck
- Import / export deck data as JSON
- Analytics dashboard — accuracy, response times, mastery progress, weakest items
- Google Sign-In with Firestore cloud sync across devices

---

## Running Locally

No build step required. Just serve the files:

```bash
python -m http.server 3131
```

Then open `http://localhost:3131`.

**To run tests:**

```bash
npm install
npm test
```

Tests use Playwright and auto-start the dev server.

---

## Project Structure

```
index.html              # Single-page app entry point
styles.css              # Dark theme, mobile-responsive

js/
  state.js              # Shared app state, deck config, navigation
  quiz.js               # Quiz logic, speed drill, weighted replay queue
  analytics.js          # Stats tracking, mastery calculations
  firebase.js           # Google auth, Firestore sync, merge logic
  editor.js             # Deck editing UI, import/export
  preview.js            # Data preview tables
  stats.js              # Session results display
  data/                 # One file per mnemonic deck

tests/
  quiz.spec.js          # Quiz configuration tests
  sync.spec.js          # Cloud sync and analytics merge tests
```

---

## Technical Details

### Stack

- **Frontend**: Vanilla JS, HTML5, CSS3 — no framework, no build step
- **Storage**: `localStorage` (primary), Firestore (optional cloud sync)
- **Auth**: Firebase Authentication (Google OAuth)
- **Testing**: Playwright (E2E)

### Spaced Repetition

Each item has a weight (default 1). Weights adjust after each answer:

| Result | Weight change |
|---|---|
| Wrong | ×2 (max 16) |
| Correct but slow | ×1.3 (max 16) |
| Correct and fast | ×0.7 (min 1) |

Items with higher weights appear more frequently in the quiz queue.

### Cloud Sync

When you sign in, the app merges your local data with the cloud using an attempt-count strategy:

- If cloud has ≥ local attempts → use cloud data
- If local has more attempts → keep local, push to cloud

This ensures no progress is lost when syncing across devices.

### State Management

Global mutable state lives in `js/state.js` (no store pattern). Each deck has its own `localStorage` key for independent persistence. All UI is direct DOM manipulation.

### Mobile Support

- `viewport-fit=cover` + CSS `env(safe-area-inset-*)` for notched phones
- Touch-friendly hit targets throughout
