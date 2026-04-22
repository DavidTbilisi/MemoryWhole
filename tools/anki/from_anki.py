#!/usr/bin/env python3
"""
from_anki.py — Anki → MemoryWhole

Reads an Anki .apkg file and converts it back to the JSON format used by
MemoryWhole's deck editor (same shape as exportDeckPayload in deck-loader.js).

The output JSON can be imported via the web app:
  Editor → Import → select the JSON file

Usage:
  python tools/anki/from_anki.py major.apkg
  python tools/anki/from_anki.py major.apkg --deck major
  python tools/anki/from_anki.py major.apkg -o major_import.json
  python tools/anki/from_anki.py major.apkg --inspect     # show raw card fields

Output shape (matches exportDeckPayload):
  {
    "deck":       "major",
    "exportedAt": "2026-04-22T...",
    "data":   { "00": "Saw", "01": "Day", ... },
    "images": { "00": "https://...", ... },
    "icons":  {}
  }

Requirements:
  pip install -r requirements.txt   (no extra deps beyond stdlib for this script)
"""

import argparse
import json
import os
import re
import shutil
import sqlite3
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path


# ── .apkg parsing ─────────────────────────────────────────────────────────────

class AnkiPackage:
    """Read-only view of an Anki .apkg (zip → SQLite collection)."""

    def __init__(self, path: str):
        self.path = Path(path)
        if not self.path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        if not zipfile.is_zipfile(self.path):
            raise ValueError(f"Not a valid .apkg (zip) file: {path}")

        self._tmpdir = tempfile.mkdtemp(prefix="mw_anki_")
        with zipfile.ZipFile(self.path) as zf:
            zf.extractall(self._tmpdir)

        # Anki 2.1 uses collection.anki21; older uses collection.anki2
        db_path = None
        for candidate in ("collection.anki21", "collection.anki2"):
            candidate_path = os.path.join(self._tmpdir, candidate)
            if os.path.exists(candidate_path):
                db_path = candidate_path
                break
        if not db_path:
            raise ValueError("No collection database found in .apkg")

        self._conn = sqlite3.connect(db_path)
        self._conn.row_factory = sqlite3.Row

    def close(self):
        self._conn.close()
        shutil.rmtree(self._tmpdir, ignore_errors=True)

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()

    # ── Schema introspection ─────────────────────────────────────────────────

    def get_models(self) -> dict:
        """Return all note models keyed by model ID."""
        cur = self._conn.execute("SELECT models FROM col")
        row = cur.fetchone()
        if not row:
            return {}
        try:
            return json.loads(row["models"])
        except (json.JSONDecodeError, TypeError):
            return {}

    def get_decks(self) -> dict:
        """Return all deck definitions keyed by deck ID."""
        cur = self._conn.execute("SELECT decks FROM col")
        row = cur.fetchone()
        if not row:
            return {}
        try:
            return json.loads(row["decks"])
        except (json.JSONDecodeError, TypeError):
            return {}

    def get_notes(self, model_id: str | None = None) -> list[dict]:
        """Return all notes, optionally filtered by model ID."""
        if model_id is not None:
            cur = self._conn.execute(
                "SELECT id, guid, mid, flds, tags FROM notes WHERE mid = ?",
                (int(model_id),)
            )
        else:
            cur = self._conn.execute("SELECT id, guid, mid, flds, tags FROM notes")
        return [dict(r) for r in cur.fetchall()]

    def get_card_notes(self, deck_id: str | None = None) -> list[dict]:
        """Return notes joined with their cards (for deck filtering)."""
        if deck_id is not None:
            cur = self._conn.execute(
                """SELECT DISTINCT n.id, n.guid, n.mid, n.flds, n.tags
                   FROM notes n
                   JOIN cards c ON c.nid = n.id
                   WHERE c.did = ?""",
                (int(deck_id),)
            )
        else:
            cur = self._conn.execute(
                "SELECT DISTINCT n.id, n.guid, n.mid, n.flds, n.tags FROM notes n"
            )
        return [dict(r) for r in cur.fetchall()]

    def list_decks(self) -> list[dict]:
        """Return human-readable deck list."""
        decks = self.get_decks()
        result = []
        for did, d in decks.items():
            name = d.get("name", "?")
            if name == "Default":
                continue
            result.append({"id": did, "name": name})
        return sorted(result, key=lambda x: x["name"])

    def list_models(self) -> list[dict]:
        """Return human-readable model list with field names."""
        models = self.get_models()
        result = []
        for mid, m in models.items():
            fields = [f["name"] for f in m.get("flds", [])]
            result.append({"id": mid, "name": m.get("name", "?"), "fields": fields})
        return result


# ── Field extraction ──────────────────────────────────────────────────────────

def parse_fields(flds: str, field_names: list[str]) -> dict:
    """Split Anki's tab-separated field string into a named dict."""
    parts = flds.split("\x1f")  # Anki uses the unit separator (0x1f)
    result = {}
    for i, name in enumerate(field_names):
        result[name] = parts[i] if i < len(parts) else ""
    return result


def strip_html(text: str) -> str:
    """Remove HTML tags from Anki field values."""
    return re.sub(r"<[^>]+>", "", text).strip()


def extract_image_filename(text: str) -> str:
    """Extract image filename from Anki <img src="..."> tag."""
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', text, re.IGNORECASE)
    return m.group(1) if m else ""


# ── Deck name → ID inference ──────────────────────────────────────────────────

KNOWN_DECK_IDS = {
    "binary": ["binary", "8-bit", "binary (8-bit)", "cross-matrix"],
    "hex": ["hex", "aristotelian", "hex (aristotelian)"],
    "major": ["major", "major system"],
    "sem3": ["sem3"],
    "months": ["months", "month days", "georgian"],
    "clocks": ["clocks", "famous clocks"],
    "calendar": ["calendar", "calendar months"],
    "bibleoverview": ["bible overview", "bibleoverview"],
    "biblebooks": ["bible books", "biblebooks"],
    "pao": ["pao", "person-action-object", "pao (parts)"],
    "paoscenes": ["pao (full", "pao scenes", "paoscenes"],
    "pegmatrix": ["peg matrix", "pegmatrix"],
    "pegmatrixru": ["peg matrix ru", "pegmatrixru", "russian"],
    "cast": ["cast edges", "cast"],
    "castrev": ["cast reverse", "castrev"],
    "stackfund": ["stack", "stackfund", "fundamentals"],
    "primes": ["prime", "primes"],
    "sem3major": ["sem3 major", "sem3major"],
}


def infer_deck_id(anki_deck_name: str, hint: str | None = None) -> str:
    """Best-effort inference of website deck ID from Anki deck name."""
    if hint:
        return hint

    lower = anki_deck_name.lower()
    # Strip "MemoryWhole::" prefix if present
    lower = re.sub(r"^memorywhole::", "", lower).strip()

    for deck_id, keywords in KNOWN_DECK_IDS.items():
        if any(kw in lower for kw in keywords):
            return deck_id

    # Fall back to sanitised version of the name
    return re.sub(r"[^a-z0-9]", "", lower) or "unknown"


# ── MemoryWhole field detection ───────────────────────────────────────────────

def find_mw_fields(field_names: list[str]) -> tuple[str | None, str | None]:
    """
    Given a note model's field names, return (key_field, association_field).
    Tries to match MemoryWhole's canonical field names first, then falls back
    to positional guessing.
    """
    names_lower = [n.lower() for n in field_names]

    key_candidates = ["key", "front", "prompt", "number", "bits", "digit"]
    assoc_candidates = ["association", "back", "answer", "value", "word", "mnemonic"]

    key_field = None
    assoc_field = None

    for c in key_candidates:
        if c in names_lower:
            key_field = field_names[names_lower.index(c)]
            break

    for c in assoc_candidates:
        if c in names_lower:
            assoc_field = field_names[names_lower.index(c)]
            break

    # Positional fallback: first field = key, second = association
    if key_field is None and len(field_names) >= 1:
        key_field = field_names[0]
    if assoc_field is None and len(field_names) >= 2:
        assoc_field = field_names[1]

    return key_field, assoc_field


def find_image_field(field_names: list[str]) -> str | None:
    names_lower = [n.lower() for n in field_names]
    for c in ["image", "img", "picture", "photo"]:
        if c in names_lower:
            return field_names[names_lower.index(c)]
    return None


# ── Conversion ────────────────────────────────────────────────────────────────

def convert_package(
    pkg: AnkiPackage,
    deck_hint: str | None = None,
    anki_deck_filter: str | None = None,
    inspect: bool = False,
    verbose: bool = True,
) -> dict:
    """
    Convert an open AnkiPackage to a MemoryWhole export payload dict.
    Returns one combined payload if multiple Anki decks are present,
    or raises ValueError with a list of options if ambiguous.
    """
    models = pkg.get_models()
    anki_decks = pkg.list_decks()

    if inspect:
        print("=== Decks in this .apkg ===")
        for d in anki_decks:
            print(f"  [{d['id']}] {d['name']}")
        print("\n=== Note models ===")
        for m in pkg.list_models():
            print(f"  [{m['id']}] {m['name']}")
            print(f"     Fields: {', '.join(m['fields'])}")
        notes_sample = pkg.get_notes()[:3]
        print(f"\n=== Sample notes (first {len(notes_sample)}) ===")
        for n in notes_sample:
            mid_str = str(n["mid"])
            if mid_str in models:
                fnames = [f["name"] for f in models[mid_str].get("flds", [])]
                fields = parse_fields(n["flds"], fnames)
                print(f"  {fields}")
            else:
                print(f"  (raw) {n['flds'][:120]}")
        return {}

    # Resolve which Anki deck to use
    selected_deck_id = None
    if anki_deck_filter:
        for d in anki_decks:
            if anki_deck_filter.lower() in d["name"].lower() or anki_deck_filter == d["id"]:
                selected_deck_id = d["id"]
                break
        if not selected_deck_id:
            available = [d["name"] for d in anki_decks]
            raise ValueError(f"Deck '{anki_deck_filter}' not found. Available: {available}")
    elif len(anki_decks) == 1:
        selected_deck_id = anki_decks[0]["id"]
    elif anki_decks:
        selected_deck_id = None  # use all notes

    # Fetch notes
    raw_notes = pkg.get_card_notes(selected_deck_id)

    if not raw_notes:
        raise ValueError("No notes found in the package.")

    # Determine the website deck ID from the Anki deck name
    anki_name = ""
    if selected_deck_id:
        for d in anki_decks:
            if d["id"] == selected_deck_id:
                anki_name = d["name"]
                break
    elif anki_decks:
        anki_name = anki_decks[0]["name"]

    website_deck_id = infer_deck_id(anki_name, deck_hint)

    if verbose:
        print(f"  Anki deck : {anki_name or '(all)'}")
        print(f"  Website ID: {website_deck_id}")
        print(f"  Notes     : {len(raw_notes)}")

    # Build data / images maps
    data: dict[str, str] = {}
    images: dict[str, str] = {}

    for note in raw_notes:
        mid_str = str(note["mid"])
        if mid_str not in models:
            continue
        fnames = [f["name"] for f in models[mid_str].get("flds", [])]
        fields = parse_fields(note["flds"], fnames)

        key_field, assoc_field = find_mw_fields(fnames)
        img_field = find_image_field(fnames)

        if not key_field or not assoc_field:
            continue

        key = strip_html(fields.get(key_field, "")).strip()
        assoc = strip_html(fields.get(assoc_field, "")).strip()

        if not key:
            continue

        data[key] = assoc

        if img_field:
            raw_img = fields.get(img_field, "")
            fname = extract_image_filename(raw_img)
            if fname:
                # Note: bundled Anki images are just filenames; we record them as-is.
                # The user would need to manually re-link URLs after import.
                images[key] = fname
            elif raw_img.startswith("http"):
                images[key] = strip_html(raw_img)

    payload = {
        "deck": website_deck_id,
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "data": data,
        "images": images,
        "icons": {},
    }
    return payload


# ── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(
        description="Convert Anki .apkg back to MemoryWhole deck JSON",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python tools/anki/from_anki.py major.apkg
  python tools/anki/from_anki.py major.apkg --deck major -o major_import.json
  python tools/anki/from_anki.py major.apkg --inspect
  python tools/anki/from_anki.py all_decks.apkg --anki-deck "MemoryWhole::Binary (8-bit)"

After conversion, import the JSON file via:
  Web app → Editor → select deck → Import button
        """,
    )
    p.add_argument("input", help="Path to the .apkg file")
    p.add_argument(
        "--deck", "-d",
        help="Force website deck ID (e.g. major, binary). Auto-detected if omitted."
    )
    p.add_argument(
        "--anki-deck",
        help="Filter by Anki deck name when .apkg contains multiple decks"
    )
    p.add_argument(
        "--output", "-o",
        help="Output JSON path (default: <input_stem>_import.json)"
    )
    p.add_argument(
        "--inspect",
        action="store_true",
        help="Print internal structure of the .apkg and exit (no conversion)"
    )
    p.add_argument("--quiet", "-q", action="store_true")
    return p.parse_args()


def main():
    args = parse_args()
    verbose = not args.quiet

    try:
        with AnkiPackage(args.input) as pkg:
            payload = convert_package(
                pkg,
                deck_hint=args.deck,
                anki_deck_filter=args.anki_deck,
                inspect=args.inspect,
                verbose=verbose,
            )
    except (FileNotFoundError, ValueError, zipfile.BadZipFile) as e:
        sys.exit(f"Error: {e}")

    if args.inspect or not payload:
        return

    # Determine output path
    if args.output:
        out_path = Path(args.output)
    else:
        stem = Path(args.input).stem
        out_path = Path(f"{stem}_import.json")

    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    if verbose:
        n_data = len(payload.get("data", {}))
        n_images = len([v for v in payload.get("images", {}).values() if v])
        print(f"\n  → {out_path}  ({n_data} entries, {n_images} images)")
        print("\nImport via: Editor → select deck → Import button in the web app.")


if __name__ == "__main__":
    main()
