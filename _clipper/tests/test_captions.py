from clipper.captions import ass_time, build_ass, chunk_words
from clipper.config import DEFAULTS


def test_ass_time():
    assert ass_time(0) == "0:00:00.00"
    assert ass_time(61.257) == "0:01:01.26"
    assert ass_time(3.999) == "0:00:04.00"


def test_chunks_and_escaping():
    words = [(0.0, 0.3, "no"), (0.3, 0.6, "way"), (0.6, 0.9, "bro!"), (2.0, 2.4, "{run}")]
    chunks = chunk_words(words, 3)
    assert [c[2] for c in chunks] == ["no way bro!", "{run}"]
    ass = build_ass(1080, 1920, words, "Wait for it", DEFAULTS["render"])
    assert "WAIT FOR IT" in ass and "(RUN)" in ass and "{run}" not in ass
    assert ass.count("Dialogue:") == 3
