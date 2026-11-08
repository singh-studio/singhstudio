"""Hook, title, description and hashtags for each clip.

Uses Claude when an API key is available (env ANTHROPIC_API_KEY or
~/Clipper/secrets/anthropic_api_key); otherwise falls back to templates so the
pipeline never stalls. Recent titles are passed in so copy doesn't repeat -
repetitive, templated uploads are what platforms flag as mass-produced.
"""

from __future__ import annotations

import logging
import os
import random
from pathlib import Path

from pydantic import BaseModel, Field

log = logging.getLogger(__name__)


class ClipCopy(BaseModel):
    hook: str = Field(description="On-screen hook for the first ~3 seconds, max 7 words")
    title: str = Field(description="Post title, max 80 characters, no hashtags")
    description: str = Field(description="1-2 short sentences")
    hashtags: list[str] = Field(description="3-5 hashtags including the leading #")
    virality: int = Field(description="1-10: how likely this moment is to hold a viewer to the end")


SYSTEM = """You write copy for a gaming short-form channel that posts the creator's own {game} gameplay.
Voice: {voice}
Rules:
- The hook is what appears on screen in the first 3 seconds: curiosity or stakes, max 7 words, no emojis.
- Only describe what the transcript and signals support. Never invent events, never claim to be official, never use Rockstar's name as the author.
- No engagement bait ("like and subscribe"), no misleading claims, no spoilers of the story ending.
- Vary phrasing; do not reuse the structure of the recent titles you are shown.
- Rate virality honestly; a quiet or unclear moment is a 3, not a 7."""

FALLBACK_HOOKS = {
    "commentary": ["I did NOT expect that", "Wait for the reaction", "This went so wrong", "Why did I do this"],
    "action": ["Wait for it…", "Vice City doesn't play fair", "This escalated fast", "Five stars in seconds",
               "Watch the ending", "No way this worked"],
}


def _api_key(secrets_dir: Path) -> str | None:
    if os.environ.get("ANTHROPIC_API_KEY"):
        return os.environ["ANTHROPIC_API_KEY"]
    f = secrets_dir / "anthropic_api_key"
    if f.exists():
        return f.read_text().strip() or None
    return None


def _clean_tags(tags: list[str], defaults: list[str], limit: int) -> list[str]:
    out: list[str] = []
    for t in list(tags) + list(defaults):
        t = "#" + t.strip().lstrip("#").replace(" ", "")
        if len(t) > 1 and t.lower() not in {x.lower() for x in out}:
            out.append(t)
    return out[:limit]


def template_copy(features: dict, transcript: str, ccfg: dict, rng: random.Random | None = None) -> ClipCopy:
    rng = rng or random.Random()
    kind = "commentary" if len(transcript.split()) >= 6 else "action"
    hook = rng.choice(FALLBACK_HOOKS[kind])
    game = ccfg.get("game", "GTA VI")
    title = f"{hook.rstrip('…').rstrip('.')} | {game}"
    return ClipCopy(hook=hook, title=title[:80], description=f"{game} moment from today's session.",
                    hashtags=_clean_tags([], ccfg["default_hashtags"], ccfg["max_hashtags"]),
                    virality=5)


def write_copy(features: dict, transcript: str, recent_titles: list[str], ccfg: dict,
               secrets_dir: Path) -> ClipCopy:
    key = _api_key(secrets_dir) if ccfg.get("provider") == "anthropic" else None
    if not key:
        return template_copy(features, transcript, ccfg)
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=key)
        user = (
            f"Signals: {features}\n"
            f"Transcript (may be empty or just game audio): {transcript[:1500] or '(none)'}\n"
            f"Recent titles to avoid echoing:\n- " + "\n- ".join(recent_titles[-20:] or ["(none)"])
        )
        resp = client.beta.messages.parse(
            model=ccfg.get("model", "claude-opus-5-5"),
            max_tokens=2000,
            # Server-side fallback: if a request is declined it is re-run on a fallback model.
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": ccfg.get("effort", "low")},
            system=SYSTEM.format(game=ccfg.get("game", "GTA VI"), voice=ccfg.get("channel_voice", "")),
            messages=[{"role": "user", "content": user}],
            output_format=ClipCopy,
        )
        if resp.stop_reason == "refusal" or resp.parsed_output is None:
            log.warning("copywriter returned no usable output (stop_reason=%s); using template", resp.stop_reason)
            return template_copy(features, transcript, ccfg)
        c = resp.parsed_output
        c.hashtags = _clean_tags(c.hashtags, ccfg["default_hashtags"], ccfg["max_hashtags"])
        c.title = c.title[:80]
        c.virality = max(1, min(10, int(c.virality)))
        return c
    except Exception as exc:  # never let copy block the pipeline
        log.warning("copywriter failed (%s); using template", exc)
        return template_copy(features, transcript, ccfg)
