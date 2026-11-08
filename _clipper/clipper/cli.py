"""clipper <command>

  init            create ~/Clipper with example config + sources
  run             run the service (what launchd starts)
  once            one ingest/process/plan/publish pass, then exit
  process FILE    detect + render one recording now (no posting)
  plan [--days N] preview the posting calendar the cadence would produce
  status          queue depth, upcoming slots, recent posts, heartbeat
  doctor          check ffmpeg, encoders, transcription, credentials, disk
  auth PLATFORM   one-time login for youtube | tiktok
"""

from __future__ import annotations

import argparse
import json
import logging
import shutil
import sys
from datetime import timedelta
from logging.handlers import RotatingFileHandler
from pathlib import Path
from zoneinfo import ZoneInfo

from clipper.config import DEFAULT_CONFIG_PATH, load_config

HERE = Path(__file__).resolve().parent.parent


def setup_logging(cfg, verbose: bool = False) -> None:
    cfg.logs.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s %(levelname)-7s %(threadName)s %(name)s: %(message)s")
    root = logging.getLogger()
    root.setLevel(logging.DEBUG if verbose else logging.INFO)
    fh = RotatingFileHandler(cfg.logs / "clipper.log", maxBytes=5_000_000, backupCount=5)
    fh.setFormatter(fmt)
    sh = logging.StreamHandler(sys.stderr)
    sh.setFormatter(fmt)
    root.handlers[:] = [fh, sh]
    for noisy in ("googleapiclient", "urllib3", "httpx", "anthropic"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def cmd_init(args) -> int:
    cfg = load_config(args.config)
    cfg.ensure_dirs()
    for name in ("config.example.yaml", "sources.example.yaml"):
        dst = cfg.root / name.replace(".example", "")
        if not dst.exists():
            shutil.copy(HERE / name, dst)
            print(f"created {dst}")
        else:
            print(f"kept existing {dst}")
    print(f"\nDrop recordings into {cfg.inbox} (point OBS/your capture app there).")
    return 0


def cmd_run(args) -> int:
    from clipper.daemon import Daemon
    cfg = load_config(args.config)
    setup_logging(cfg, args.verbose)
    Daemon(cfg).run()
    return 0


def cmd_once(args) -> int:
    from clipper.daemon import Daemon
    cfg = load_config(args.config)
    setup_logging(cfg, args.verbose)
    d = Daemon(cfg)
    d.worker_tick()
    d.poster_tick()
    return 0


def cmd_process(args) -> int:
    from clipper.db import DB
    from clipper.pipeline import process_file, process_pending
    cfg = load_config(args.config)
    setup_logging(cfg, args.verbose)
    cfg.ensure_dirs()
    if args.license != "owned" and not args.credit:
        raise SystemExit("--credit is required for footage you don't own")
    db = DB(cfg.db_path)
    path = str(Path(args.file).expanduser().resolve())
    fid = db.add_file(path, "manual", args.license, args.credit or "")
    if fid is None:
        fid = db.one("SELECT id FROM files WHERE path=?", (path,))["id"]
        db.execute("UPDATE files SET status='new' WHERE id=?", (fid,))
    process_file(cfg, db, fid)
    n = db.one("SELECT COUNT(*) AS n FROM clips WHERE file_id=? AND status='candidate'", (fid,))["n"]
    process_pending(cfg, db, max_files=0, max_renders=n)
    for r in db.all("SELECT id, start, end, score, title, render_path FROM clips WHERE file_id=? AND "
                    "status='rendered' ORDER BY start", (fid,)):
        print(f"#{r['id']:>4}  {r['start']:>7.1f}-{r['end']:<7.1f} score {r['score']:5.2f}  {r['title']}\n"
              f"       {r['render_path']}")
    return 0


def cmd_plan(args) -> int:
    from datetime import datetime
    from clipper.cadence import plan_day
    cfg = load_config(args.config)
    tz = cfg["audience_timezone"]
    today = datetime.now(ZoneInfo(tz)).date()
    platforms = [p for p, pc in cfg["schedule"]["platforms"].items() if pc.get("enabled")]
    print(f"Posting plan in audience time ({tz}); backlog assumed healthy.\n")
    for d in range(args.days):
        day = today + timedelta(days=d)
        print(day.strftime("%a %d %b"))
        for p in platforms:
            times = plan_day(p, day, cfg["schedule"]["platforms"][p], cfg["schedule"], tz)
            print(f"  {p:<10} {len(times)}  " + "  ".join(t.strftime("%H:%M") for t in times))
    return 0


def cmd_status(args) -> int:
    from clipper.db import DB
    from clipper.scheduler import backlog, enabled_platforms, to_local, upcoming
    cfg = load_config(args.config)
    db = DB(cfg.db_path)
    tz = cfg["audience_timezone"]
    mode = "DRY-RUN" if cfg["publish"].get("dry_run", True) else "LIVE"
    print(f"mode: {mode}   root: {cfg.root}")
    hb = cfg.state / "heartbeat.json"
    if hb.exists():
        print("heartbeat:", json.loads(hb.read_text()))
    for row in db.all("SELECT status, COUNT(*) AS n FROM files GROUP BY status"):
        print(f"files   {row['status']:<10} {row['n']}")
    for row in db.all("SELECT status, COUNT(*) AS n FROM clips GROUP BY status"):
        print(f"clips   {row['status']:<10} {row['n']}")
    for p in enabled_platforms(cfg):
        print(f"backlog {p:<10} {backlog(db, p)}")
    print("\nupcoming:")
    for s in upcoming(db, 12):
        print(f"  {to_local(s['due_at'], tz)}  {s['platform']}")
    print("\nrecent posts:")
    for r in db.all("SELECT p.platform, p.posted_at, p.url, p.remote_id, c.title FROM posts p "
                    "JOIN clips c ON c.id=p.clip_id ORDER BY p.posted_at DESC LIMIT 10"):
        print(f"  {to_local(r['posted_at'], tz)}  {r['platform']:<9} {r['title']}  {r['url'] or r['remote_id']}")
    return 0


def cmd_doctor(args) -> int:
    from clipper.media import available_encoders
    from clipper.publishers import get_publisher
    from clipper.sources import load_sources
    from clipper.transcribe import pick_engine
    cfg = load_config(args.config)
    ok = True

    def line(good: bool, label: str, detail: str = "") -> None:
        nonlocal ok
        ok &= good
        print(f"[{'ok' if good else '!!'}] {label}{(': ' + detail) if detail else ''}")

    line(DEFAULT_CONFIG_PATH.exists() or bool(args.config), "config", str(args.config or DEFAULT_CONFIG_PATH))
    line(bool(shutil.which("ffmpeg")), "ffmpeg", shutil.which("ffmpeg") or "brew install ffmpeg")
    enc = available_encoders()
    line("libx264" in enc or "h264_videotoolbox" in enc, "h264 encoder",
         "videotoolbox" if "h264_videotoolbox" in enc else "libx264")
    import subprocess
    filters = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout \
        if shutil.which("ffmpeg") else ""
    line(" ass " in filters, "libass (captions)", "" if " ass " in filters else "ffmpeg built without libass")
    eng = pick_engine(cfg["transcribe"]["engine"])
    print(f"[--] transcription engine: {eng}" + ("  (pip install 'clipper[whisper-mlx]')" if eng == "none" else ""))
    from clipper.copywriter import _api_key
    print(f"[--] copywriter: {'claude' if _api_key(cfg.secrets) else 'templates (no ANTHROPIC key)'}")
    srcs = load_sources(cfg)
    line(bool(srcs), "sources", ", ".join(f"{s.id}({s.license})" for s in srcs) or "none valid")
    if cfg.root.exists():
        free = shutil.disk_usage(cfg.root).free / 1e9
        line(free >= cfg["daemon"]["min_free_gb"], "disk", f"{free:.0f} GB free")
    for p, pc in cfg["schedule"]["platforms"].items():
        if pc.get("enabled"):
            good, why = get_publisher(p, cfg, force_real=True).check()
            line(good, f"{p} credentials", why)
    print("\nmode:", "DRY-RUN (set publish.dry_run: false to go live)" if cfg["publish"].get("dry_run", True) else "LIVE")
    return 0 if ok else 1


def cmd_auth(args) -> int:
    cfg = load_config(args.config)
    cfg.ensure_dirs()
    if args.platform == "youtube":
        from clipper.publishers.youtube import YouTubePublisher
        YouTubePublisher(cfg, cfg.secrets).auth()
    elif args.platform == "tiktok":
        from clipper.publishers.tiktok import TikTokPublisher
        TikTokPublisher(cfg, cfg.secrets).auth()
    else:
        print("Instagram: create a long-lived token in the Meta developer dashboard and save it to "
              f"{cfg.secrets / 'instagram_token.json'} as {{\"access_token\": \"...\"}}")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="clipper", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", help=f"config file (default {DEFAULT_CONFIG_PATH})")
    ap.add_argument("-v", "--verbose", action="store_true")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init").set_defaults(fn=cmd_init)
    sub.add_parser("run").set_defaults(fn=cmd_run)
    sub.add_parser("once").set_defaults(fn=cmd_once)
    p = sub.add_parser("process")
    p.add_argument("file")
    p.add_argument("--license", default="owned", choices=["owned", "permission", "cc-by"])
    p.add_argument("--credit")
    p.set_defaults(fn=cmd_process)
    p = sub.add_parser("plan")
    p.add_argument("--days", type=int, default=7)
    p.set_defaults(fn=cmd_plan)
    sub.add_parser("status").set_defaults(fn=cmd_status)
    sub.add_parser("doctor").set_defaults(fn=cmd_doctor)
    p = sub.add_parser("auth")
    p.add_argument("platform", choices=["youtube", "tiktok", "instagram"])
    p.set_defaults(fn=cmd_auth)
    args = ap.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    raise SystemExit(main())
