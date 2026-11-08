"""Instagram Reels via the official Instagram Graph API (resumable upload).

Requires an Instagram professional (Business/Creator) account and a Meta app
with instagram_content_publish permission. Save a long-lived token to
~/Clipper/secrets/instagram_token.json as {"access_token": "..."} and set
publish.instagram.ig_user_id. Long-lived tokens last ~60 days; `clipper doctor`
warns as expiry approaches. API publishing is capped at 50 posts / 24h.
Marked beta: verify with dry_run off on a test account before relying on it.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path

import requests

from clipper.publishers.base import PostCopy, PublishError, Publisher, PublishResult

log = logging.getLogger(__name__)


class InstagramPublisher(Publisher):
    name = "instagram"

    @property
    def token_file(self) -> Path:
        return self.secrets / "instagram_token.json"

    def _token(self) -> str:
        if not self.token_file.exists():
            raise PublishError(f"missing {self.token_file}", retryable=False)
        return json.loads(self.token_file.read_text())["access_token"]

    def _base(self) -> str:
        icfg = self.cfg["publish"]["instagram"]
        return f"https://{icfg['graph_host']}/{icfg['api_version']}"

    def check(self) -> tuple[bool, str]:
        icfg = self.cfg["publish"]["instagram"]
        if not icfg.get("ig_user_id"):
            return False, "publish.instagram.ig_user_id not set"
        try:
            r = requests.get(f"{self._base()}/{icfg['ig_user_id']}", params={
                "fields": "username", "access_token": self._token()}, timeout=30)
            return (r.ok, "ok" if r.ok else r.text[:300])
        except Exception as exc:
            return False, str(exc)

    def publish(self, video: Path, copy: PostCopy) -> PublishResult:
        icfg = self.cfg["publish"]["instagram"]
        uid, token, base = icfg["ig_user_id"], self._token(), self._base()
        caption = f"{copy.title}\n\n{copy.description}\n\n{' '.join(copy.hashtags)}"[:2200]
        r = requests.post(f"{base}/{uid}/media", timeout=60, data={
            "media_type": "REELS", "upload_type": "resumable", "caption": caption,
            "share_to_feed": "true", "access_token": token})
        if not r.ok:
            raise PublishError(f"IG container failed ({r.status_code}): {r.text[:300]}", r.status_code >= 500)
        cid = r.json()["id"]
        upload_uri = r.json().get("uri") or f"https://rupload.facebook.com/ig-api-upload/{icfg['api_version']}/{cid}"
        size = video.stat().st_size
        with video.open("rb") as f:
            up = requests.post(upload_uri, data=f, timeout=600, headers={
                "Authorization": f"OAuth {token}", "offset": "0", "file_size": str(size)})
        if not up.ok:
            raise PublishError(f"IG upload failed ({up.status_code}): {up.text[:300]}")
        for _ in range(60):
            st = requests.get(f"{base}/{cid}", params={"fields": "status_code", "access_token": token},
                              timeout=30).json()
            code = st.get("status_code")
            if code == "FINISHED":
                break
            if code in ("ERROR", "EXPIRED"):
                raise PublishError(f"IG processing {code}: {st}", retryable=False)
            time.sleep(10)
        else:
            raise PublishError("IG processing timed out")
        pub = requests.post(f"{base}/{uid}/media_publish", data={"creation_id": cid, "access_token": token},
                            timeout=60)
        if not pub.ok:
            raise PublishError(f"IG publish failed ({pub.status_code}): {pub.text[:300]}", pub.status_code >= 500)
        return PublishResult(pub.json()["id"])
