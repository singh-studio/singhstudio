"""Source registry with a hard licence gate.

Nothing enters the pipeline unless its source declares a licence the channel
can actually rely on:

  owned       - footage you recorded yourself (your PS5/Xbox capture, OBS).
  permission  - another creator's VODs you have WRITTEN permission to clip
                (a clipping-program agreement, an email, a contract).
                Requires `evidence:` pointing at that document and `credit:`.
  cc-by       - Creative Commons Attribution footage. Requires `credit:`.

There is deliberately no "grab whatever is trending" source. Re-uploading
other people's clips is copyright infringement, gets channels struck, and is
excluded from monetisation on YouTube (reused content) and TikTok (unoriginal
content) anyway - it can't make money even when it isn't taken down.
"""

from __future__ import annotations

import logging
import shutil
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path

import yaml

from clipper.config import Config
from clipper.db import DB

log = logging.getLogger(__name__)

ALLOWED_LICENSES = {"owned", "permission", "cc-by"}


class LicenseError(ValueError):
    pass


@dataclass
class Source:
    id: str
    kind: str  # watch_folder | url_list
    license: str
    credit: str = ""
    path: Path | None = None
    urls: list[str] = field(default_factory=list)
    evidence: Path | None = None


def validate_source(raw: dict, cfg: Config) -> Source:
    sid = str(raw.get("id") or "").strip()
    if not sid:
        raise LicenseError("source is missing an id")
    lic = str(raw.get("license") or "").strip().lower()
    if lic not in ALLOWED_LICENSES:
        raise LicenseError(f"source '{sid}': license must be one of {sorted(ALLOWED_LICENSES)}, got '{lic or 'none'}'")
    kind = raw.get("kind", "watch_folder")
    credit = str(raw.get("credit") or "").strip()
    evidence = Path(raw["evidence"]).expanduser() if raw.get("evidence") else None

    if lic in {"permission", "cc-by"} and not credit:
        raise LicenseError(f"source '{sid}': '{lic}' footage must set `credit:` (shown in every description)")
    if lic == "permission":
        if evidence is None:
            raise LicenseError(f"source '{sid}': 'permission' requires `evidence:` (path to the written agreement)")
        if not evidence.is_absolute():
            evidence = cfg.licenses / evidence
        if not evidence.exists():
            raise LicenseError(f"source '{sid}': evidence file not found: {evidence}")
    if kind == "url_list" and lic == "owned":
        # Your own uploads elsewhere are fine, but say so explicitly.
        if not raw.get("i_own_these_uploads"):
            raise LicenseError(f"source '{sid}': url_list + owned needs `i_own_these_uploads: true`")

    if kind == "watch_folder":
        path = Path(raw.get("path") or cfg.inbox).expanduser()
        return Source(sid, kind, lic, credit, path=path, evidence=evidence)
    if kind == "url_list":
        urls = [str(u) for u in raw.get("urls") or []]
        return Source(sid, kind, lic, credit, urls=urls, evidence=evidence,
                      path=cfg.inbox / "_downloads" / sid)
    raise LicenseError(f"source '{sid}': unknown kind '{kind}'")


def load_sources(cfg: Config) -> list[Source]:
    if not cfg.sources_file.exists():
        # Sensible default: your own capture folder only.
        return [Source("my-capture", "watch_folder", "owned", path=cfg.inbox)]
    raw = yaml.safe_load(cfg.sources_file.read_text()) or {}
    out = []
    for item in raw.get("sources", []):
        try:
            out.append(validate_source(item, cfg))
        except LicenseError as exc:
            log.error("REJECTED source: %s", exc)
    return out


def _is_stable(p: Path, stable_seconds: float) -> bool:
    try:
        return time.time() - p.stat().st_mtime >= stable_seconds and p.stat().st_size > 0
    except FileNotFoundError:
        return False


def scan_folder(src: Source, cfg: Config, db: DB) -> int:
    exts = {e.lower() for e in cfg["ingest"]["extensions"]}
    if not src.path or not src.path.exists():
        return 0
    added = 0
    for p in sorted(src.path.rglob("*")):
        if not p.is_file() or p.suffix.lower() not in exts or p.name.startswith("."):
            continue
        # Downloads for url_list sources are registered by their own source.
        if src.kind == "watch_folder" and "_downloads" in p.parts:
            continue
        if db.has_file(str(p)) or not _is_stable(p, cfg["ingest"]["stable_seconds"]):
            continue
        if db.add_file(str(p), src.id, src.license, src.credit):
            log.info("ingested %s [%s/%s]", p.name, src.id, src.license)
            added += 1
    return added


def fetch_urls(src: Source, cfg: Config, db: DB) -> int:
    """Download authorised VODs with yt-dlp (only ever for licence-gated sources)."""
    key = f"downloaded:{src.id}"
    done = set(db.get(key, []))
    todo = [u for u in src.urls if u not in done]
    if not todo:
        return 0
    ytdlp = shutil.which("yt-dlp")
    if not ytdlp:
        log.warning("source %s has URLs but yt-dlp is not installed (brew install yt-dlp)", src.id)
        return 0
    assert src.path is not None
    src.path.mkdir(parents=True, exist_ok=True)
    for url in todo:
        log.info("downloading authorised VOD for %s: %s", src.id, url)
        r = subprocess.run(
            [ytdlp, "-f", "bv*[height<=1080]+ba/b[height<=1080]", "--merge-output-format", "mp4",
             "--no-playlist", "-o", str(src.path / "%(id)s.%(ext)s"), url],
            capture_output=True, text=True,
        )
        if r.returncode == 0:
            done.add(url)
            db.set(key, sorted(done))
        else:
            log.error("download failed for %s: %s", url, r.stderr[-500:])
    return scan_folder(src, cfg, db)


def ingest_all(cfg: Config, db: DB, include_urls: bool = True) -> int:
    total = 0
    for src in load_sources(cfg):
        if src.kind == "watch_folder":
            total += scan_folder(src, cfg, db)
        elif include_urls:
            total += fetch_urls(src, cfg, db)
    return total
