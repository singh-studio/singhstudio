from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass
from pathlib import Path

from clipper.db import iso, utcnow

log = logging.getLogger(__name__)


class PublishError(RuntimeError):
    """Raise with retryable=False for errors a retry won't fix (auth, policy)."""

    def __init__(self, msg: str, retryable: bool = True):
        super().__init__(msg)
        self.retryable = retryable


@dataclass
class PublishResult:
    remote_id: str
    url: str = ""


@dataclass
class PostCopy:
    title: str
    description: str
    hashtags: list[str]


class Publisher:
    name = "base"

    def __init__(self, cfg, secrets: Path):
        self.cfg = cfg
        self.secrets = secrets

    def check(self) -> tuple[bool, str]:
        return False, "not implemented"

    def publish(self, video: Path, copy: PostCopy) -> PublishResult:
        raise NotImplementedError


class DryRunPublisher(Publisher):
    """Records what would have been posted; the default until you flip dry_run off."""

    def __init__(self, platform: str, log_file: Path):
        self.name = platform
        self.log_file = log_file

    def check(self) -> tuple[bool, str]:
        return True, "dry-run"

    def publish(self, video: Path, copy: PostCopy) -> PublishResult:
        rid = f"dry-{uuid.uuid4().hex[:10]}"
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        with self.log_file.open("a") as f:
            f.write(json.dumps({"at": iso(utcnow()), "platform": self.name, "video": str(video),
                                "title": copy.title, "description": copy.description,
                                "hashtags": copy.hashtags, "id": rid}) + "\n")
        log.info("[dry-run] %s <- %s | %s", self.name, video.name, copy.title)
        return PublishResult(rid)
