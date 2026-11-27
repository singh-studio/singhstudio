#!/usr/bin/env python3
"""Rebuild sitemap.xml from the .html files in the repo.

Skips _planning, bin, node_modules, _incoming, demo folders, 404 pages and any
page containing noindex. lastmod is the file's last git commit date, or today's
date when the file has uncommitted changes (or no commit yet).
"""
import datetime
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.singhstudio.co.nz"
SKIP_DIRS = {"_planning", "bin", "node_modules", "_incoming", ".git"}
TODAY = datetime.date.today().isoformat()


def git(*args):
    return subprocess.run(["git", "-C", ROOT, *args], capture_output=True, text=True).stdout.strip()


dirty = set()
for line in git("status", "--porcelain", "--untracked-files=all").splitlines():
    dirty.add(line[3:].strip().strip('"'))

pages = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and d != "demo"]
    for fn in filenames:
        if not fn.endswith(".html") or fn == "404.html":
            continue
        full = os.path.join(dirpath, fn)
        rel = os.path.relpath(full, ROOT).replace(os.sep, "/")
        with open(full, encoding="utf-8", errors="replace") as fh:
            if "noindex" in fh.read():
                continue
        if fn == "index.html":
            d = os.path.dirname(rel)
            url = BASE + "/" + (d + "/" if d else "")
        else:
            url = BASE + "/" + rel
        if rel in dirty:
            lastmod = TODAY
        else:
            lastmod = git("log", "-1", "--format=%cs", "--", rel) or TODAY
        pages.append((url, lastmod))

pages.sort(key=lambda p: (p[0] != BASE + "/", p[0]))
out = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for url, lastmod in pages:
    out.append(f"  <url><loc>{url}</loc><lastmod>{lastmod}</lastmod></url>")
out.append("</urlset>")
with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as fh:
    fh.write("\n".join(out) + "\n")
print(f"sitemap.xml: {len(pages)} URLs")
