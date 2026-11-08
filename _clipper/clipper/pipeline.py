"""Processing stages: detect -> transcribe/rerank -> copy -> render."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from clipper import media
from clipper.config import Config
from clipper.copywriter import write_copy
from clipper.db import DB, iso, utcnow
from clipper.detect import find_highlights, keyword_bonus, snap_to_words
from clipper.render import render_clip
from clipper.transcribe import pick_engine, transcribe

log = logging.getLogger(__name__)


def _detect_track(cfg: Config, n_tracks: int) -> int:
    t = cfg["audio"].get("detect_track")
    if t is None:
        t = (cfg["audio"].get("tracks") or [0])[0]
    return min(int(t), max(0, n_tracks - 1))


def _mix_tracks(cfg: Config, n_tracks: int) -> list[int]:
    tracks = [int(t) for t in cfg["audio"].get("tracks") or [0] if int(t) < n_tracks]
    return tracks or [0]


def process_file(cfg: Config, db: DB, file_id: int) -> int:
    """Find and shortlist highlights in one recording. Returns clips kept."""
    row = db.one("SELECT * FROM files WHERE id=?", (file_id,))
    path = row["path"]
    log.info("detecting highlights in %s", Path(path).name)
    info = media.probe(path)
    if info["duration"] < cfg["detect"]["min_clip_s"]:
        db.execute("UPDATE files SET status='detected', duration=?, processed_at=? WHERE id=?",
                   (info["duration"], iso(utcnow()), file_id))
        return 0
    dcfg = cfg["detect"]
    sr = 16000
    if info["audio_tracks"]:
        audio = media.load_audio(path, _detect_track(cfg, info["audio_tracks"]), sr)
    else:
        import numpy as np
        audio = np.zeros(int(info["duration"] * sr), dtype="float32")
    scenes = media.scene_changes(path, dcfg["scene_threshold"])
    cands = find_highlights(audio, sr, info["duration"], scenes, dcfg)

    engine = pick_engine(cfg["transcribe"]["engine"]) if info["audio_tracks"] else "none"
    track = _detect_track(cfg, info["audio_tracks"]) if info["audio_tracks"] else 0
    scored = []
    for c in cands:
        words_rel: list = []
        text = ""
        if engine != "none":
            pad = 1.5
            a = max(0.0, c.start - pad)
            wav = cfg.work / f"f{file_id}_{int(c.start * 100)}.wav"
            try:
                media.extract_wav(path, wav, a, c.duration + 2 * pad, track)
                text, words = transcribe(wav, cfg["transcribe"])
            finally:
                wav.unlink(missing_ok=True)
            words_abs = [(ws + a, we + a, w) for ws, we, w in words]
            c.start, c.end = snap_to_words(c.start, c.end, words_abs)
            c.end = min(c.end, info["duration"])
            words_rel = [(round(ws - c.start, 2), round(we - c.start, 2), w)
                         for ws, we, w in words_abs if ws >= c.start - 0.05 and we <= c.end + 0.05]
            text = " ".join(w for _, _, w in words_rel)
        bonus, hits = keyword_bonus(text, dcfg["keywords"])
        c.score += bonus
        c.features.update({"keywords": hits, "speech_words": len(words_rel)})
        scored.append((c, text, words_rel))

    hours = max(info["duration"] / 3600.0, 1 / 12)
    keep_n = max(1, int(round(dcfg["clips_per_hour"] * hours)))
    scored.sort(key=lambda x: x[0].score, reverse=True)
    now = iso(utcnow())
    with db.conn:
        for i, (c, text, words) in enumerate(scored):
            status = "candidate" if i < keep_n else "rejected"
            feats = {**c.features, "words": words, "peak": c.peak}
            db.conn.execute(
                "INSERT INTO clips(file_id, start, end, score, features, transcript, status, created_at)"
                " VALUES(?,?,?,?,?,?,?,?)",
                (file_id, c.start, c.end, round(c.score, 3), json.dumps(feats), text, status, now))
        db.conn.execute("UPDATE files SET status='detected', duration=?, processed_at=? WHERE id=?",
                        (info["duration"], now, file_id))
    kept = min(keep_n, len(scored))
    log.info("%s: %d candidates, kept %d", Path(path).name, len(scored), kept)
    return kept


def render_one(cfg: Config, db: DB, clip_id: int) -> Path | None:
    clip = db.one("SELECT c.*, f.path AS src, f.credit AS credit, f.license AS license FROM clips c "
                  "JOIN files f ON f.id=c.file_id WHERE c.id=?", (clip_id,))
    feats = json.loads(clip["features"] or "{}")
    words = [tuple(w) for w in feats.pop("words", [])]
    recent = [r["title"] for r in db.all("SELECT title FROM clips WHERE title IS NOT NULL "
                                         "ORDER BY id DESC LIMIT 20")]
    signals = {k: v for k, v in feats.items() if k != "peak"}
    signals["duration_s"] = round(clip["end"] - clip["start"], 1)
    copy = write_copy(signals, clip["transcript"] or "", recent, cfg["copy"], cfg.secrets)

    if cfg["copy"].get("provider") == "anthropic" and copy.virality <= 2:
        db.execute("UPDATE clips SET status='rejected', error='low virality' WHERE id=?", (clip_id,))
        log.info("clip %d rejected by copywriter (virality %d)", clip_id, copy.virality)
        return None

    description = copy.description
    if clip["license"] != "owned" and clip["credit"]:
        description += f"\n\nFootage: {clip['credit']} (used with permission)" \
            if clip["license"] == "permission" else f"\n\nFootage: {clip['credit']} (CC BY)"

    info = media.probe(clip["src"])
    out = cfg.renders / f"clip_{clip_id:06d}.mp4"
    render_clip(clip["src"], out, clip["start"], clip["end"], words, copy.hook, cfg["render"],
                _mix_tracks(cfg, info["audio_tracks"]), cfg.work, cfg.fonts,
                has_audio=info["audio_tracks"] > 0)
    score = clip["score"] + (copy.virality - 5) * 0.5
    db.execute("UPDATE clips SET status='rendered', render_path=?, hook=?, title=?, description=?, "
               "hashtags=?, score=?, rendered_at=?, error=NULL WHERE id=?",
               (str(out), copy.hook, copy.title, description, json.dumps(copy.hashtags), round(score, 3),
                iso(utcnow()), clip_id))
    log.info("rendered clip %d: %s", clip_id, copy.title)
    return out


def process_pending(cfg: Config, db: DB, max_files: int = 1, max_renders: int = 2) -> dict:
    stats = {"files": 0, "renders": 0}
    for row in db.all("SELECT id FROM files WHERE status='new' ORDER BY id LIMIT ?", (max_files,)):
        try:
            process_file(cfg, db, row["id"])
            stats["files"] += 1
        except Exception as exc:
            log.exception("detect failed for file %d", row["id"])
            db.execute("UPDATE files SET status='failed', error=? WHERE id=?", (str(exc)[:1000], row["id"]))
    for row in db.all("SELECT id FROM clips WHERE status='candidate' ORDER BY created_at DESC, score DESC "
                      "LIMIT ?", (max_renders,)):
        try:
            if render_one(cfg, db, row["id"]):
                stats["renders"] += 1
        except Exception as exc:
            log.exception("render failed for clip %d", row["id"])
            db.execute("UPDATE clips SET status='failed', error=? WHERE id=?", (str(exc)[:1000], row["id"]))
    return stats
