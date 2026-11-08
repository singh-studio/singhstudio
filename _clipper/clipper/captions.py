"""ASS subtitle generation: hook banner + punchy word-chunk captions."""

from __future__ import annotations

from typing import Iterable

Word = tuple[float, float, str]


def ass_time(t: float) -> str:
    t = max(0.0, t)
    h = int(t // 3600)
    m = int(t % 3600 // 60)
    s = t % 60
    cs = int(round((s - int(s)) * 100))
    if cs == 100:
        s, cs = int(s) + 1, 0
    return f"{h}:{m:02d}:{int(s):02d}.{cs:02d}"


def ass_escape(text: str) -> str:
    return (text.replace("\\", "\\\\").replace("{", "(").replace("}", ")")
            .replace("\n", " ").strip())


def chunk_words(words: Iterable[Word], per_chunk: int, max_gap: float = 0.6) -> list[tuple[float, float, str]]:
    chunks: list[tuple[float, float, str]] = []
    cur: list[Word] = []
    for w in words:
        if cur and (len(cur) >= per_chunk or w[0] - cur[-1][1] > max_gap
                    or cur[-1][2].rstrip().endswith((".", "!", "?", ","))):
            chunks.append((cur[0][0], cur[-1][1], " ".join(x[2] for x in cur)))
            cur = []
        cur.append(w)
    if cur:
        chunks.append((cur[0][0], cur[-1][1], " ".join(x[2] for x in cur)))
    # Close tiny gaps so captions don't flicker.
    out = []
    for i, (s, e, t) in enumerate(chunks):
        if i + 1 < len(chunks) and chunks[i + 1][0] - e < 0.25:
            e = chunks[i + 1][0]
        out.append((s, max(e, s + 0.3), t))
    return out


def build_ass(width: int, height: int, words: list[Word], hook: str, rcfg: dict, watermark: str = "") -> str:
    font = rcfg.get("caption_font", "Arial Black")
    cap_size = int(rcfg.get("caption_size", 84))
    hook_size = int(rcfg.get("hook_size", 92))
    hook_secs = float(rcfg.get("hook_seconds", 2.8))
    # Colours are &HAABBGGRR.
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{font},{cap_size},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,7,3,2,70,70,{int(height * 0.30)},1
Style: Hook,{font},{hook_size},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,3,18,0,8,80,80,{int(height * 0.13)},1
Style: Mark,{font},34,&H90FFFFFF,&H000000FF,&H60000000,&H00000000,-1,0,0,0,100,100,1,0,1,2,0,9,40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    if hook:
        pop = r"{\fad(80,200)\fscx85\fscy85\t(0,140,\fscx100\fscy100)}"
        lines.append(f"Dialogue: 2,{ass_time(0)},{ass_time(hook_secs)},Hook,,0,0,0,,{pop}{ass_escape(hook.upper())}")
    if words and rcfg.get("captions", True):
        for s, e, text in chunk_words(words, int(rcfg.get("caption_words", 3))):
            pop = r"{\fscx78\fscy78\t(0,90,\fscx100\fscy100)}"
            lines.append(f"Dialogue: 1,{ass_time(s)},{ass_time(e)},Cap,,0,0,0,,{pop}{ass_escape(text.upper())}")
    if watermark:
        lines.append(f"Dialogue: 0,{ass_time(0)},{ass_time(3600)},Mark,,0,0,0,,{ass_escape(watermark)}")
    return header + "\n".join(lines) + "\n"
