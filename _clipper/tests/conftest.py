import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from clipper.config import load_config  # noqa: E402


@pytest.fixture
def cfg(tmp_path):
    c = load_config(tmp_path / "missing.yaml", overrides={
        "paths": {"root": str(tmp_path / "Clipper")},
        "copy": {"provider": "template"},
        "transcribe": {"engine": "none"},
        "render": {"fps": 30, "encoder": "libx264"},
        "daemon": {"min_free_gb": 0},
    })
    c.ensure_dirs()
    return c
