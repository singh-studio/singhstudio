from __future__ import annotations

from clipper.config import Config
from clipper.publishers.base import DryRunPublisher, PostCopy, PublishError, Publisher, PublishResult


def get_publisher(platform: str, cfg: Config, force_real: bool = False) -> Publisher:
    if cfg["publish"].get("dry_run", True) and not force_real:
        return DryRunPublisher(platform, cfg.state / "dry_run_posts.jsonl")
    if platform == "youtube":
        from clipper.publishers.youtube import YouTubePublisher
        return YouTubePublisher(cfg, cfg.secrets)
    if platform == "tiktok":
        from clipper.publishers.tiktok import TikTokPublisher
        return TikTokPublisher(cfg, cfg.secrets)
    if platform == "instagram":
        from clipper.publishers.instagram import InstagramPublisher
        return InstagramPublisher(cfg, cfg.secrets)
    raise ValueError(f"unknown platform {platform}")


__all__ = ["get_publisher", "PostCopy", "PublishError", "Publisher", "PublishResult"]
