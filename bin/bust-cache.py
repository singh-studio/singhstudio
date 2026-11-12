#!/usr/bin/env python3
"""Stamp css/style.css and js/main.js references with a content hash.

GitHub Pages lets browsers cache every file for 10 minutes, so after a
deploy a returning visitor can get the new HTML with the old script or
stylesheet. Run this before every push that changes either file:

    python3 bin/bust-cache.py
"""
import hashlib
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ["css/style.css", "js/main.js"]


def short_hash(rel):
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:10]


def main():
    stamps = {rel: short_hash(rel) for rel in ASSETS}
    files = subprocess.run(
        ["git", "ls-files", "*.html"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.split()
    changed = 0
    for f in files:
        path = ROOT / f
        text = path.read_text(encoding="utf-8")
        new = text
        for rel, h in stamps.items():
            new = re.sub(r'((?:\.\./)*' + re.escape(rel) + r')(\?v=[0-9a-f]+)?"', r'\1?v=' + h + '"', new)
        if new != text:
            path.write_text(new, encoding="utf-8")
            changed += 1
    print(f"stamped {changed} pages: " + ", ".join(f"{k}?v={v}" for k, v in stamps.items()))


if __name__ == "__main__":
    main()
