#!/usr/bin/env bash
#
# ============================================================
# ingest-images.sh — Singh Studio image pipeline
# ============================================================
#
# What it does
#   Drop finished photos into _incoming/, run this script, and it
#   resizes + renames each one into assets/img/ as a web-ready JPEG
#   (via sips), plus a matching .webp (via ffmpeg, if installed).
#   Nothing outside assets/img/ is touched, and _incoming/ itself
#   is never modified — your originals stay exactly as dropped.
#
# Requires
#   sips   — ships with macOS, no install needed.
#   ffmpeg — optional. If it's not on your PATH, the script still
#            produces the JPEG and prints a notice that webp was
#            skipped for that file, rather than failing.
#
# Usage
#   bin/ingest-images.sh [options] [file-or-dir ...]
#
#   With no file/dir arguments, it processes every image file
#   sitting directly in _incoming/.
#
# Options
#   --slug NAME       Output filename (without extension) for a
#                      SINGLE input file. Required if you pass
#                      exactly one file and want a specific name
#                      instead of the cleaned-up source filename.
#                      Not valid when processing more than one file.
#   --hero            Long edge 2000px instead of the default 1600px.
#                      Use for hero/banner shots that need extra size.
#   --max-size N       Override the long-edge size in pixels
#                      (default 1600, or 2000 with --hero).
#   --quality N        JPEG quality 1-100 (default 80).
#   --webp-quality N   ffmpeg webp quality 0-100 (default 78).
#   --force            Overwrite existing files in assets/img/.
#                      Without this flag, the script refuses to
#                      clobber a file that's already there.
#   --dest DIR         Output directory (default: assets/img/,
#                      resolved relative to the repo root, i.e.
#                      the parent of this script's own bin/ folder).
#   -h, --help         Show this header and exit.
#
# Examples
#   # Process everything sitting in _incoming/, using cleaned-up
#   # source filenames, at the default 1600px/quality-80 settings:
#   bin/ingest-images.sh
#
#   # Process one file with an explicit slug (recommended — gives
#   # you control over the final filename instead of whatever the
#   # camera or export tool called it):
#   bin/ingest-images.sh --slug gal-new-alley-shot _incoming/IMG_4821.jpg
#
#   # A new hero shot, sized up to 2000px long edge:
#   bin/ingest-images.sh --hero --slug hero-newshot _incoming/hero-candidate.jpg
#
#   # Re-run after adding more originals to _incoming/, overwriting
#   # anything that already exists in assets/img/ (e.g. after a
#   # re-edit of a photo you already ingested once):
#   bin/ingest-images.sh --force
#
#   # A batch of archive frames dropped straight into assets/img/archive/
#   # instead of the flat assets/img/ folder:
#   bin/ingest-images.sh --dest assets/img/archive _incoming/*.jpg
#
# Notes
#   - Input formats accepted: .jpg .jpeg .png .heic .tif .tiff
#     (anything sips can read). Output is always .jpg (+ .webp).
#   - The cleaned-up filename (used when --slug is omitted) lowercases
#     the name, swaps spaces/underscores for hyphens, and strips
#     anything that isn't a-z, 0-9 or a hyphen.
#   - width/height in your HTML <img> tags won't update themselves —
#     after ingesting, open the file with `sips -g pixelWidth -g
#     pixelHeight` and update the width/height attributes by hand.
#     See IMAGE-MAP.md for where each image is referenced.
#
# ============================================================

set -euo pipefail

# ------------------------------------------------------------
# Resolve paths relative to the repo root (parent of bin/),
# regardless of the caller's own working directory.
# ------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INCOMING_DIR="$REPO_ROOT/_incoming"
DEFAULT_DEST="$REPO_ROOT/assets/img"

# ------------------------------------------------------------
# Defaults
# ------------------------------------------------------------
MAX_SIZE=1600
QUALITY=80
WEBP_QUALITY=78
FORCE=0
SLUG=""
DEST="$DEFAULT_DEST"
HERO=0
FILES=()

print_help() {
  # Print every leading comment line (the whole header block at the
  # top of this file, shebang excluded), stopping at the first blank
  # or non-comment line once the code starts.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" \
    | sed '/^set -euo pipefail/d' \
    | sed -E 's/^# ?//'
}

# ------------------------------------------------------------
# Arg parsing
# ------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --slug)
      SLUG="${2:-}"; shift 2 ;;
    --hero)
      HERO=1; shift ;;
    --max-size)
      MAX_SIZE="${2:-}"; shift 2 ;;
    --quality)
      QUALITY="${2:-}"; shift 2 ;;
    --webp-quality)
      WEBP_QUALITY="${2:-}"; shift 2 ;;
    --force)
      FORCE=1; shift ;;
    --dest)
      DEST="${2:-}"; shift 2 ;;
    -h|--help)
      print_help; exit 0 ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do FILES+=("$1"); shift; done
      ;;
    -*)
      echo "Unknown option: $1" >&2
      echo "Run with --help for usage." >&2
      exit 1
      ;;
    *)
      FILES+=("$1"); shift ;;
  esac
done

if [[ $HERO -eq 1 && "$MAX_SIZE" -eq 1600 ]]; then
  MAX_SIZE=2000
fi

# Resolve DEST to an absolute path (accept relative-to-repo-root too)
if [[ "$DEST" != /* ]]; then
  DEST="$REPO_ROOT/$DEST"
fi

# ------------------------------------------------------------
# Build the file list: explicit args, or everything in _incoming/
# ------------------------------------------------------------
shopt -s nullglob nocaseglob

if [[ ${#FILES[@]} -eq 0 ]]; then
  if [[ ! -d "$INCOMING_DIR" ]]; then
    echo "No _incoming/ folder found at $INCOMING_DIR and no files given." >&2
    echo "Create it, drop images in, and re-run — or pass file paths directly." >&2
    exit 1
  fi
  for f in "$INCOMING_DIR"/*.jpg "$INCOMING_DIR"/*.jpeg "$INCOMING_DIR"/*.png "$INCOMING_DIR"/*.heic "$INCOMING_DIR"/*.tif "$INCOMING_DIR"/*.tiff; do
    FILES+=("$f")
  done
fi

shopt -u nocaseglob

# Expand any directories passed in FILES into their image contents
EXPANDED=()
for f in "${FILES[@]}"; do
  if [[ -d "$f" ]]; then
    for g in "$f"/*.jpg "$f"/*.jpeg "$f"/*.png "$f"/*.heic "$f"/*.tif "$f"/*.tiff; do
      EXPANDED+=("$g")
    done
  else
    EXPANDED+=("$f")
  fi
done
FILES=("${EXPANDED[@]}")

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "Nothing to do — no images found." >&2
  echo "Drop files into _incoming/ (see _incoming/README.txt) or pass paths explicitly." >&2
  exit 1
fi

if [[ -n "$SLUG" && ${#FILES[@]} -gt 1 ]]; then
  echo "--slug can only be used with a single input file (you passed ${#FILES[@]})." >&2
  echo "Either process one file at a time with --slug, or drop the --slug flag" >&2
  echo "and let each file take its cleaned-up source filename." >&2
  exit 1
fi

# ------------------------------------------------------------
# Check for ffmpeg once, up front, so the notice only prints once
# ------------------------------------------------------------
HAVE_FFMPEG=1
if ! command -v ffmpeg >/dev/null 2>&1; then
  HAVE_FFMPEG=0
  echo "Notice: ffmpeg not found on PATH — skipping .webp output for every file." >&2
  echo "        Install it (e.g. \`brew install ffmpeg\`) to get webp versions too." >&2
fi

mkdir -p "$DEST"

# ------------------------------------------------------------
# Slugify a filename: lowercase, spaces/underscores -> hyphens,
# strip anything that isn't a-z 0-9 or hyphen, collapse repeats.
# ------------------------------------------------------------
slugify() {
  local base="$1"
  base="${base%.*}"
  base="$(echo "$base" | tr '[:upper:]' '[:lower:]')"
  base="$(echo "$base" | sed -E 's/[ _]+/-/g; s/[^a-z0-9-]//g; s/-+/-/g; s/^-+|-+$//g')"
  echo "$base"
}

PROCESSED=0
SKIPPED=0

for SRC in "${FILES[@]}"; do
  if [[ ! -f "$SRC" ]]; then
    echo "Skipping (not found): $SRC" >&2
    continue
  fi

  SRC_BASENAME="$(basename "$SRC")"

  if [[ -n "$SLUG" ]]; then
    NAME="$SLUG"
  else
    NAME="$(slugify "$SRC_BASENAME")"
  fi

  if [[ -z "$NAME" ]]; then
    echo "Skipping (couldn't derive a filename from): $SRC_BASENAME" >&2
    continue
  fi

  OUT_JPG="$DEST/$NAME.jpg"
  OUT_WEBP="$DEST/$NAME.webp"

  # Display path: relative to the repo root when DEST lives inside it
  # (the common case), otherwise just show the absolute path rather
  # than a mangled concatenation.
  if [[ "$OUT_JPG" == "$REPO_ROOT/"* ]]; then
    DISPLAY_JPG="${OUT_JPG#"$REPO_ROOT/"}"
  else
    DISPLAY_JPG="$OUT_JPG"
  fi

  if [[ -e "$OUT_JPG" && $FORCE -eq 0 ]]; then
    echo "Skip (exists, use --force to overwrite): $DISPLAY_JPG"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "-> $SRC_BASENAME  =>  $DISPLAY_JPG"

  # sips: resize (long edge, proportional) + JPEG quality, written
  # straight to the destination as a NEW file — the source in
  # _incoming/ is never touched.
  sips \
    --resampleHeightWidthMax "$MAX_SIZE" \
    --setProperty format jpeg \
    --setProperty formatOptions "$QUALITY" \
    "$SRC" \
    --out "$OUT_JPG" \
    >/dev/null

  DIMS="$(sips -g pixelWidth -g pixelHeight "$OUT_JPG" | awk '/pixelWidth|pixelHeight/{printf "%s", $2 "x"}' | sed 's/x$//')"
  echo "   sized: $DIMS  quality: $QUALITY"

  if [[ $HAVE_FFMPEG -eq 1 ]]; then
    if [[ -e "$OUT_WEBP" && $FORCE -eq 0 ]]; then
      echo "   webp skipped (exists, use --force to overwrite): $OUT_WEBP"
    else
      ffmpeg -y -loglevel error -i "$OUT_JPG" -q:v "$WEBP_QUALITY" "$OUT_WEBP"
      echo "   webp:  $(basename "$OUT_WEBP")"
    fi
  fi

  PROCESSED=$((PROCESSED + 1))
done

echo ""
echo "Done. $PROCESSED file(s) processed, $SKIPPED skipped (already existed — use --force to redo)."
echo "Remember: width/height attributes in the HTML don't update themselves —"
echo "check the new files with \`sips -g pixelWidth -g pixelHeight <file>\` and"
echo "update the matching <img width height> in the page. See IMAGE-MAP.md."
