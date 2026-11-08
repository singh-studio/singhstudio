"""Speech-to-text for shortlisted clips only (word timestamps for captions).

Engines (auto picks the first that imports):
  mlx     - mlx-whisper, fastest on Apple Silicon Mac minis.
  faster  - faster-whisper on CPU (int8).
  none    - no captions from speech; the pipeline still works.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

log = logging.getLogger(__name__)

Word = tuple[float, float, str]

MLX_REPOS = {
    "tiny.en": "mlx-community/whisper-tiny.en-mlx",
    "base.en": "mlx-community/whisper-base.en-mlx",
    "small.en": "mlx-community/whisper-small.en-mlx",
    "medium.en": "mlx-community/whisper-medium.en-mlx",
    "large-v3-turbo": "mlx-community/whisper-large-v3-turbo",
}


def pick_engine(preferred: str = "auto") -> str:
    if preferred != "auto":
        return preferred
    try:
        import mlx_whisper  # noqa: F401
        return "mlx"
    except Exception:
        pass
    try:
        import faster_whisper  # noqa: F401
        return "faster"
    except Exception:
        return "none"


@lru_cache(maxsize=1)
def _faster_model(name: str):
    from faster_whisper import WhisperModel
    return WhisperModel(name, device="cpu", compute_type="int8")


def transcribe(wav: Path, cfg: dict) -> tuple[str, list[Word]]:
    engine = pick_engine(cfg.get("engine", "auto"))
    model = cfg.get("model", "small.en")
    lang = cfg.get("language")
    words: list[Word] = []
    try:
        if engine == "mlx":
            import mlx_whisper
            res = mlx_whisper.transcribe(str(wav), path_or_hf_repo=MLX_REPOS.get(model, model),
                                         word_timestamps=True, language=lang)
            for seg in res.get("segments", []):
                for w in seg.get("words", []):
                    words.append((float(w["start"]), float(w["end"]), str(w["word"]).strip()))
        elif engine == "faster":
            segments, _ = _faster_model(model).transcribe(str(wav), word_timestamps=True,
                                                          vad_filter=True, language=lang)
            for seg in segments:
                for w in seg.words or []:
                    words.append((float(w.start), float(w.end), w.word.strip()))
        else:
            return "", []
    except Exception as exc:  # transcription is an enhancement, never fatal
        log.warning("transcription failed (%s): %s", engine, exc)
        return "", []
    words = [w for w in words if w[2]]
    return " ".join(w[2] for w in words), words
