import numpy as np

from clipper.config import DEFAULTS
from clipper.detect import find_highlights, keyword_bonus, snap_to_words

SR = 16000


def synth(duration=300, bursts=(60, 180)):
    rng = np.random.default_rng(0)
    a = (rng.standard_normal(duration * SR) * 0.02).astype(np.float32)
    for b in bursts:
        s = int(b * SR)
        a[s:s + 3 * SR] += (rng.standard_normal(3 * SR) * 0.5).astype(np.float32)
    return a


def test_finds_bursts_and_respects_lengths():
    cfg = {**DEFAULTS["detect"], "clips_per_hour": 24, "oversample": 1}
    cands = find_highlights(synth(), SR, 300, [], cfg)
    peaks = [c.peak for c in cands]
    assert any(58 <= p <= 64 for p in peaks)
    assert any(178 <= p <= 184 for p in peaks)
    for c in cands:
        assert cfg["min_clip_s"] * 0.8 <= c.duration <= cfg["max_clip_s"] + 0.01
        assert c.start < c.peak < c.end
    for a, b in zip(cands, cands[1:]):
        assert a.end <= b.start


def test_silence_yields_nothing():
    cfg = {**DEFAULTS["detect"]}
    assert find_highlights(np.zeros(120 * SR, dtype=np.float32), SR, 120, [], cfg) == []


def test_keywords_and_snapping():
    bonus, hits = keyword_bonus("bro NO WAY that just happened", ["no way", "bro", "insane"])
    assert bonus > 0 and set(hits) == {"no way", "bro"}
    words = [(9.8, 10.4, "hello"), (19.7, 20.5, "world")]
    s, e = snap_to_words(10.0, 20.0, words)
    assert s < 9.8 and e > 20.5
