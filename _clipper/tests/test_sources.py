import os
import time

import pytest
import yaml

from clipper.db import DB
from clipper.sources import LicenseError, load_sources, scan_folder, validate_source


def test_rejects_unlicensed_and_unproven(cfg):
    with pytest.raises(LicenseError):
        validate_source({"id": "x", "kind": "url_list", "urls": ["https://example.com/v"]}, cfg)
    with pytest.raises(LicenseError):
        validate_source({"id": "x", "license": "found-on-tiktok"}, cfg)
    with pytest.raises(LicenseError):
        validate_source({"id": "x", "license": "permission", "credit": "@a", "evidence": "nope.pdf"}, cfg)
    with pytest.raises(LicenseError):
        validate_source({"id": "x", "license": "permission", "evidence": "a.pdf"}, cfg)


def test_accepts_documented_permission(cfg):
    (cfg.licenses / "deal.pdf").write_text("signed")
    s = validate_source({"id": "s", "kind": "url_list", "license": "permission", "credit": "@s",
                         "evidence": "deal.pdf", "urls": ["u"]}, cfg)
    assert s.license == "permission" and s.evidence.exists()


def test_bad_sources_dropped_good_kept(cfg):
    cfg.sources_file.write_text(yaml.safe_dump({"sources": [
        {"id": "mine", "kind": "watch_folder", "license": "owned"},
        {"id": "stolen", "kind": "url_list", "urls": ["x"]},
    ]}))
    assert [s.id for s in load_sources(cfg)] == ["mine"]


def test_scan_waits_for_recording_to_finish(cfg):
    db = DB(cfg.db_path)
    src = load_sources(cfg)[0]
    f = cfg.inbox / "session.mp4"
    f.write_bytes(b"x" * 10)
    assert scan_folder(src, cfg, db) == 0  # still "being written"
    old = time.time() - 3600
    os.utime(f, (old, old))
    assert scan_folder(src, cfg, db) == 1
    assert scan_folder(src, cfg, db) == 0  # idempotent
