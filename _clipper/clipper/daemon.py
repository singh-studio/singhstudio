"""Long-running service: a worker thread (ingest/detect/render) and a poster
thread (plan/publish), so a 5-minute render never makes a post late.

launchd restarts the process if it ever exits; every stage is resumable from
SQLite, and a file lock guarantees a single instance.
"""

from __future__ import annotations

import fcntl
import json
import logging
import os
import shutil
import signal
import threading
import time
from datetime import datetime, timedelta

from clipper.config import Config
from clipper.db import DB, iso, parse_iso, utcnow
from clipper.notify import notify
from clipper.pipeline import process_pending
from clipper.scheduler import backlog, enabled_platforms, plan_ahead, publish_due
from clipper.sources import ingest_all

log = logging.getLogger(__name__)


class Daemon:
    def __init__(self, cfg: Config):
        self.cfg = cfg
        cfg.ensure_dirs()
        self.db = DB(cfg.db_path)
        self.stop = threading.Event()
        self.heartbeat: dict[str, str] = {}
        self._last_alert: dict[str, float] = {}

    # -- helpers ---------------------------------------------------------
    def _beat(self, name: str) -> None:
        self.heartbeat[name] = iso(utcnow())
        try:
            (self.cfg.state / "heartbeat.json").write_text(json.dumps({**self.heartbeat, "pid": os.getpid()}))
        except OSError:
            pass

    def _alert(self, key: str, title: str, msg: str, every_s: int = 6 * 3600) -> None:
        if time.time() - self._last_alert.get(key, 0) >= every_s:
            self._last_alert[key] = time.time()
            notify(self.cfg, title, msg, priority="high")

    def disk_ok(self) -> bool:
        free_gb = shutil.disk_usage(self.cfg.root).free / 1e9
        if free_gb < float(self.cfg["daemon"]["min_free_gb"]):
            log.warning("low disk: %.1f GB free; pausing ingest/render", free_gb)
            self._alert("disk", "Clipper paused: low disk", f"{free_gb:.1f} GB free on the Mac mini")
            return False
        return True

    # -- loops -----------------------------------------------------------
    def worker_tick(self) -> None:
        if not self.disk_ok():
            return
        poll_h = float(self.cfg["ingest"].get("url_poll_hours", 6))
        last = self.db.get("last_url_poll")
        include_urls = not last or utcnow() - parse_iso(last) > timedelta(hours=poll_h)
        ingest_all(self.cfg, self.db, include_urls=include_urls)
        if include_urls:
            self.db.set("last_url_poll", iso(utcnow()))
        process_pending(self.cfg, self.db, max_files=1, max_renders=2)
        self.housekeeping()

    def poster_tick(self) -> None:
        plan_ahead(self.cfg, self.db)
        publish_due(self.cfg, self.db)
        self.digest()
        for p in enabled_platforms(self.cfg):
            if backlog(self.db, p) == 0 and self.db.one("SELECT 1 FROM posts LIMIT 1"):
                self._alert(f"empty:{p}", "Clipper backlog empty",
                            f"No rendered clips left for {p}. Record more gameplay into the inbox.", 12 * 3600)

    def housekeeping(self) -> None:
        today = datetime.now().date().isoformat()
        if self.db.get("housekeeping_day") == today:
            return
        self.db.set("housekeeping_day", today)
        icfg = self.cfg["ingest"]
        platforms = enabled_platforms(self.cfg)
        render_days = icfg.get("delete_render_after_days")
        if render_days:
            cutoff = iso(utcnow() - timedelta(days=int(render_days)))
            for r in self.db.all("SELECT id, render_path FROM clips WHERE status='rendered' AND rendered_at<?",
                                 (cutoff,)):
                posted = {x["platform"] for x in self.db.all("SELECT platform FROM posts WHERE clip_id=?", (r["id"],))}
                if set(platforms) <= posted and r["render_path"]:
                    try:
                        os.remove(r["render_path"])
                    except FileNotFoundError:
                        pass
                    self.db.execute("UPDATE clips SET status='deleted' WHERE id=?", (r["id"],))
        src_days = icfg.get("delete_source_after_days")
        if src_days:
            cutoff = iso(utcnow() - timedelta(days=int(src_days)))
            for f in self.db.all("SELECT id, path FROM files WHERE status IN ('detected','failed') AND processed_at<?",
                                 (cutoff,)):
                pending = self.db.one("SELECT 1 FROM clips WHERE file_id=? AND status='candidate'", (f["id"],))
                if pending:
                    continue
                try:
                    os.remove(f["path"])
                except FileNotFoundError:
                    pass
                self.db.execute("UPDATE files SET status='deleted' WHERE id=?", (f["id"],))
                log.info("deleted processed source %s", f["path"])

    def digest(self) -> None:
        now = datetime.now()
        if now.hour != int(self.cfg["notify"].get("daily_digest_hour", 9)):
            return
        if self.db.get("digest_day") == now.date().isoformat():
            return
        self.db.set("digest_day", now.date().isoformat())
        since = iso(utcnow() - timedelta(days=1))
        lines = []
        for p in enabled_platforms(self.cfg):
            n = self.db.one("SELECT COUNT(*) AS n FROM posts WHERE platform=? AND posted_at>=?", (p, since))["n"]
            lines.append(f"{p}: {n} posted, {backlog(self.db, p)} in backlog")
        failed = self.db.one("SELECT COUNT(*) AS n FROM slots WHERE status='failed' AND due_at>=?", (since,))["n"]
        free_gb = shutil.disk_usage(self.cfg.root).free / 1e9
        lines.append(f"failed slots: {failed} · disk free: {free_gb:.0f} GB")
        notify(self.cfg, "Clipper daily digest", "\n".join(lines))

    def _loop(self, name: str, fn, every: float) -> None:
        while not self.stop.is_set():
            started = time.time()
            try:
                fn()
            except Exception as exc:
                log.exception("%s tick failed", name)
                self._alert(f"crash:{name}", f"Clipper {name} error", str(exc)[:300], every_s=3600)
            self._beat(name)
            self.stop.wait(max(1.0, every - (time.time() - started)))

    def run(self) -> None:
        lock = open(self.cfg.state / "clipper.lock", "w")
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit("another clipper instance is already running")
        try:
            os.nice(int(self.cfg["daemon"].get("nice", 10)))
        except OSError:
            pass

        def _stop(*_):
            log.info("shutdown requested")
            self.stop.set()
        signal.signal(signal.SIGTERM, _stop)
        signal.signal(signal.SIGINT, _stop)

        tick = float(self.cfg["daemon"]["tick_seconds"])
        mode = "DRY-RUN" if self.cfg["publish"].get("dry_run", True) else "LIVE"
        log.info("clipper started (%s) root=%s platforms=%s", mode, self.cfg.root, enabled_platforms(self.cfg))
        threads = [
            threading.Thread(target=self._loop, args=("worker", self.worker_tick, tick), daemon=True),
            threading.Thread(target=self._loop, args=("poster", self.poster_tick, min(30.0, tick)), daemon=True),
        ]
        for t in threads:
            t.start()
        while not self.stop.is_set():
            self.stop.wait(5)
        for t in threads:
            t.join(timeout=60)
        log.info("clipper stopped")
