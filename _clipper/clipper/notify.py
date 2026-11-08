"""Push notifications to your phone via ntfy (free; install the ntfy app, subscribe to your topic)."""

from __future__ import annotations

import logging

import requests

log = logging.getLogger(__name__)


def notify(cfg, title: str, message: str, priority: str = "default") -> None:
    ncfg = cfg.get("notify", {})
    topic = ncfg.get("ntfy_topic")
    if not topic:
        return
    try:
        requests.post(f"{ncfg.get('ntfy_server', 'https://ntfy.sh').rstrip('/')}/{topic}",
                      data=message.encode(), timeout=15,
                      headers={"Title": title, "Priority": priority, "Tags": "clapper"})
    except Exception as exc:
        log.warning("notify failed: %s", exc)
