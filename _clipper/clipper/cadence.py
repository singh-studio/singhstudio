"""Posting cadence: a consistent, human-shaped daily rhythm.

What a hard-working creator's calendar actually looks like, and what this
planner reproduces:
  - posts every day, but the count varies (3 one day, 5 the next);
  - most posts land in the evening when the audience is free, some at lunch,
    a few in the morning;
  - times are never on the hour, and never closer together than ~an hour;
  - weekends run a bit hotter; the odd day is lighter;
  - launch weeks get a surge;
  - when the backlog is thin it slows down instead of going silent.

Plans are deterministic per (platform, date) so a restart never re-rolls them.
"""

from __future__ import annotations

import hashlib
import math
import random
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo


def _rng(platform: str, day: date, salt: str = "") -> random.Random:
    h = hashlib.sha256(f"{platform}|{day.isoformat()}|{salt}".encode()).hexdigest()
    return random.Random(int(h[:16], 16))


def _minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _stochastic_round(x: float, rng: random.Random) -> int:
    lo = math.floor(x)
    return lo + (1 if rng.random() < x - lo else 0)


def daily_count(platform: str, day: date, pcfg: dict, scfg: dict, backlog: int | None = None,
                salt: str = "") -> int:
    rng = _rng(platform, day, salt + "count")
    lo, hi = pcfg["per_day"]
    n = float(rng.randint(int(lo), int(hi)))
    if day.weekday() >= 5:
        n *= float(scfg.get("weekend_multiplier", 1.0))
    surge = scfg.get("surge") or {}
    if surge.get("start"):
        s0 = date.fromisoformat(str(surge["start"]))
        if s0 <= day < s0 + timedelta(days=int(surge.get("days", 0))):
            n *= float(surge.get("multiplier", 1.0))
    if rng.random() < float(scfg.get("light_day_chance", 0)):
        n *= 0.5
    count = max(1, _stochastic_round(n, rng))
    count = min(count, int(pcfg.get("max_per_day", count)))
    if backlog is not None:
        runway = max(1, int(scfg.get("runway_days", 1)))
        if backlog < count * runway:
            count = min(count, max(1 if backlog else 0, backlog // runway))
    return count


def plan_day(platform: str, day: date, pcfg: dict, scfg: dict, tz: str,
             backlog: int | None = None, salt: str = "") -> list[datetime]:
    """Return timezone-aware (audience-local) post times for one day."""
    count = daily_count(platform, day, pcfg, scfg, backlog, salt)
    if count <= 0:
        return []
    rng = _rng(platform, day, salt + "times")
    zone = ZoneInfo(tz)
    windows = scfg["windows"]
    weights = [float(w.get("weight", 1)) for w in windows]
    gap = int(scfg.get("min_gap_minutes", 60))
    chosen: list[int] = []
    attempts = 0
    while len(chosen) < count and attempts < 500:
        attempts += 1
        w = rng.choices(windows, weights=weights, k=1)[0]
        a, b = _minutes(w["start"]), _minutes(w["end"])
        m = rng.randint(a, max(a, b - 1))
        if m % 60 == 0 or m % 30 == 0:  # nobody real posts at exactly :00/:30 every time
            m += rng.choice([-3, -2, 2, 3, 4, 7])
        if all(abs(m - c) >= gap for c in chosen):
            chosen.append(m)
    out = []
    for m in sorted(chosen):
        m = max(0, min(m, 24 * 60 - 1))
        t = time(m // 60, m % 60, rng.randint(0, 59))
        out.append(datetime.combine(day, t, tzinfo=zone))
    return out


def freshness_weight(age_days: float, half_life: float) -> float:
    return 0.5 ** (max(0.0, age_days) / max(0.1, half_life))
