"""Configuration: YAML file deep-merged over safe defaults.

Everything lives under one root folder (default ~/Clipper) so the Mac mini
never needs Full Disk Access for ~/Movies or ~/Documents.
"""

from __future__ import annotations

import copy
import os
from pathlib import Path
from typing import Any

import yaml

DEFAULT_CONFIG_PATH = Path(os.environ.get("CLIPPER_CONFIG", "~/Clipper/config.yaml")).expanduser()

DEFAULTS: dict[str, Any] = {
    "paths": {"root": "~/Clipper"},
    # Posting times are planned in your AUDIENCE's timezone, not the Mac's.
    "audience_timezone": "America/New_York",
    "ingest": {
        "extensions": [".mp4", ".mov", ".mkv"],
        # A recording is only picked up once it has stopped growing this long
        # (OBS / capture software still writing).
        "stable_seconds": 120,
        "url_poll_hours": 6,
        "delete_source_after_days": 14,
        "delete_render_after_days": 30,
    },
    "audio": {
        # Audio tracks (0-based) mixed into the final clip. With OBS multi-track
        # recording put game on track 0 and your mic on track 1 -> [0, 1].
        "tracks": [0],
        # Track used for highlight detection. Your mic is usually the best
        # signal ("NO WAY"); falls back to the first of `tracks`.
        "detect_track": None,
    },
    "detect": {
        "window_s": 0.5,
        "baseline_s": 60,
        "min_clip_s": 14,
        "max_clip_s": 45,
        "pre_roll_s": 7,
        "post_roll_s": 4,
        "min_score": 2.0,
        "clips_per_hour": 8,
        # Candidates over-sampled before transcript re-ranking.
        "oversample": 2.0,
        "scene_threshold": 0.35,
        "keywords": [
            "no way", "oh my god", "omg", "let's go", "lets go", "bro", "what the",
            "wtf", "insane", "crazy", "run", "go go go", "holy", "nah", "clip that",
            "did you see", "wait", "look at", "cops", "wanted", "five stars",
        ],
    },
    "transcribe": {
        "engine": "auto",  # auto | mlx | faster | none
        "model": "small.en",
        "language": "en",
    },
    "render": {
        "width": 1080,
        "height": 1920,
        "fps": 60,
        "layout": "blur_fill",  # blur_fill | crop
        "fg_zoom": 1.3,
        "encoder": "auto",  # auto | videotoolbox | libx264
        "video_bitrate": "12M",
        "crf": 20,
        "audio_bitrate": "192k",
        "loudness_lufs": -14,
        "captions": True,
        "caption_words": 3,
        "caption_font": "Arial Black",
        "caption_size": 84,
        "hook_seconds": 2.8,
        "hook_size": 92,
        "watermark": "",
    },
    "copy": {
        "provider": "anthropic",  # anthropic | template
        "model": "claude-opus-5-5",
        "effort": "low",
        "game": "GTA VI",
        "channel_voice": "Hyped but genuine. Short punchy hooks. Never claims to be official or affiliated with Rockstar.",
        "default_hashtags": ["#GTA6", "#GTAVI", "#gaming"],
        "max_hashtags": 5,
    },
    "schedule": {
        "platforms": {
            "youtube": {"enabled": True, "per_day": [3, 5], "max_per_day": 6},
            "tiktok": {"enabled": True, "per_day": [3, 6], "max_per_day": 10},
            "instagram": {"enabled": False, "per_day": [1, 3], "max_per_day": 5},
        },
        # Audience-local posting windows; weight = relative share of posts.
        "windows": [
            {"start": "07:15", "end": "09:30", "weight": 1},
            {"start": "11:30", "end": "14:00", "weight": 2},
            {"start": "16:30", "end": "23:15", "weight": 5},
        ],
        "min_gap_minutes": 70,
        "light_day_chance": 0.12,
        "weekend_multiplier": 1.15,
        # Keep posting this many days on the current backlog instead of
        # burning it and going silent.
        "runway_days": 3,
        # The same clip never lands on two platforms closer together than this.
        "cross_post_min_gap_minutes": 45,
        # If the Mac was off, overdue slots older than this are skipped rather
        # than dumped all at once.
        "late_tolerance_minutes": 90,
        "freshness_half_life_days": 4,
        "surge": {"start": "2026-11-19", "days": 21, "multiplier": 1.4},
    },
    "publish": {
        "dry_run": True,
        "max_attempts": 3,
        "youtube": {"privacy": "public", "category_id": "20"},
        "tiktok": {
            "mode": "direct",  # direct (needs audited app) | inbox (lands as a draft in the TikTok app)
            "privacy_level": "PUBLIC_TO_EVERYONE",
            "redirect_uri": "",
        },
        "instagram": {"graph_host": "graph.facebook.com", "api_version": "v21.0", "ig_user_id": ""},
    },
    "notify": {"ntfy_server": "https://ntfy.sh", "ntfy_topic": "", "daily_digest_hour": 9},
    "daemon": {"tick_seconds": 60, "nice": 10, "min_free_gb": 25},
}


def deep_merge(base: dict, override: dict) -> dict:
    out = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = value
    return out


class Config(dict):
    """A dict with resolved path helpers."""

    @property
    def root(self) -> Path:
        return Path(self["paths"]["root"]).expanduser()

    def path(self, name: str) -> Path:
        return self.root / name

    @property
    def inbox(self) -> Path:
        return self.path("inbox")

    @property
    def work(self) -> Path:
        return self.path("work")

    @property
    def renders(self) -> Path:
        return self.path("renders")

    @property
    def state(self) -> Path:
        return self.path("state")

    @property
    def logs(self) -> Path:
        return self.path("logs")

    @property
    def secrets(self) -> Path:
        return self.path("secrets")

    @property
    def licenses(self) -> Path:
        return self.path("licenses")

    @property
    def fonts(self) -> Path:
        return self.path("fonts")

    @property
    def sources_file(self) -> Path:
        return self.root / "sources.yaml"

    @property
    def db_path(self) -> Path:
        return self.state / "clipper.db"

    def ensure_dirs(self) -> None:
        for p in (self.inbox, self.work, self.renders, self.state, self.logs,
                  self.secrets, self.licenses, self.fonts):
            p.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(self.secrets, 0o700)
        except OSError:
            pass


def load_config(path: str | Path | None = None, overrides: dict | None = None) -> Config:
    cfg_path = Path(path).expanduser() if path else DEFAULT_CONFIG_PATH
    data: dict = {}
    if cfg_path.exists():
        data = yaml.safe_load(cfg_path.read_text()) or {}
    merged = deep_merge(DEFAULTS, data)
    if overrides:
        merged = deep_merge(merged, overrides)
    return Config(merged)
