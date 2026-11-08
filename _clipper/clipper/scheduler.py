"""Turns the cadence plan into slots and fills each slot with the best ready clip."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from clipper.cadence import freshness_weight, plan_day
from clipper.config import Config
from clipper.db import DB, iso, parse_iso, utcnow
from clipper.notify import notify
from clipper.publishers import PostCopy, PublishError, get_publisher

log = logging.getLogger(__name__)


def enabled_platforms(cfg: Config) -> list[str]:
    return [p for p, pc in cfg["schedule"]["platforms"].items() if pc.get("enabled")]


def backlog(db: DB, platform: str) -> int:
    row = db.one("SELECT COUNT(*) AS n FROM clips c WHERE c.status='rendered' AND NOT EXISTS "
                 "(SELECT 1 FROM posts p WHERE p.clip_id=c.id AND p.platform=?)", (platform,))
    return int(row["n"])


def plan_ahead(cfg: Config, db: DB, now: datetime | None = None, days: int = 2) -> int:
    now = now or utcnow()
    tz = cfg["audience_timezone"]
    today = now.astimezone(ZoneInfo(tz)).date()
    created = 0
    for platform in enabled_platforms(cfg):
        pcfg = cfg["schedule"]["platforms"][platform]
        for d in range(days):
            day = today + timedelta(days=d)
            if db.one("SELECT 1 FROM plans WHERE platform=? AND plan_date=?", (platform, day.isoformat())):
                continue
            bl = backlog(db, platform)
            times = [t for t in plan_day(platform, day, pcfg, cfg["schedule"], tz, backlog=bl) if t > now]
            if not times and bl == 0:
                continue  # nothing to post yet; re-plan once clips exist
            with db.conn:
                for t in times:
                    db.conn.execute("INSERT OR IGNORE INTO slots(platform, plan_date, due_at) VALUES(?,?,?)",
                                    (platform, day.isoformat(), iso(t)))
                db.conn.execute("INSERT INTO plans(platform, plan_date) VALUES(?,?)", (platform, day.isoformat()))
            created += len(times)
            log.info("planned %d %s posts for %s: %s", len(times), platform, day,
                     ", ".join(t.strftime("%H:%M") for t in times))
    return created


def pick_clip(cfg: Config, db: DB, platform: str, now: datetime):
    gap = timedelta(minutes=int(cfg["schedule"].get("cross_post_min_gap_minutes", 0)))
    half_life = float(cfg["schedule"].get("freshness_half_life_days", 4))
    rows = db.all("SELECT c.* FROM clips c WHERE c.status='rendered' AND NOT EXISTS "
                  "(SELECT 1 FROM posts p WHERE p.clip_id=c.id AND p.platform=?)", (platform,))
    best, best_score = None, float("-inf")
    for r in rows:
        if not r["render_path"] or not Path(r["render_path"]).exists():
            continue
        last = db.one("SELECT MAX(posted_at) AS t FROM posts WHERE clip_id=?", (r["id"],))["t"]
        if last and now - parse_iso(last) < gap:
            continue
        age = (now - parse_iso(r["rendered_at"] or r["created_at"])).total_seconds() / 86400
        s = (r["score"] + 5) * freshness_weight(age, half_life)
        if s > best_score:
            best, best_score = r, s
    return best


def publish_due(cfg: Config, db: DB, now: datetime | None = None) -> int:
    now = now or utcnow()
    tolerance = timedelta(minutes=int(cfg["schedule"].get("late_tolerance_minutes", 90)))
    max_attempts = int(cfg["publish"].get("max_attempts", 3))
    done = 0
    for platform in enabled_platforms(cfg):
        slot = db.one("SELECT * FROM slots WHERE platform=? AND status='planned' AND due_at<=? "
                      "AND (next_try_at IS NULL OR next_try_at<=?) ORDER BY due_at LIMIT 1",
                      (platform, iso(now), iso(now)))
        if not slot:
            continue
        due = parse_iso(slot["due_at"])
        if slot["attempts"] == 0 and now - due > tolerance:
            db.execute("UPDATE slots SET status='skipped', note='missed (machine offline?)' WHERE id=?",
                       (slot["id"],))
            log.warning("skipped stale %s slot due %s", platform, slot["due_at"])
            continue
        clip = db.one("SELECT * FROM clips WHERE id=?", (slot["clip_id"],)) if slot["clip_id"] else None
        clip = clip or pick_clip(cfg, db, platform, now)
        if not clip:
            db.execute("UPDATE slots SET status='skipped', note='no ready clip' WHERE id=?", (slot["id"],))
            log.warning("no ready clip for %s slot %s", platform, slot["due_at"])
            continue
        db.execute("UPDATE slots SET clip_id=?, attempts=attempts+1 WHERE id=?", (clip["id"], slot["id"]))
        pub = get_publisher(platform, cfg)
        copy = PostCopy(clip["title"] or "", clip["description"] or "", json.loads(clip["hashtags"] or "[]"))
        try:
            res = pub.publish(Path(clip["render_path"]), copy)
        except PublishError as exc:
            attempts = slot["attempts"] + 1
            if exc.retryable and attempts < max_attempts:
                nxt = now + timedelta(minutes=10 * 2 ** (attempts - 1))
                db.execute("UPDATE slots SET next_try_at=?, note=? WHERE id=?",
                           (iso(nxt), str(exc)[:500], slot["id"]))
                log.warning("%s publish failed (retry at %s): %s", platform, nxt, exc)
            else:
                db.execute("UPDATE slots SET status='failed', note=? WHERE id=?", (str(exc)[:500], slot["id"]))
                log.error("%s publish failed permanently: %s", platform, exc)
                notify(cfg, f"{platform} post failed", str(exc)[:300], priority="high")
            continue
        except Exception as exc:
            log.exception("%s publisher crashed", platform)
            db.execute("UPDATE slots SET next_try_at=?, note=? WHERE id=?",
                       (iso(now + timedelta(minutes=15)), str(exc)[:500], slot["id"]))
            continue
        with db.conn:
            db.conn.execute("INSERT OR IGNORE INTO posts(clip_id, platform, remote_id, url, dry_run, posted_at) "
                            "VALUES(?,?,?,?,?,?)",
                            (clip["id"], platform, res.remote_id, res.url,
                             int(bool(cfg["publish"].get("dry_run", True))), iso(now)))
            db.conn.execute("UPDATE slots SET status='posted', note=? WHERE id=?", (res.url or res.remote_id, slot["id"]))
        log.info("posted clip %d to %s (%s)", clip["id"], platform, res.url or res.remote_id)
        done += 1
    return done


def upcoming(db: DB, limit: int = 20) -> list:
    return db.all("SELECT platform, due_at, status FROM slots WHERE status='planned' ORDER BY due_at LIMIT ?",
                  (limit,))


def to_local(s: str, tz: str) -> str:
    return datetime.fromisoformat(s).astimezone(ZoneInfo(tz)).strftime("%a %d %b %H:%M")
