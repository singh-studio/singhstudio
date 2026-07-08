#!/usr/bin/env python3
"""
check-site.py — Singh Studio site QA brain.

Python 3, stdlib only. Exit non-zero on any FAIL.

Checks:
  0. Encoding           — every tracked html/css/js/xml/txt file is valid UTF-8 (pre-flight;
                           a file that fails this reads as "" everywhere else instead of crashing).
  1. Link resolution   — every href/src/srcset/poster in tracked HTML resolves on disk.
  2. Orphan assets      — nothing under assets/ is unreferenced (excludes _incoming/).
  3. Nav consistency    — nav/menu/footer label sets + order identical across the 12 nav'd pages.
  4. Head metadata      — unique <title>, meta description sane, canonical matches filename,
                           og:description === meta description, on every indexable page.
  5. Feeds              — sitemap.xml / feed.xml well-formed; sitemap count == indexable page count.
  6. Tag balance         — HTMLParser stack-based balance check per page.
  7. node --check        — syntax-checks the site's JS files (skipped w/ warning if node absent).

Scope: only tracked/site files (root *.html, templates/*.html, css/, js/, assets/), via `git ls-files`
when available, else a filesystem walk that still excludes .claude/, _incoming/, and dotfiles/dirs.
"""

import os
import re
import shutil
import subprocess
import sys
from html.parser import HTMLParser
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Pages exempt from nav/indexability checks.
NON_NAV_PAGES = {"404.html"}

# Directories never scanned for "site" content (tooling, drafts, VCS internals).
EXCLUDE_DIRS = {".git", ".claude", "_incoming", "node_modules"}

VOID_HREF_SCHEMES = ("http://", "https://", "mailto:", "tel:", "data:")


# --------------------------------------------------------------------------------------
# File discovery
# --------------------------------------------------------------------------------------

def tracked_files():
    """Return repo-relative paths of tracked files, or None if git is unavailable."""
    try:
        out = subprocess.run(
            ["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, timeout=10
        )
        if out.returncode != 0:
            return None
        return [line for line in out.stdout.splitlines() if line.strip()]
    except (OSError, subprocess.SubprocessError):
        return None


def walk_files():
    """Fallback file walk when git is unavailable — still excludes tooling/draft dirs."""
    results = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel_dir = os.path.relpath(dirpath, ROOT)
        parts = [] if rel_dir == "." else rel_dir.split(os.sep)
        if any(p in EXCLUDE_DIRS or p.startswith(".") for p in parts):
            dirnames[:] = []
            continue
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for fn in filenames:
            if fn.startswith("."):
                continue
            rel = os.path.relpath(os.path.join(dirpath, fn), ROOT)
            results.append(rel)
    return results


def site_files():
    files = tracked_files()
    if files is None:
        files = walk_files()
    # Belt-and-braces: never scan excluded dirs even if something slipped into git ls-files.
    out = []
    for f in files:
        parts = f.split("/")
        if any(p in EXCLUDE_DIRS for p in parts):
            continue
        out.append(f)
    return out


ALL_FILES = site_files()
ALL_FILES_SET = set(ALL_FILES)
ROOT_HTML = sorted(f for f in ALL_FILES if "/" not in f and f.endswith(".html"))
TEMPLATE_HTML = sorted(f for f in ALL_FILES if f.startswith("templates/") and f.endswith(".html"))
ALL_HTML = ROOT_HTML + TEMPLATE_HTML
INDEXABLE_PAGES = sorted(f for f in ROOT_HTML if f not in NON_NAV_PAGES)
NAV_PAGES = INDEXABLE_PAGES  # same set today; kept as a distinct name for clarity at call sites

results = []  # list of (check_name, ok: bool, detail: str)


def record(check, ok, detail=""):
    results.append((check, ok, detail))


# --------------------------------------------------------------------------------------
# Shared helpers
# --------------------------------------------------------------------------------------

def strip_comments(html):
    """Remove HTML comments so link/text scans never look inside <!-- ... -->."""
    return re.sub(r"<!--.*?-->", "", html, flags=re.DOTALL)


_decode_errors = {}  # path -> error message, populated lazily by read()
_read_cache = {}


def read(path):
    """Read a repo-relative file as UTF-8 text.

    A file that fails to decode is recorded in _decode_errors (surfaced by its own check,
    see check_encoding) and read() returns "" for it instead of raising — so a single
    corrupt/binary/mis-encoded file degrades every other check gracefully (empty text means
    "no matches found", never a false PASS) rather than crashing the whole run with a
    traceback that looks like the checker itself is broken.
    """
    if path in _read_cache:
        return _read_cache[path]
    try:
        with open(os.path.join(ROOT, path), "r", encoding="utf-8") as fh:
            text = fh.read()
    except UnicodeDecodeError as e:
        _decode_errors[path] = str(e)
        text = ""
    _read_cache[path] = text
    return text


_ATTR_RE = re.compile(
    r'\b(href|src|srcset|poster)\s*=\s*"([^"]*)"', re.IGNORECASE
)


def extract_refs(html_no_comments):
    """Yield (attr_name, raw_value) pairs for href/src/srcset/poster attributes."""
    for m in _ATTR_RE.finditer(html_no_comments):
        yield m.group(1).lower(), m.group(2)


def split_srcset(value):
    """srcset="path 900w, path2 1800w" -> ["path", "path2"]"""
    parts = []
    for chunk in value.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        parts.append(chunk.split()[0])
    return parts


def is_skippable_url(url):
    url = url.strip()
    if not url:
        return True
    if url.startswith("#"):
        return True
    if url.startswith(VOID_HREF_SCHEMES):
        return True
    if url.startswith("//"):  # protocol-relative external
        return True
    return False


def resolve_local_path(page_path, url):
    """Resolve an href/src value relative to the page it appears on. Returns a repo-relative
    path (posix-style) or None if it's not a resolvable local file reference."""
    if is_skippable_url(url):
        return None
    # Strip fragment/query.
    split = urlsplit(url)
    path_part = split.path
    if not path_part:
        return None
    if path_part.startswith("/"):
        # Site-absolute path — resolve from repo root.
        candidate = path_part.lstrip("/")
    else:
        page_dir = os.path.dirname(page_path)
        candidate = os.path.normpath(os.path.join(page_dir, path_part))
    candidate = candidate.replace(os.sep, "/")
    return candidate


# ========================================================================================
# Check 0 — encoding (pre-flight; must run before anything else calls read())
# ========================================================================================

def check_encoding():
    """Every tracked HTML/CSS/JS file must be valid UTF-8. This runs first and eagerly
    reads everything so _decode_errors is fully populated before any other check — a file
    that fails here still gets treated as "" (empty) by every other check rather than
    crashing them, but it's reported once, clearly, right at the top."""
    text_files = [f for f in ALL_FILES if f.endswith((".html", ".css", ".js", ".xml", ".txt"))]
    for f in text_files:
        read(f)  # populates _decode_errors as a side effect
    ok = not _decode_errors
    if ok:
        detail = f"{len(text_files)} text files, all valid UTF-8"
    else:
        detail = "\n    ".join(f"{p}: {err}" for p, err in sorted(_decode_errors.items()))
    record("0. Encoding (UTF-8)", ok, detail)


# ========================================================================================
# Check 1 — link resolution
# ========================================================================================

def check_links():
    broken = []
    checked = 0
    for page in ALL_HTML:
        html = strip_comments(read(page))
        for attr, raw_value in extract_refs(html):
            values = split_srcset(raw_value) if attr == "srcset" else [raw_value]
            for val in values:
                resolved = resolve_local_path(page, val)
                if resolved is None:
                    continue
                checked += 1
                if resolved not in ALL_FILES_SET:
                    broken.append(f"{page}: {attr}=\"{val}\" -> missing {resolved}")
    ok = not broken
    detail = f"{checked} references checked" if ok else "\n    ".join(broken)
    record("1. Link resolution", ok, detail)


# ========================================================================================
# Check 2 — orphaned assets
# ========================================================================================

def check_orphans():
    asset_files = [f for f in ALL_FILES if f.startswith("assets/")]
    if not asset_files:
        record("2. Orphan assets", True, "no assets/ files tracked")
        return

    # Build a haystack of every HTML/CSS/JS file's raw text (comments intentionally NOT
    # stripped here — an asset referenced only from a commented-out snippet is still "in use"
    # for orphan purposes; that's a content-readiness signal, not a dead file. CV PDF is the
    # canonical example: it doesn't need to exist yet, but if it did, it wouldn't be an orphan
    # check false-positive because it's referenced by nothing at all right now).
    haystack_files = [f for f in ALL_FILES if f.endswith((".html", ".css", ".js"))]
    haystack = "\n".join(read(f) for f in haystack_files)

    orphans = []
    for asset in sorted(asset_files):
        basename = os.path.basename(asset)
        if basename in haystack:
            continue
        orphans.append(asset)

    ok = not orphans
    detail = f"{len(asset_files)} asset files checked" if ok else "\n    ".join(orphans)
    record("2. Orphan assets", ok, detail)


# ========================================================================================
# Check 3 — nav/menu/footer consistency
# ========================================================================================

_LINK_BLOCK_RE = {
    "nav": re.compile(r'<nav class="nav-links".*?</nav>', re.DOTALL),
    "menu": re.compile(r'<nav class="menu-links".*?</nav>', re.DOTALL),
    "footer": re.compile(r'<nav class="footer-links".*?</nav>', re.DOTALL),
}
_A_TAG_RE = re.compile(r"<a\b[^>]*>(.*?)</a>", re.DOTALL)
# The nav/menu markup prefixes each link with a purely-numeric order marker, e.g.
# <span class="nl-num">01</span>Disciplines or <em>01</em>Disciplines. Strip the whole
# element (tag + its digit-only text) before stripping remaining tags, so what's left is
# the human-legible label ("Disciplines"), not "01Disciplines".
_NUM_MARKER_RE = re.compile(r"<(span|em)\b[^>]*>\s*\d+\s*</\1>")
_TAG_STRIP_RE = re.compile(r"<[^>]+>")


def extract_labels(block_html):
    labels = []
    for m in _A_TAG_RE.finditer(block_html):
        text = _NUM_MARKER_RE.sub("", m.group(1))
        text = _TAG_STRIP_RE.sub("", text)
        text = re.sub(r"\s+", " ", text).strip()
        labels.append(text)
    return labels


EXPECTED_NAV = ["Disciplines", "Work", "Thoughts", "Kris"]
EXPECTED_MENU = EXPECTED_NAV + ["Book a call"]
EXPECTED_FOOTER = EXPECTED_NAV + ["Contact"]


def check_nav_consistency():
    problems = []
    for page in NAV_PAGES:
        html = strip_comments(read(page))
        for kind, rx, expected in (
            ("nav", _LINK_BLOCK_RE["nav"], EXPECTED_NAV),
            ("menu", _LINK_BLOCK_RE["menu"], EXPECTED_MENU),
            ("footer", _LINK_BLOCK_RE["footer"], EXPECTED_FOOTER),
        ):
            m = rx.search(html)
            if not m:
                problems.append(f"{page}: missing {kind} link block")
                continue
            labels = extract_labels(m.group(0))
            if labels != expected:
                problems.append(
                    f"{page}: {kind} labels {labels} != expected {expected}"
                )
    ok = not problems
    detail = f"{len(NAV_PAGES)} pages checked, sets identical" if ok else "\n    ".join(problems)
    record("3. Nav/menu/footer consistency", ok, detail)


# ========================================================================================
# Check 4 — head metadata
# ========================================================================================

_TITLE_RE = re.compile(r"<title>(.*?)</title>", re.DOTALL)
_META_DESC_RE = re.compile(
    r'<meta\s+name="description"\s+content="([^"]*)"', re.IGNORECASE
)
_OG_DESC_RE = re.compile(
    r'<meta\s+property="og:description"\s+content="([^"]*)"', re.IGNORECASE
)
_CANONICAL_RE = re.compile(
    r'<link\s+rel="canonical"\s+href="([^"]*)"', re.IGNORECASE
)

CANONICAL_HOST = "https://www.singhstudio.co.nz/"


def unescape_entities(s):
    return (
        s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
    )


def check_head_metadata():
    problems = []
    titles_seen = {}

    for page in INDEXABLE_PAGES:
        html = strip_comments(read(page))

        title_m = _TITLE_RE.search(html)
        if not title_m:
            problems.append(f"{page}: no <title>")
            title = None
        else:
            title = unescape_entities(title_m.group(1).strip())
            if title in titles_seen:
                problems.append(f"{page}: title duplicates {titles_seen[title]}: \"{title}\"")
            else:
                titles_seen[title] = page

        desc_m = _META_DESC_RE.search(html)
        if not desc_m:
            problems.append(f"{page}: no meta description")
            desc = None
        else:
            desc = unescape_entities(desc_m.group(1).strip())
            if len(desc) > 170:
                problems.append(f"{page}: meta description {len(desc)} chars > 170")
            if desc and desc[-1] not in ".?!":
                problems.append(f"{page}: meta description looks truncated (ends \"{desc[-12:]}\")")

        canon_m = _CANONICAL_RE.search(html)
        if not canon_m:
            problems.append(f"{page}: no canonical link")
        else:
            canon = canon_m.group(1).strip()
            expected = CANONICAL_HOST if page == "index.html" else CANONICAL_HOST + page
            if canon != expected:
                problems.append(f"{page}: canonical \"{canon}\" != expected \"{expected}\"")

        og_desc_m = _OG_DESC_RE.search(html)
        if not og_desc_m:
            problems.append(f"{page}: no og:description")
        elif desc is not None:
            og_desc = unescape_entities(og_desc_m.group(1).strip())
            if og_desc != desc:
                problems.append(f"{page}: og:description != meta description")

    ok = not problems
    detail = f"{len(INDEXABLE_PAGES)} indexable pages checked" if ok else "\n    ".join(problems)
    record("4. Head metadata", ok, detail)


# ========================================================================================
# Check 5 — feeds (sitemap.xml / feed.xml)
# ========================================================================================
#
# NB: deliberately hand-rolled instead of xml.etree.ElementTree. ElementTree's C accelerator
# (pyexpat) is a compiled stdlib extension, and on at least one dev machine seen during
# development, a Homebrew Python build had a pyexpat.so linked against a newer libexpat than
# the OS's /usr/lib/libexpat.1.dylib provides (ABI symbol missing at dlopen time) — meaning
# xml.etree.ElementTree, xml.dom.minidom AND xml.parsers.expat are all dead on that
# interpreter despite being "stdlib". That's an environment problem, not this repo's, but a
# QA script that only works on a subset of correctly-built Python 3 interpreters is a bad QA
# script. A small manual well-formedness pass (matched tags, no stray closes, self-closing
# tags handled) needs nothing but string/regex operations and still genuinely validates XML
# structure — not just "file exists".

_XML_TAG_RE = re.compile(r"<(/?)([a-zA-Z_][\w:.\-]*)([^>]*)>")


def xml_well_formed(text):
    """Minimal well-formedness check: matched open/close tags, correct nesting, no stray
    closers. Returns (ok, error_message_or_None). Skips <?...?> and <!...> declarations and
    self-closing tags (trailing '/>') and CDATA/comment sections."""
    # Strip things that aren't element tags: XML/PI declarations, comments, CDATA, DOCTYPE.
    cleaned = re.sub(r"<\?.*?\?>", "", text, flags=re.DOTALL)
    cleaned = re.sub(r"<!--.*?-->", "", cleaned, flags=re.DOTALL)
    cleaned = re.sub(r"<!\[CDATA\[.*?\]\]>", "", cleaned, flags=re.DOTALL)
    cleaned = re.sub(r"<!DOCTYPE.*?>", "", cleaned, flags=re.DOTALL)

    stack = []
    for m in _XML_TAG_RE.finditer(cleaned):
        closing, name, attrs = m.group(1), m.group(2), m.group(3)
        self_closing = attrs.rstrip().endswith("/")
        if closing:
            if not stack:
                return False, f"stray closing tag </{name}> with nothing open"
            if stack[-1] != name:
                return False, f"</{name}> does not match open <{stack[-1]}>"
            stack.pop()
        elif not self_closing:
            stack.append(name)
    if stack:
        return False, f"unclosed tags at EOF: {stack}"
    return True, None


def count_sitemap_urls(text):
    cleaned = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    # <url> may carry a namespace prefix (e.g. <sm:url>) — match either form, closing tag only
    # needed to count complete elements.
    return len(re.findall(r"<(?:\w+:)?url\b[^>]*>", cleaned))


def check_feeds():
    problems = []

    sitemap_path = "sitemap.xml"
    feed_path = "feed.xml"

    if sitemap_path not in ALL_FILES_SET:
        problems.append("sitemap.xml missing")
    else:
        text = read(sitemap_path)
        ok, err = xml_well_formed(text)
        if not ok:
            problems.append(f"sitemap.xml does not parse: {err}")
        else:
            count = count_sitemap_urls(text)
            if count != len(INDEXABLE_PAGES):
                problems.append(
                    f"sitemap.xml has {count} <url> entries, expected {len(INDEXABLE_PAGES)} "
                    f"(indexable page count)"
                )

    if feed_path not in ALL_FILES_SET:
        problems.append("feed.xml missing")
    else:
        ok, err = xml_well_formed(read(feed_path))
        if not ok:
            problems.append(f"feed.xml does not parse: {err}")

    ok = not problems
    detail = "sitemap.xml + feed.xml well-formed and sitemap count matches" if ok else "\n    ".join(problems)
    record("5. Feeds (sitemap/feed)", ok, detail)


# ========================================================================================
# Check 6 — tag balance
# ========================================================================================

# Standard HTML void elements — never require a closing tag.
VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}


class BalanceChecker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag in VOID_ELEMENTS:
            return
        self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        # Self-closed tag like <br/> or a custom self-closed element — don't push.
        pass

    def handle_endtag(self, tag):
        if tag in VOID_ELEMENTS:
            return
        if not self.stack:
            self.errors.append(f"unexpected closing </{tag}> with empty stack")
            return
        if self.stack[-1] == tag:
            self.stack.pop()
            return
        if tag in self.stack:
            # Pop down to the matching tag, recording what was skipped (likely a real bug
            # like an unclosed <span>) — but don't fail the whole file over it here; we
            # already record it as an error string below.
            skipped = []
            while self.stack and self.stack[-1] != tag:
                skipped.append(self.stack.pop())
            self.stack.pop()  # pop the matching tag itself
            self.errors.append(
                f"</{tag}> closed after unclosed {skipped} still open"
            )
        else:
            self.errors.append(f"</{tag}> has no matching open tag")

    def error(self, message):  # pragma: no cover - legacy HTMLParser hook
        self.errors.append(message)


def check_tag_balance():
    problems = []
    for page in ALL_HTML:
        html = read(page)
        parser = BalanceChecker()
        try:
            parser.feed(html)
            parser.close()
        except Exception as e:  # HTMLParser is lenient; this is a true parse failure
            problems.append(f"{page}: parser exception {e}")
            continue
        if parser.errors:
            for err in parser.errors:
                problems.append(f"{page}: {err}")
        if parser.stack:
            problems.append(f"{page}: unclosed tags at EOF: {parser.stack}")
    ok = not problems
    detail = f"{len(ALL_HTML)} HTML files checked, all balanced" if ok else "\n    ".join(problems)
    record("6. Tag balance", ok, detail)


# ========================================================================================
# Check 7 — node --check
# ========================================================================================

def check_js_syntax():
    node = shutil.which("node")
    js_files = sorted(f for f in ALL_FILES if f.startswith("js/") and f.endswith(".js"))
    if node is None:
        record("7. node --check", True, "WARNING: node not found on PATH — skipped")
        return
    if not js_files:
        record("7. node --check", True, "no js/*.js files tracked")
        return
    problems = []
    for f in js_files:
        proc = subprocess.run(
            [node, "--check", f], cwd=ROOT, capture_output=True, text=True
        )
        if proc.returncode != 0:
            problems.append(f"{f}: {proc.stderr.strip()}")
    ok = not problems
    detail = f"{len(js_files)} files: {', '.join(js_files)}" if ok else "\n    ".join(problems)
    record("7. node --check", ok, detail)


# ========================================================================================
# Runner
# ========================================================================================

def main():
    check_encoding()
    check_links()
    check_orphans()
    check_nav_consistency()
    check_head_metadata()
    check_feeds()
    check_tag_balance()
    check_js_syntax()

    name_w = max(len(name) for name, _, _ in results) + 2
    print("=" * (name_w + 10))
    print("SITE CHECK RESULTS")
    print("=" * (name_w + 10))
    all_ok = True
    for name, ok, detail in results:
        status = "PASS" if ok else "FAIL"
        if not ok:
            all_ok = False
        print(f"{name.ljust(name_w)}{status}")
        if not ok or detail.startswith("WARNING"):
            for line in detail.splitlines():
                print(f"    {line}")
    print("=" * (name_w + 10))
    print("ALL GREEN" if all_ok else "FAILURES ABOVE")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
