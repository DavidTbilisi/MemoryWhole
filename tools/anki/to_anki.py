#!/usr/bin/env python3
"""
to_anki.py — MemoryWhole → Anki

Converts MemoryWhole deck data (from dump_decks.mjs) into Anki .apkg packages.

Usage:
  # Step 1: dump deck data (run once)
  node tools/anki/dump_decks.mjs -o decks.json

  # Step 2: convert to Anki
  python tools/anki/to_anki.py decks.json                    # all decks
  python tools/anki/to_anki.py decks.json --deck major       # one deck
  python tools/anki/to_anki.py decks.json --output ./output  # custom dir
  python tools/anki/to_anki.py decks.json --with-images      # download images

Card format:
  Front  — the key/prompt (number, bits, word, etc.)
  Back   — the association/answer + image thumbnail (if available)

For CAST / stackfund decks the front is the prose prompt and the back is
the answer (bit pattern / short answer), since that matches quiz direction.

Requirements:
  pip install genanki requests
"""

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

try:
    import genanki
except ImportError:
    sys.exit("Missing dependency: pip install genanki")


# ── Anki model / card templates ───────────────────────────────────────────────

CARD_CSS = """
.card {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 18px;
  text-align: center;
  background: #0f172a;
  color: #e2e8f0;
  padding: 24px;
  min-height: 100px;
}
.key {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: #38bdf8;
  letter-spacing: 2px;
  margin-bottom: 8px;
}
.deck-label {
  font-size: 11px;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
}
.association {
  font-size: 22px;
  color: #f1f5f9;
  margin: 12px 0;
  line-height: 1.5;
}
.card-image img {
  max-width: 280px;
  max-height: 180px;
  border-radius: 10px;
  border: 1px solid #334155;
  margin-top: 12px;
}
hr { border: none; border-top: 1px solid #334155; margin: 16px 0; }
"""

FRONT_TEMPLATE = """
<div class="deck-label">{{DeckLabel}}</div>
<div class="key">{{Key}}</div>
"""

BACK_TEMPLATE = """
{{FrontSide}}
<hr>
<div class="association">{{Association}}</div>
{{#Image}}<div class="card-image"><img src="{{Image}}"></div>{{/Image}}
"""

# For CAST / stackfund — front is the full prompt, back is the short answer
PROMPT_FRONT_TEMPLATE = """
<div class="deck-label">{{DeckLabel}}</div>
<div class="association">{{Key}}</div>
"""

PROMPT_BACK_TEMPLATE = """
{{FrontSide}}
<hr>
<div class="key">{{Association}}</div>
"""


# ── ID generation (stable across runs) ───────────────────────────────────────

def stable_id(seed: str) -> int:
    """Generate a stable numeric ID from a string (fits in Anki's int range)."""
    h = hashlib.md5(seed.encode()).hexdigest()
    return int(h[:15], 16) % (2**31 - 1)


def make_model(deck_id: str, prompt_style: bool = False) -> genanki.Model:
    front = PROMPT_FRONT_TEMPLATE if prompt_style else FRONT_TEMPLATE
    back = PROMPT_BACK_TEMPLATE if prompt_style else BACK_TEMPLATE
    return genanki.Model(
        stable_id(f"model:{deck_id}"),
        f"MemoryWhole — {deck_id}",
        fields=[
            {"name": "Key"},
            {"name": "Association"},
            {"name": "Image"},
            {"name": "DeckLabel"},
        ],
        templates=[
            {
                "name": "Card 1",
                "qfmt": front,
                "afmt": back,
            }
        ],
        css=CARD_CSS,
    )


# ── Image handling ────────────────────────────────────────────────────────────

def is_url(s: str) -> bool:
    return s.startswith("http://") or s.startswith("https://")


def is_svg_data_uri(s: str) -> bool:
    return s.startswith("data:image/svg+xml")


def safe_filename(deck_id: str, key: str, ext: str = "jpg") -> str:
    safe_key = re.sub(r"[^a-zA-Z0-9_\-]", "_", key)
    return f"mw_{deck_id}_{safe_key}.{ext}"


def download_image(url: str, dest: Path, timeout: int = 8) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MemoryWhole-AnkiConverter/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            dest.write_bytes(resp.read())
        return True
    except (urllib.error.URLError, OSError) as e:
        return False


def svg_data_uri_to_file(data_uri: str, dest: Path) -> bool:
    try:
        # Format: data:image/svg+xml;utf8,<encoded>
        if ";utf8," in data_uri:
            content = urllib.parse.unquote(data_uri.split(";utf8,", 1)[1])
        elif ";base64," in data_uri:
            import base64
            content = base64.b64decode(data_uri.split(";base64,", 1)[1]).decode()
        else:
            return False
        dest.write_text(content, encoding="utf-8")
        return True
    except Exception:
        return False


# ── Core conversion ───────────────────────────────────────────────────────────

def build_anki_package(
    deck_id: str,
    deck_info: dict,
    output_dir: Path,
    with_images: bool = False,
    verbose: bool = True,
) -> Path:
    import urllib.parse

    name = deck_info.get("name", deck_id)
    data: dict = deck_info.get("data", {})
    images: dict = deck_info.get("images", {})
    prompts: dict = deck_info.get("prompts", {})
    description = deck_info.get("description", "")

    # CAST / stackfund decks use prompts as the front question
    prompt_style = bool(prompts)

    model = make_model(deck_id, prompt_style=prompt_style)
    anki_deck = genanki.Deck(
        stable_id(f"deck:{deck_id}"),
        f"MemoryWhole::{name}",
    )
    anki_deck.description = description

    media_files: list[str] = []
    tmp_dir = output_dir / "_media_tmp" / deck_id
    if with_images:
        tmp_dir.mkdir(parents=True, exist_ok=True)

    skipped = 0
    for key, value in data.items():
        assoc = str(value or "")
        if not assoc or assoc == "—":
            skipped += 1
            continue

        # Determine card front/back based on deck style
        if prompt_style:
            # front = prose prompt, back = short answer (key or value)
            front_key = str(prompts.get(key, key))
            back_assoc = assoc
        else:
            front_key = str(key)
            back_assoc = assoc

        # Image handling
        img_filename = ""
        raw_img = str(images.get(str(key), ""))

        if with_images and raw_img:
            if is_url(raw_img):
                ext = "jpg" if not raw_img.lower().endswith(".png") else "png"
                fname = safe_filename(deck_id, str(key), ext)
                dest = tmp_dir / fname
                if not dest.exists():
                    ok = download_image(raw_img, dest)
                    if ok:
                        img_filename = fname
                        media_files.append(str(dest))
                        time.sleep(0.05)  # be polite to servers
                    elif verbose:
                        print(f"  [skip image] {key}: {raw_img[:60]}...")
                else:
                    img_filename = fname
                    if str(dest) not in media_files:
                        media_files.append(str(dest))

            elif is_svg_data_uri(raw_img):
                fname = safe_filename(deck_id, str(key), "svg")
                dest = tmp_dir / fname
                if not dest.exists():
                    ok = svg_data_uri_to_file(raw_img, dest)
                    if ok:
                        img_filename = fname
                        media_files.append(str(dest))
                else:
                    img_filename = fname
                    if str(dest) not in media_files:
                        media_files.append(str(dest))

        note = genanki.Note(
            model=model,
            fields=[front_key, back_assoc, img_filename, name],
        )
        anki_deck.add_note(note)

    pkg = genanki.Package(anki_deck)
    if media_files:
        pkg.media_files = media_files

    out_path = output_dir / f"{deck_id}.apkg"
    pkg.write_to_file(str(out_path))

    total = len(data)
    added = total - skipped
    if verbose:
        img_note = f" + {len(media_files)} images" if media_files else ""
        print(f"  ✓ {out_path.name}  ({added}/{total} notes{img_note})")

    return out_path


# ── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(
        description="Convert MemoryWhole deck JSON to Anki .apkg packages",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  node tools/anki/dump_decks.mjs -o decks.json
  python tools/anki/to_anki.py decks.json
  python tools/anki/to_anki.py decks.json --deck major
  python tools/anki/to_anki.py decks.json --deck binary --with-images
  python tools/anki/to_anki.py decks.json --output ~/Anki/MemoryWhole
        """,
    )
    p.add_argument("input", help="Path to decks.json produced by dump_decks.mjs")
    p.add_argument("--deck", help="Convert only this deck ID (e.g. major, binary, hex)")
    p.add_argument("--output", "-o", default="./anki_output", help="Output directory (default: ./anki_output)")
    p.add_argument("--with-images", action="store_true", help="Download and embed images in .apkg files")
    p.add_argument("--list", action="store_true", help="List available decks in the JSON and exit")
    p.add_argument("--quiet", "-q", action="store_true", help="Suppress progress output")
    return p.parse_args()


def main():
    args = parse_args()
    verbose = not args.quiet

    # Load deck data
    try:
        with open(args.input, "r", encoding="utf-8") as f:
            all_decks: dict = json.load(f)
    except FileNotFoundError:
        sys.exit(f"File not found: {args.input}")
    except json.JSONDecodeError as e:
        sys.exit(f"Invalid JSON in {args.input}: {e}")

    if args.list:
        print(f"{'Deck ID':<16} {'Items':>6}  Name")
        print("-" * 50)
        for did, info in all_decks.items():
            n = len(info.get("data", {}))
            print(f"  {did:<14} {n:>6}  {info.get('name', did)}")
        return

    # Select decks
    if args.deck:
        if args.deck not in all_decks:
            available = ", ".join(all_decks.keys())
            sys.exit(f"Unknown deck '{args.deck}'. Available: {available}")
        decks_to_convert = {args.deck: all_decks[args.deck]}
    else:
        decks_to_convert = all_decks

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if verbose:
        print(f"Output → {output_dir.resolve()}")
        if args.with_images:
            print("  (image download enabled — this may take a while)")
        print()

    for deck_id, deck_info in decks_to_convert.items():
        if verbose:
            n = len(deck_info.get("data", {}))
            print(f"[{deck_id}] {deck_info.get('name', deck_id)}  ({n} items)")
        try:
            build_anki_package(deck_id, deck_info, output_dir, args.with_images, verbose)
        except Exception as e:
            print(f"  ✗ ERROR: {e}", file=sys.stderr)

    if verbose:
        print("\nDone. Open .apkg files with Anki to import.")


if __name__ == "__main__":
    main()
