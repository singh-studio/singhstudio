#!/bin/sh
# new-thought.sh — scaffold a new Thoughts post.
#
# Usage: bin/new-thought.sh "slug" "Title"
#   slug  — lowercase, hyphen-separated, becomes thought-<slug>.html
#   title — the post's display title (used in <title>, og:title, JSON-LD headline, H1)
#
# Copies the structure of thought-the-20-minute-brief.html with the title, canonical URL,
# og tags, JSON-LD, and date swapped in. Does NOT touch thoughts.html, feed.xml or
# sitemap.xml — it prints the three snippets you paste into those by hand, so a human (or
# reviewing agent) always sees the diff before the post goes live.
#
# Refuses to overwrite an existing file.

set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SITE_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
TEMPLATE="$SITE_ROOT/thought-the-20-minute-brief.html"

usage() {
  echo "Usage: $0 \"slug\" \"Title\"" >&2
  echo "  Example: $0 \"pricing-is-a-brief\" \"Pricing is a brief\"" >&2
  exit 1
}

if [ "$#" -ne 2 ]; then
  usage
fi

SLUG=$1
TITLE=$2

if [ -z "$SLUG" ] || [ -z "$TITLE" ]; then
  usage
fi

case "$SLUG" in
  [a-z0-9]*[a-z0-9] | [a-z0-9] ) ;;
  * )
    echo "error: slug must be lowercase letters, digits and hyphens only (got: $SLUG)" >&2
    exit 1
    ;;
esac
case "$SLUG" in
  *[!a-z0-9-]* )
    echo "error: slug must be lowercase letters, digits and hyphens only (got: $SLUG)" >&2
    exit 1
    ;;
esac

OUT_FILE="thought-$SLUG.html"
OUT_PATH="$SITE_ROOT/$OUT_FILE"

if [ -e "$OUT_PATH" ]; then
  echo "error: $OUT_FILE already exists — refusing to overwrite" >&2
  exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
  echo "error: template not found at $TEMPLATE" >&2
  exit 1
fi

TODAY=$(date "+%Y-%m-%d")
TODAY_MONTH=$(date "+%Y-%m")
# "May 2026"-style human month for the byline — portable across BSD/GNU date.
MONTH_YEAR=$(date -j -f "%Y-%m-%d" "$TODAY" "+%B %Y" 2>/dev/null || date -d "$TODAY" "+%B %Y" 2>/dev/null || echo "$TODAY_MONTH")

CANONICAL="https://www.singhstudio.co.nz/$OUT_FILE"

# Escape characters that are meaningful to sed's replacement text (&, /, \).
sed_escape() {
  printf '%s' "$1" | sed -e 's/[&/\]/\\&/g'
}

TITLE_ESC=$(sed_escape "$TITLE")
CANONICAL_ESC=$(sed_escape "$CANONICAL")
TODAY_ESC=$(sed_escape "$TODAY")
TODAY_MONTH_ESC=$(sed_escape "$TODAY_MONTH")
MONTH_YEAR_ESC=$(sed_escape "$MONTH_YEAR")

# Placeholder copy — deliberately obvious so it can never ship by accident, and short enough
# to keep the meta description under the checker's 170-char limit and end in a full stop.
PLACEHOLDER_DESC="PLACEHOLDER — one-sentence summary of the thought, ending in a full stop."
PLACEHOLDER_DESC_ESC=$(sed_escape "$PLACEHOLDER_DESC")

cp "$TEMPLATE" "$OUT_PATH"

# --- head metadata -----------------------------------------------------------------
sed -i.bak \
  -e "s#<title>The 20-minute brief — Singh Studio</title>#<title>$TITLE_ESC — Singh Studio</title>#" \
  -e "s#<meta name=\"description\" content=\"What to bring to an intro call — and what to leave at home.\">#<meta name=\"description\" content=\"$PLACEHOLDER_DESC_ESC\">#" \
  -e "s#<meta property=\"og:title\" content=\"The 20-minute brief — Singh Studio\">#<meta property=\"og:title\" content=\"$TITLE_ESC — Singh Studio\">#" \
  -e "s#<meta property=\"og:description\" content=\"What to bring to an intro call — and what to leave at home.\">#<meta property=\"og:description\" content=\"$PLACEHOLDER_DESC_ESC\">#" \
  -e "s#<meta property=\"article:published_time\" content=\"2026-05-01\">#<meta property=\"article:published_time\" content=\"$TODAY_ESC\">#" \
  -e "s#<meta property=\"og:image\" content=\"https://www.singhstudio.co.nz/assets/img/gal-cafe-doc.jpg\">#<!-- PLACEHOLDER: pick a real og:image, 1200x630-ish, before publishing --><meta property=\"og:image\" content=\"https://www.singhstudio.co.nz/assets/img/gal-cafe-doc.jpg\">#" \
  -e "s#<link rel=\"canonical\" href=\"https://www.singhstudio.co.nz/thought-the-20-minute-brief.html\">#<link rel=\"canonical\" href=\"$CANONICAL_ESC\">#" \
  "$OUT_PATH"

# JSON-LD block (single line in the template — replace wholesale).
sed -i.bak \
  -e "s#{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"The 20-minute brief\",\"description\":\"What to bring to an intro call — and what to leave at home.\",\"author\":{\"@type\":\"Person\",\"name\":\"Kris Singh\"},\"publisher\":{\"@type\":\"Organization\",\"name\":\"Singh Studio\"},\"datePublished\":\"2026-05-01\",\"mainEntityOfPage\":\"https://www.singhstudio.co.nz/thought-the-20-minute-brief.html\"}#{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"$TITLE_ESC\",\"description\":\"$PLACEHOLDER_DESC_ESC\",\"author\":{\"@type\":\"Person\",\"name\":\"Kris Singh\"},\"publisher\":{\"@type\":\"Organization\",\"name\":\"Singh Studio\"},\"datePublished\":\"$TODAY_ESC\",\"mainEntityOfPage\":\"$CANONICAL_ESC\"}#" \
  "$OUT_PATH"

# --- body: eyebrow / H1 / lede / byline date / prose -------------------------------
sed -i.bak \
  -e "s#<p class=\"eyebrow\"><span class=\"red\">/</span> Thoughts — Briefing</p>#<p class=\"eyebrow\"><span class=\"red\">/</span> Thoughts — PLACEHOLDER topic</p>#" \
  -e "s#<h1 class=\"sub-title post-title\">The 20-minute brief</h1>#<h1 class=\"sub-title post-title\">$TITLE_ESC</h1>#" \
  -e "s#<p class=\"sub-lede\">What to bring to an intro call — and what to leave at home.</p>#<p class=\"sub-lede\">$PLACEHOLDER_DESC_ESC</p>#" \
  -e "s#<time datetime=\"2026-05\">May 2026</time> · 2 min read#<time datetime=\"$TODAY_MONTH_ESC\">$MONTH_YEAR_ESC</time> · PLACEHOLDER min read#" \
  "$OUT_PATH"

# --- share links + next-post pointer -------------------------------------------------
# NB: the em-dash below is a literal UTF-8 character in this script's own source, matched
# byte-for-byte — not a "." wildcard. Under a C/POSIX locale (common in minimal shells and
# some CI images) sed's "." matches a single *byte*, not a multi-byte UTF-8 character, so a
# one-dot wildcard silently fails to match a 3-byte em-dash. A literal-byte match sidesteps
# that locale sensitivity entirely.
sed -i.bak \
  -e "s#https://www.singhstudio.co.nz/thought-the-20-minute-brief.html#$CANONICAL_ESC#g" \
  -e "s#text=The%2020-minute%20brief%20—%20Singh%20Studio#text=PLACEHOLDER-replace-with-URL-encoded-title#" \
  "$OUT_PATH"

# --- replace the article body with a single obvious placeholder paragraph ----------
# Anything between <div class="prose"> and its closing </div> in the template is
# example content specific to the source post — swap it for one clearly-marked
# placeholder so the scaffolded page can never be mistaken for finished copy, while
# still being valid, well-formed HTML (balanced tags) out of the box.
awk -v title="$TITLE_ESC" '
  /<div class="prose">/ {
    print
    print "          <p>PLACEHOLDER — replace this paragraph (and add more) with the actual thought. Keep visible prose to at most 3 em-dashes per page, plain NZ English, typographic quotes.</p>"
    in_prose = 1
    next
  }
  in_prose && /<\/div>/ {
    print
    in_prose = 0
    next
  }
  in_prose { next }
  { print }
' "$OUT_PATH" > "$OUT_PATH.tmp" && mv "$OUT_PATH.tmp" "$OUT_PATH"

# --- next-thought pointer: the template's <div class="case-next"> wraps two sibling
# <a> elements — the "Next thought" link (which points at a fixed, known post and would
# be wrong for every new post) and the "Bring us the problem" CTA (which is always
# correct and must survive untouched). Replace exactly the known 4-line "Next thought"
# <a>...</a> block (matched as an awk line range, start pattern through end pattern) with
# a single placeholder comment — leaves valid, balanced HTML with nothing dangling.
awk '
  /<a href="thought-start-with-the-message.html" data-cursor="READ">/ {
    print "        <!-- PLACEHOLDER: wire up the real next-post link once the publish order is decided (or delete this comment if this is the newest post) -->"
    in_skip = 1
    next
  }
  in_skip && /<\/a>/ { in_skip = 0; next }
  in_skip { next }
  { print }
' "$OUT_PATH" > "$OUT_PATH.tmp" && mv "$OUT_PATH.tmp" "$OUT_PATH"

rm -f "$OUT_PATH.bak"

echo "Created $OUT_FILE"
echo ""
echo "Next steps — paste these three snippets by hand:"
echo ""
echo "1) Listing row for thoughts.html (inside <div class=\"post-list\">):"
echo "-----------------------------------------------------------------"
cat <<ROW
        <a class="post-item" href="$OUT_FILE" data-cursor="READ" data-topic="PLACEHOLDER">
          <time datetime="$TODAY_MONTH">$MONTH_YEAR</time>
          <div>
            <h2>$TITLE</h2>
            <p class="post-sub">$PLACEHOLDER_DESC</p>
          </div>
          <span class="post-end"><span class="post-tag">PLACEHOLDER</span><span class="post-read">PLACEHOLDER min</span></span>
        </a>
ROW
echo ""
echo "2) <item> for feed.xml (inside <channel>, newest first):"
echo "-----------------------------------------------------------------"
cat <<ITEM
  <item>
    <title>$TITLE</title>
    <link>$CANONICAL</link>
    <guid>$CANONICAL</guid>
    <pubDate>$(date "+%a, %d %b %Y") 09:00:00 +1200</pubDate>
    <description>$PLACEHOLDER_DESC</description>
  </item>
ITEM
echo ""
echo "3) <url> for sitemap.xml (priority 0.6, matching the other thought- pages):"
echo "-----------------------------------------------------------------"
cat <<URLTAG
  <url><loc>$CANONICAL</loc><priority>0.6</priority></url>
URLTAG
echo ""
echo "Reminder: also update thoughts.html's \"NN observations\" count and topic-chip"
echo "<sup> counters, and point the PREVIOUS latest post's \"Next thought\" link at"
echo "$OUT_FILE once you decide the publish order."
