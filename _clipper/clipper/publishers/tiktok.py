"""TikTok via the official Content Posting API.

Setup:
  1. developers.tiktok.com -> create an app, add Login Kit + Content Posting API,
     scopes `video.publish` (direct) and/or `video.upload` (inbox drafts).
  2. Put {"client_key": "...", "client_secret": "..."} in
     ~/Clipper/secrets/tiktok_app.json and set publish.tiktok.redirect_uri to
     the redirect URI registered on the app.
  3. `clipper auth tiktok` (paste the redirected URL back in once).

Modes:
  direct - posts straight to the profile. Until TikTok audits your app, posts
           can only be SELF_ONLY (private); this publisher detects that and
           says so. Public direct posting requires passing the audit.
  inbox  - uploads land in your TikTok app inbox as drafts; you tap Post.
           No audit needed; ~10 seconds of your time per clip.
"""

from __future__ import annotations

import json
import logging
import math
import time
import urllib.parse
from pathlib import Path

import requests

from clipper.publishers.base import PostCopy, PublishError, Publisher, PublishResult

log = logging.getLogger(__name__)
API = "https://open.tiktokapis.com/v2"
AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
CHUNK = 10 * 1024 * 1024


class TikTokPublisher(Publisher):
    name = "tiktok"

    @property
    def app_file(self) -> Path:
        return self.secrets / "tiktok_app.json"

    @property
    def token_file(self) -> Path:
        return self.secrets / "tiktok_token.json"

    def _app(self) -> dict:
        if not self.app_file.exists():
            raise PublishError(f"missing {self.app_file}", retryable=False)
        return json.loads(self.app_file.read_text())

    def _save_token(self, tok: dict) -> None:
        tok["obtained_at"] = int(time.time())
        self.token_file.write_text(json.dumps(tok, indent=2))
        self.token_file.chmod(0o600)

    def auth(self) -> None:
        app = self._app()
        redirect = self.cfg["publish"]["tiktok"].get("redirect_uri")
        if not redirect:
            raise SystemExit("set publish.tiktok.redirect_uri in config.yaml first")
        scope = "user.info.basic,video.publish,video.upload"
        url = AUTH_URL + "?" + urllib.parse.urlencode({
            "client_key": app["client_key"], "response_type": "code", "scope": scope,
            "redirect_uri": redirect, "state": "clipper"})
        print("Open this URL, approve, then paste the full URL you were redirected to:\n\n" + url + "\n")
        back = input("redirected URL: ").strip()
        code = urllib.parse.parse_qs(urllib.parse.urlparse(back).query).get("code", [back])[0]
        r = requests.post(f"{API}/oauth/token/", data={
            "client_key": app["client_key"], "client_secret": app["client_secret"], "code": code,
            "grant_type": "authorization_code", "redirect_uri": redirect}, timeout=30)
        tok = r.json()
        if "access_token" not in tok:
            raise SystemExit(f"token exchange failed: {tok}")
        self._save_token(tok)
        print(f"saved {self.token_file}")

    def _token(self) -> str:
        if not self.token_file.exists():
            raise PublishError("no TikTok token; run `clipper auth tiktok`", retryable=False)
        tok = json.loads(self.token_file.read_text())
        if time.time() > tok.get("obtained_at", 0) + int(tok.get("expires_in", 0)) - 600:
            app = self._app()
            r = requests.post(f"{API}/oauth/token/", data={
                "client_key": app["client_key"], "client_secret": app["client_secret"],
                "grant_type": "refresh_token", "refresh_token": tok["refresh_token"]}, timeout=30)
            new = r.json()
            if "access_token" not in new:
                raise PublishError(f"TikTok token refresh failed: {new}", retryable=False)
            self._save_token(new)
            tok = new
        return tok["access_token"]

    def _post(self, path: str, body: dict) -> dict:
        r = requests.post(f"{API}{path}", json=body, timeout=60, headers={
            "Authorization": f"Bearer {self._token()}", "Content-Type": "application/json; charset=UTF-8"})
        data = r.json() if r.content else {}
        err = (data.get("error") or {})
        if r.status_code >= 400 or err.get("code") not in (None, "ok"):
            retry = r.status_code >= 500 or r.status_code == 429 or err.get("code") == "rate_limit_exceeded"
            raise PublishError(f"TikTok {path} failed ({r.status_code}): {err or data}", retry)
        return data.get("data", {})

    def check(self) -> tuple[bool, str]:
        try:
            info = self._post("/post/publish/creator_info/query/", {})
            opts = info.get("privacy_level_options", [])
            if self.cfg["publish"]["tiktok"]["mode"] == "direct" and "PUBLIC_TO_EVERYONE" not in opts:
                return True, f"ok but app is unaudited: only {opts} allowed (posts will be private)"
            return True, "ok"
        except Exception as exc:
            return False, str(exc)

    def publish(self, video: Path, copy: PostCopy) -> PublishResult:
        tcfg = self.cfg["publish"]["tiktok"]
        size = video.stat().st_size
        chunk, count = chunk_plan(size)
        source = {"source": "FILE_UPLOAD", "video_size": size, "chunk_size": chunk, "total_chunk_count": count}
        caption = f"{copy.title} {' '.join(copy.hashtags)}"[:2200]

        if tcfg.get("mode") == "inbox":
            data = self._post("/post/publish/inbox/video/init/", {"source_info": source})
        else:
            info = self._post("/post/publish/creator_info/query/", {})
            opts = info.get("privacy_level_options") or ["SELF_ONLY"]
            privacy = tcfg.get("privacy_level", "PUBLIC_TO_EVERYONE")
            if privacy not in opts:
                log.warning("TikTok privacy %s not allowed for this app (%s); using %s", privacy, opts, opts[0])
                privacy = opts[0]
            data = self._post("/post/publish/video/init/", {
                "post_info": {"title": caption, "privacy_level": privacy, "disable_duet": False,
                              "disable_comment": False, "disable_stitch": False,
                              "video_cover_timestamp_ms": 1000},
                "source_info": source})
        publish_id, upload_url = data["publish_id"], data["upload_url"]

        with video.open("rb") as f:
            for i in range(count):
                first = i * chunk
                last = size - 1 if i == count - 1 else first + chunk - 1
                f.seek(first)
                payload = f.read(last - first + 1)
                r = requests.put(upload_url, data=payload, timeout=300, headers={
                    "Content-Type": "video/mp4", "Content-Length": str(len(payload)),
                    "Content-Range": f"bytes {first}-{last}/{size}"})
                if r.status_code not in (200, 201, 206):
                    raise PublishError(f"TikTok chunk {i} upload failed ({r.status_code}): {r.text[:300]}")

        for _ in range(60):
            st = self._post("/post/publish/status/fetch/", {"publish_id": publish_id})
            status = st.get("status")
            if status in ("PUBLISH_COMPLETE", "SEND_TO_USER_INBOX"):
                ids = st.get("publicaly_available_post_id") or []
                return PublishResult(str(ids[0]) if ids else publish_id)
            if status == "FAILED":
                raise PublishError(f"TikTok processing failed: {st.get('fail_reason')}", retryable=False)
            time.sleep(10)
        # Upload is accepted and still processing; treat as posted to avoid duplicates.
        log.warning("TikTok still processing %s after 10 min; recording as posted", publish_id)
        return PublishResult(publish_id)


def chunk_plan(size: int) -> tuple[int, int]:
    chunk = size if size < 5 * 1024 * 1024 else CHUNK
    return chunk, max(1, math.floor(size / chunk))
