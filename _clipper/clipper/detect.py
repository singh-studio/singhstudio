"""Highlight detection: cheap signals over hours of footage, no GPU needed.

1. Loudness spikes relative to a rolling baseline (explosions, crashes,
   gunfire, you shouting) - robust z-score so quiet and loud sessions both work.
2. Sudden rises in loudness (the "oh-" moment right before the payoff).
3. Density of hard visual changes (chaos on screen, wasted screens, flashes).
4. Transcript keywords - applied later, only to the shortlisted windows, so
   speech-to-text never runs over hours of footage.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view


@dataclass
class Candidate:
    start: float
    end: float
    peak: float
    score: float
    features: dict = field(default_factory=dict)

    @property
    def duration(self) -> float:
        return self.end - self.start


def loudness_db(audio: np.ndarray, sr: int, window_s: float) -> np.ndarray:
    hop = max(1, int(sr * window_s))
    n = len(audio) // hop
    if n == 0:
        return np.zeros(0, dtype=np.float32)
    frames = audio[: n * hop].reshape(n, hop)
    rms = np.sqrt(np.mean(frames.astype(np.float64) ** 2, axis=1) + 1e-12)
    return (20 * np.log10(rms)).astype(np.float32)


def rolling_median(x: np.ndarray, size: int) -> np.ndarray:
    size = max(3, size | 1)
    if len(x) < size:
        return np.full_like(x, np.median(x) if len(x) else 0.0)
    pad = size // 2
    padded = np.pad(x, pad, mode="edge")
    return np.median(sliding_window_view(padded, size), axis=1).astype(np.float32)


def robust_z(x: np.ndarray, baseline: np.ndarray) -> np.ndarray:
    dev = x - baseline
    mad = np.median(np.abs(dev)) * 1.4826 + 1e-6
    return dev / max(mad, 1.0)  # floor of 1 dB keeps near-silent files from exploding


def smooth(x: np.ndarray, k: int = 3) -> np.ndarray:
    if len(x) < k:
        return x
    return np.convolve(x, np.ones(k) / k, mode="same")


def score_timeline(audio: np.ndarray, sr: int, duration: float, scene_times: list[float], cfg: dict) -> np.ndarray:
    w = cfg["window_s"]
    db = loudness_db(audio, sr, w)
    n = max(len(db), int(duration / w))
    if len(db) < n:
        db = np.pad(db, (0, n - len(db)), constant_values=db.min() if len(db) else -90)
    base = rolling_median(db, int(cfg["baseline_s"] / w))
    loud = np.clip(robust_z(db, base), -3, 8)
    rise = np.clip(np.diff(db, prepend=db[:1]) / 6.0, 0, 3)  # +6 dB in one window ≈ 1 point

    scene = np.zeros(n, dtype=np.float32)
    for t in scene_times:
        i = int(t / w)
        if 0 <= i < n:
            scene[i] += 1
    radius = max(1, int(2.0 / w))
    scene = np.convolve(scene, np.ones(2 * radius + 1), mode="same")
    scene = np.clip(scene / 3.0, 0, 2)

    # Near-silence (menus, loading screens, pause) can never be a highlight.
    silent = db < -50
    s = smooth(loud + 0.6 * rise + 0.5 * scene, 3)
    s[silent] = -5
    return s.astype(np.float32)


def pick_candidates(score: np.ndarray, duration: float, cfg: dict, limit: int) -> list[Candidate]:
    w = cfg["window_s"]
    min_len, max_len = cfg["min_clip_s"], cfg["max_clip_s"]
    pre, post = cfg["pre_roll_s"], cfg["post_roll_s"]
    thresh = cfg["min_score"]
    chosen: list[Candidate] = []
    order = np.argsort(score)[::-1]
    for i in order:
        if len(chosen) >= limit or score[i] < thresh:
            break
        peak = (i + 0.5) * w
        if any(c.start - 2 <= peak <= c.end + 2 for c in chosen):
            continue
        start = max(0.0, peak - pre)
        # Extend the tail while the action keeps going, up to max length.
        j = i
        tail_limit = min(len(score) - 1, int((start + max_len) / w))
        while j + 1 <= tail_limit and score[j + 1] > thresh * 0.5:
            j += 1
        end = min(duration, max(peak + post, (j + 0.5) * w + post * 0.5))
        if end - start < min_len:
            need = min_len - (end - start)
            start = max(0.0, start - need * 0.6)  # more setup, a little more payoff
            end = min(duration, start + min_len)
            start = max(0.0, min(start, end - min_len))
        if end - start > max_len:
            end = start + max_len
        if end - start < min_len * 0.8:
            continue
        if any(not (end + 1 < c.start or start - 1 > c.end) for c in chosen):
            continue
        a, b = int(start / w), max(int(start / w) + 1, int(end / w))
        seg = score[a:b]
        chosen.append(Candidate(
            start=round(start, 2), end=round(end, 2), peak=round(peak, 2),
            score=float(score[i]) + 0.25 * float(np.mean(seg)),
            features={"peak_score": round(float(score[i]), 2), "mean_score": round(float(np.mean(seg)), 2)},
        ))
    chosen.sort(key=lambda c: c.start)
    return chosen


def find_highlights(audio: np.ndarray, sr: int, duration: float, scene_times: list[float], cfg: dict) -> list[Candidate]:
    score = score_timeline(audio, sr, duration, scene_times, cfg)
    hours = max(duration / 3600.0, 1 / 12)
    limit = max(1, int(round(cfg["clips_per_hour"] * hours * cfg.get("oversample", 1.0))))
    return pick_candidates(score, duration, cfg, limit)


def keyword_bonus(text: str, keywords: list[str]) -> tuple[float, list[str]]:
    t = " " + text.lower() + " "
    hits = [k for k in keywords if f" {k} " in t or (len(k) > 4 and k in t)]
    return min(3.0, 0.8 * len(hits)), hits


def snap_to_words(start: float, end: float, words: list[tuple[float, float, str]]) -> tuple[float, float]:
    """Nudge cut points into gaps between words so speech is never chopped."""
    if not words:
        return start, end
    for ws, we, _ in words:
        if ws < start < we:
            start = ws - 0.15
        if ws < end < we:
            end = we + 0.2
    return max(0.0, start), end
