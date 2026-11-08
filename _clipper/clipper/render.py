"""16:9 gameplay -> 9:16 short (1080x1920), captions burned in, loudness normalised."""

from __future__ import annotations

import logging
import shutil
import subprocess
import sys
from pathlib import Path

from clipper.captions import build_ass
from clipper.media import MediaError, available_encoders, hwaccel_args

log = logging.getLogger(__name__)


def pick_encoder(pref: str) -> str:
    if pref in ("videotoolbox", "libx264"):
        return pref
    if sys.platform == "darwin" and "h264_videotoolbox" in available_encoders():
        return "videotoolbox"
    return "libx264"


def video_filter(rcfg: dict, ass_name: str | None, fontsdir: str | None) -> str:
    W, H = int(rcfg["width"]), int(rcfg["height"])
    fps = int(rcfg["fps"])
    if rcfg.get("layout") == "crop":
        chain = (f"[0:v:0]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                 f"fps={fps},setsar=1[base]")
    else:
        zoom = float(rcfg.get("fg_zoom", 1.3))
        fgw = int(W * zoom) // 2 * 2
        chain = (
            f"[0:v:0]fps={fps},split=2[bg][fg];"
            f"[bg]scale={W // 4}:{H // 4}:force_original_aspect_ratio=increase,crop={W // 4}:{H // 4},"
            f"boxblur=10:2,eq=brightness=-0.10:saturation=1.15,scale={W}:{H},setsar=1[bgb];"
            f"[fg]scale={fgw}:-2,crop=min(iw\\,{W}):ih,setsar=1[fgs];"
            f"[bgb][fgs]overlay=(W-w)/2:(H-h)/2[base]"
        )
    if ass_name:
        extra = f":fontsdir={fontsdir}" if fontsdir else ""
        chain += f";[base]ass={ass_name}{extra},format=yuv420p[vout]"
    else:
        chain += ";[base]format=yuv420p[vout]"
    return chain


def audio_filter(tracks: list[int], lufs: float) -> str:
    if len(tracks) == 1:
        src = f"[0:a:{tracks[0]}]"
        pre = ""
    else:
        ins = "".join(f"[0:a:{t}]" for t in tracks)
        pre = f"{ins}amix=inputs={len(tracks)}:normalize=0[amixed];"
        src = "[amixed]"
    return f"{pre}{src}loudnorm=I={lufs}:TP=-1.5:LRA=11,aresample=48000[aout]"


def render_clip(src: str | Path, out: Path, start: float, end: float, words, hook: str,
                rcfg: dict, audio_tracks: list[int], work_dir: Path, fonts_dir: Path | None = None,
                has_audio: bool = True) -> Path:
    work_dir.mkdir(parents=True, exist_ok=True)
    out.parent.mkdir(parents=True, exist_ok=True)
    W, H = int(rcfg["width"]), int(rcfg["height"])
    dur = end - start

    # Word timestamps are relative to clip start.
    ass_name = None
    if hook or words or rcfg.get("watermark"):
        ass_name = f"{out.stem}.ass"
        (work_dir / ass_name).write_text(build_ass(W, H, words, hook, rcfg, rcfg.get("watermark", "")),
                                         encoding="utf-8")
    fontsdir = None
    if fonts_dir and fonts_dir.exists() and any(fonts_dir.iterdir()):
        fontsdir = str(fonts_dir).replace("\\", "/").replace(":", "\\:")

    graph = video_filter(rcfg, ass_name, fontsdir)
    maps = ["-map", "[vout]"]
    if has_audio:
        graph += ";" + audio_filter(audio_tracks, float(rcfg["loudness_lufs"]))
        maps += ["-map", "[aout]"]

    enc = pick_encoder(rcfg.get("encoder", "auto"))
    if enc == "videotoolbox":
        venc = ["-c:v", "h264_videotoolbox", "-b:v", rcfg["video_bitrate"], "-profile:v", "high"]
    else:
        venc = ["-c:v", "libx264", "-preset", "medium", "-crf", str(rcfg.get("crf", 20)),
                "-maxrate", rcfg["video_bitrate"], "-bufsize", "24M", "-profile:v", "high"]

    tmp = out.with_suffix(".partial.mp4")
    cmd = ["ffmpeg", "-v", "error", "-nostdin", "-y", *hwaccel_args(),
           "-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", str(Path(src).resolve()),
           "-filter_complex", graph, *maps, *venc, "-g", str(int(rcfg["fps"]) * 2),
           "-c:a", "aac", "-b:a", rcfg["audio_bitrate"], "-ar", "48000",
           "-movflags", "+faststart", "-shortest", str(tmp.resolve())]
    # Run inside work_dir so the ass= filter gets a bare filename (no path escaping).
    r = subprocess.run(cmd, cwd=work_dir, capture_output=True, text=True)
    if r.returncode != 0 and enc == "videotoolbox":
        log.warning("videotoolbox encode failed, retrying with libx264")
        rcfg = {**rcfg, "encoder": "libx264"}
        return render_clip(src, out, start, end, words, hook, rcfg, audio_tracks, work_dir, fonts_dir, has_audio)
    if r.returncode != 0:
        raise MediaError(f"render failed: {r.stderr[-1500:]}")
    shutil.move(str(tmp), str(out))
    if ass_name:
        (work_dir / ass_name).unlink(missing_ok=True)
    return out
