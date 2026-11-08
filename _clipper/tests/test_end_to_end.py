"""Synthetic 'gameplay' -> detect -> render -> plan -> dry-run publish."""

import json
import shutil
import subprocess
from datetime import timedelta

import pytest

from clipper.db import DB, iso, utcnow
from clipper.media import probe
from clipper.pipeline import process_file, process_pending
from clipper.scheduler import plan_ahead, publish_due

pytestmark = pytest.mark.skipif(not shutil.which("ffmpeg"), reason="ffmpeg required")


@pytest.fixture
def gameplay(tmp_path):
    out = tmp_path / "session.mp4"
    # 90 s of 720p test pattern; quiet noise with two loud 3 s "explosions" at 30 s and 65 s.
    expr = "0.02*(random(0)-0.5)+0.9*(random(1)-0.5)*(between(t,30,33)+between(t,65,68))"
    subprocess.run([
        "ffmpeg", "-v", "error", "-y",
        "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=90",
        "-f", "lavfi", "-i", f"aevalsrc='{expr}':s=48000:d=90",
        "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", "-shortest", str(out)], check=True)
    return out


def test_full_pipeline(cfg, gameplay):
    cfg["detect"]["clips_per_hour"] = 80  # ≈2 clips from 90 s
    cfg["detect"]["min_clip_s"] = 10
    db = DB(cfg.db_path)
    fid = db.add_file(str(gameplay), "my-capture", "owned")
    kept = process_file(cfg, db, fid)
    assert kept >= 1
    clips = db.all("SELECT * FROM clips WHERE file_id=? AND status='candidate'", (fid,))
    assert any(c["start"] <= 31 <= c["end"] or c["start"] <= 66 <= c["end"] for c in clips)

    stats = process_pending(cfg, db, max_files=0, max_renders=5)
    assert stats["renders"] == len(clips)
    rendered = db.all("SELECT * FROM clips WHERE status='rendered'")
    info = probe(rendered[0]["render_path"])
    assert (info["width"], info["height"]) == (1080, 1920)
    assert info["audio_tracks"] == 1
    assert abs(info["duration"] - (rendered[0]["end"] - rendered[0]["start"])) < 1.0
    assert rendered[0]["title"] and json.loads(rendered[0]["hashtags"])

    # Plan from "now", then jump to the first due slot and publish (dry-run).
    now = utcnow()
    assert plan_ahead(cfg, db, now=now) > 0
    first = db.one("SELECT * FROM slots ORDER BY due_at LIMIT 1")
    due = __import__("datetime").datetime.fromisoformat(first["due_at"]) + timedelta(seconds=5)
    assert publish_due(cfg, db, now=due) >= 1
    post = db.one("SELECT * FROM posts")
    assert post["dry_run"] == 1 and post["remote_id"].startswith("dry-")
    assert (cfg.state / "dry_run_posts.jsonl").exists()

    # A slot left far in the past (machine was off) is skipped, not dumped.
    db.execute("INSERT INTO slots(platform, plan_date, due_at) VALUES('youtube','2000-01-01',?)",
               (iso(due - timedelta(hours=6)),))
    publish_due(cfg, db, now=due)
    assert db.one("SELECT status FROM slots WHERE plan_date='2000-01-01'")["status"] == "skipped"
