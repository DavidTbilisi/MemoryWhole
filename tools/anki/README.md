# MemoryWhole ↔ Anki Converter

Two-way conversion between MemoryWhole decks and Anki `.apkg` packages.

```
Website decks ──→ dump_decks.mjs ──→ decks.json ──→ to_anki.py ──→ *.apkg
                                                                       │
Website Editor ←─── *_import.json ←─── from_anki.py ←────────────────┘
```

---

## Setup

```bash
# Python dependencies
pip install -r tools/anki/requirements.txt

# Node.js is already available (used by the Vite project)
```

---

## Website → Anki

### Step 1 — dump all deck data to JSON

```bash
npx vite-node tools/anki/dump_decks.mjs -o decks.json
```

`vite-node` is used because some data files use Vite's extension-less
imports (`import ... from './pao10'`). It's already in the project's
devDependencies so no extra install is needed.

Options:

| Flag | Description |
|------|-------------|
| `-o <file>` | Write to file instead of stdout |
| `--deck <id>` | Dump a single deck |
| `--list` | Show all available deck IDs and item counts |

```bash
# List available decks
npx vite-node tools/anki/dump_decks.mjs --list

# Single deck to stdout
npx vite-node tools/anki/dump_decks.mjs --deck major

# All decks to file
npx vite-node tools/anki/dump_decks.mjs -o decks.json
```

### Step 2 — convert JSON to Anki packages

```bash
python tools/anki/to_anki.py decks.json
```

This writes one `.apkg` file per deck into `./anki_output/`.

Options:

| Flag | Description |
|------|-------------|
| `--deck <id>` | Convert only one deck |
| `--output <dir>` | Output directory (default: `./anki_output`) |
| `--with-images` | Download and embed images into the `.apkg` |
| `--list` | List decks in the JSON and exit |
| `--quiet` | Suppress progress output |

```bash
# All decks
python tools/anki/to_anki.py decks.json

# Single deck with images
python tools/anki/to_anki.py decks.json --deck major --with-images

# Custom output directory
python tools/anki/to_anki.py decks.json --output ~/Anki/MemoryWhole
```

### Card format

| Side | Content |
|------|---------|
| **Front** | The key/prompt (number, binary string, clock time, hex digit…) |
| **Back** | The mnemonic association + image thumbnail (when `--with-images`) |

**CAST / Stack decks** are reversed: the prose prompt is on the front and
the short answer (bit pattern / answer text) is on the back, matching the
quiz direction used in the web app.

All cards are nested under **`MemoryWhole::<deck name>`** in Anki so they
appear in a clean sub-deck hierarchy.

---

## Anki → Website

```bash
python tools/anki/from_anki.py major.apkg
```

This reads the `.apkg`, extracts notes, and writes `major_import.json`.

Options:

| Flag | Description |
|------|-------------|
| `--deck <id>` | Force the website deck ID (auto-detected if omitted) |
| `--anki-deck <name>` | Filter by Anki deck name (when `.apkg` has multiple) |
| `--output <file>` | Custom output path |
| `--inspect` | Print internal `.apkg` structure (fields, decks, sample notes) |
| `--quiet` | Suppress output |

```bash
# Auto-detect deck type
python tools/anki/from_anki.py major.apkg

# Force deck ID, custom output
python tools/anki/from_anki.py major.apkg --deck major -o major_import.json

# Inspect a package before converting
python tools/anki/from_anki.py some.apkg --inspect

# Multi-deck .apkg: pick one Anki sub-deck
python tools/anki/from_anki.py all.apkg --anki-deck "MemoryWhole::Binary (8-bit)"
```

### Importing the JSON into the web app

1. Open the web app
2. Navigate to **Editor** and select the target deck
3. Click **Import** and select the `*_import.json` file
4. Review and **Save**

> **Note on images:** Anki bundles images as local filenames. After import,
> image URLs will not be restored automatically. Re-link them manually in
> the Editor if needed.

---

## Available decks

| Deck ID | Items | Description |
|---------|------:|-------------|
| `binary` | 256 | 8-bit cross-matrix · Giant/Mermaid/Mage/Dragon |
| `hex` | 16 | Aristotelian element × quality (0-F) |
| `major` | 100 | Major System (number → word) |
| `sem3` | 100 | SEM3 sense × object matrix |
| `months` | 33 | Georgian ABC month-day mnemonics |
| `clocks` | 24 | Famous clocks by hour |
| `calendar` | 12 | Calendar months |
| `bibleoverview` | 10 | Bible canonical sections |
| `biblebooks` | 66 | Bible books in order |
| `pao` | 30 | PAO parts (P/A/O × digits 0-9) |
| `paoscenes` | 1000 | PAO full 3-digit scenes (generated) |
| `pegmatrix` | 100 | English peg matrix (audio × visual) |
| `pegmatrixru` | 100 | Russian peg matrix |
| `cast` | 256 | CAST edges: story → byte |
| `castrev` | 256 | CAST reverse: byte → story |
| `stackfund` | 12 | Stack fundamentals |
| `primes` | 1229 | Prime numbers ≤ 9999 (Major + SEM3) |
| `sem3major` | 10 000 | 4-digit SEM3 × Major composite |
