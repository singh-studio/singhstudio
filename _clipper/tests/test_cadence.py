from datetime import date, timedelta

from clipper.cadence import daily_count, plan_day
from clipper.config import DEFAULTS

S = DEFAULTS["schedule"]
YT = S["platforms"]["youtube"]
TZ = "America/New_York"


def _mins(t):
    return t.hour * 60 + t.minute


def test_counts_within_bounds_and_capped():
    for i in range(120):
        d = date(2027, 1, 1) + timedelta(days=i)
        n = daily_count("youtube", d, YT, {**S, "surge": {}})
        assert 1 <= n <= YT["max_per_day"]


def test_times_inside_windows_with_gap_and_not_round():
    windows = [(int(w["start"][:2]) * 60 + int(w["start"][3:]), int(w["end"][:2]) * 60 + int(w["end"][3:]))
               for w in S["windows"]]
    for i in range(60):
        times = plan_day("tiktok", date(2027, 2, 1) + timedelta(days=i), S["platforms"]["tiktok"], S, TZ)
        ms = [_mins(t) for t in times]
        assert ms == sorted(ms)
        assert all(b - a >= S["min_gap_minutes"] for a, b in zip(ms, ms[1:]))
        assert all(any(a - 8 <= m <= b + 8 for a, b in windows) for m in ms)
        assert all(t.tzinfo is not None for t in times)


def test_deterministic_per_day():
    d = date(2027, 3, 3)
    assert plan_day("youtube", d, YT, S, TZ) == plan_day("youtube", d, YT, S, TZ)
    assert plan_day("youtube", d, YT, S, TZ) != plan_day("tiktok", d, YT, S, TZ)


def test_surge_raises_volume():
    base = {**S, "surge": {}, "light_day_chance": 0}
    surge = {**base, "surge": {"start": "2027-04-01", "days": 30, "multiplier": 2.0}}
    days = [date(2027, 4, 1) + timedelta(days=i) for i in range(30)]
    pc = {"per_day": [3, 5], "max_per_day": 50}
    assert sum(daily_count("x", d, pc, surge) for d in days) > 1.6 * sum(daily_count("x", d, pc, base) for d in days)


def test_thin_backlog_slows_down_instead_of_burning_out():
    d = date(2027, 5, 5)
    pc = {"per_day": [5, 5], "max_per_day": 10}
    sc = {**S, "surge": {}, "light_day_chance": 0, "weekend_multiplier": 1, "runway_days": 3}
    assert daily_count("x", d, pc, sc, backlog=100) == 5
    assert daily_count("x", d, pc, sc, backlog=6) == 2
    assert daily_count("x", d, pc, sc, backlog=1) == 1
    assert daily_count("x", d, pc, sc, backlog=0) == 0
