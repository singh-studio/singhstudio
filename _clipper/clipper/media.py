"""ffmpeg / ffprobe helpers."""

from __future__ import annotations

import functools
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np


class MediaError(RuntimeError):
    pass


def _run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    r = subprocess.run(cmd, capture_output=True, **kw)
    if r.returncode != 0:
        err = r.stderr.decode(errors="replace") if isinstance(r.stderr, bytes) else r.stderr
        raise MediaError(f"{cmd[0]} failed ({r.returncode}): {err[-1500:]}")
    return r


def require_ffmpeg() -> None:
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            raise MediaError(f"{tool} not found on PATH (brew install ffmpeg)")


def probe(path: str | Path) -> dict:
    r = _run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)])
    info = json.loads(r.stdout)
    streams = info.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio = [s for s in streams if s.get("codec_type") == "audio"]
    duration = float(info.get("format", {}).get("duration") or (video or {}).get("duration") or 0)
    return {
        "duration": duration,
        "width": int(video["width"]) if video else 0,
        "height": int(video["height"]) if video else 0,
        "audio_tracks": len(audio),
    }


def hwaccel_args() -> list[str]:
    return ["-hwaccel", "videotoolbox"] if sys.platform == "darwin" else []


@functools.lru_cache(maxsize=1)
def available_encoders() -> str:
    try:
        return _run(["ffmpeg", "-hide_banner", "-encoders"], text=True).stdout
    except MediaError:
        return ""


def load_audio(path: str | Path, track: int = 0, sr: int = 16000,
               start: float | None = None, duration: float | None = None) -> np.ndarray:
    """Decode one audio track to mono float32 at `sr` Hz."""
    cmd = ["ffmpeg", "-v", "error", "-nostdin"]
    if start is not None:
        cmd += ["-ss", f"{start:.3f}"]
    if duration is not None:
        cmd += ["-t", f"{duration:.3f}"]
    cmd += ["-i", str(path), "-map", f"0:a:{track}", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"]
    r = _run(cmd)
    return np.frombuffer(r.stdout, dtype=np.int16).astype(np.float32) / 32768.0


_PTS = re.compile(r"pts_time:([0-9.]+)")


def scene_changes(path: str | Path, threshold: float = 0.35) -> list[float]:
    """Timestamps of hard visual cuts/flashes, decoded at low res/fps for speed."""
    cmd = ["ffmpeg", "-v", "error", "-nostdin", *hwaccel_args(), "-i", str(path), "-map", "0:v:0",
           "-vf", f"fps=4,scale=256:-2,select='gt(scene,{threshold})',metadata=print:file=-",
           "-an", "-f", "null", "-"]
    r = _run(cmd, text=True)
    return [float(m.group(1)) for m in _PTS.finditer(r.stdout)]


def extract_wav(path: str | Path, out: Path, start: float, duration: float, track: int = 0) -> Path:
    _run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-ss", f"{start:.3f}", "-t", f"{duration:.3f}",
          "-i", str(path), "-map", f"0:a:{track}", "-ac", "1", "-ar", "16000", str(out)])
    return out
