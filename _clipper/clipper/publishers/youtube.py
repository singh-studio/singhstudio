"""YouTube Shorts via the official YouTube Data API v3 (videos.insert).

Setup (once):
  1. Google Cloud console -> new project -> enable "YouTube Data API v3".
  2. OAuth consent screen (External, add yourself as test user) and an
     OAuth client of type "Desktop app"; download the JSON to
     ~/Clipper/secrets/youtube_client_secret.json
  3. `clipper auth youtube` (opens a browser once; token is refreshed automatically).

Two limits to know about:
  - Uploads from an unaudited API project are locked to PRIVATE. Submit the
    YouTube API Services audit/compliance form for the project to post publicly.
  - The default quota is 10,000 units/day and an upload is expensive, which
    caps you at roughly 6 uploads/day per project. Keep `max_per_day` <= 6 or
    request a quota increase.
"""

from __future__ import annotations

import logging
from pathlib import Path

from clipper.publishers.base import PostCopy, PublishError, Publisher, PublishResult

log = logging.getLogger(__name__)
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


class YouTubePublisher(Publisher):
    name = "youtube"

    @property
    def token_file(self) -> Path:
        return self.secrets / "youtube_token.json"

    @property
    def client_file(self) -> Path:
        return self.secrets / "youtube_client_secret.json"

    def auth(self) -> None:
        from google_auth_oauthlib.flow import InstalledAppFlow
        flow = InstalledAppFlow.from_client_secrets_file(str(self.client_file), SCOPES)
        creds = flow.run_local_server(port=0, prompt="consent", access_type="offline")
        self.token_file.write_text(creds.to_json())
        self.token_file.chmod(0o600)
        print(f"saved {self.token_file}")

    def _creds(self):
        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
        except ImportError as exc:
            raise PublishError("install extras: pip install 'clipper[youtube]'", retryable=False) from exc
        if not self.token_file.exists():
            raise PublishError("no YouTube token; run `clipper auth youtube`", retryable=False)
        creds = Credentials.from_authorized_user_file(str(self.token_file), SCOPES)
        if not creds.valid:
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                self.token_file.write_text(creds.to_json())
            else:
                raise PublishError("YouTube token invalid; run `clipper auth youtube`", retryable=False)
        return creds

    def check(self) -> tuple[bool, str]:
        try:
            self._creds()
            return True, "ok"
        except Exception as exc:
            return False, str(exc)

    def publish(self, video: Path, copy: PostCopy) -> PublishResult:
        from googleapiclient.discovery import build
        from googleapiclient.errors import HttpError
        from googleapiclient.http import MediaFileUpload

        ycfg = self.cfg["publish"]["youtube"]
        tags = [h.lstrip("#") for h in copy.hashtags]
        title = copy.title if "#shorts" in copy.title.lower() else f"{copy.title} #Shorts"
        body = {
            "snippet": {
                "title": title[:100],
                "description": f"{copy.description}\n\n{' '.join(copy.hashtags)}"[:4900],
                "tags": tags,
                "categoryId": str(ycfg.get("category_id", "20")),
            },
            "status": {
                "privacyStatus": ycfg.get("privacy", "public"),
                "selfDeclaredMadeForKids": False,
                "containsSyntheticMedia": False,
            },
        }
        yt = build("youtube", "v3", credentials=self._creds(), cache_discovery=False)
        media = MediaFileUpload(str(video), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True)
        req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
        try:
            resp = None
            while resp is None:
                _, resp = req.next_chunk(num_retries=3)
        except HttpError as exc:
            status = getattr(exc.resp, "status", 0)
            text = str(exc)
            retryable = status >= 500 or status == 429
            if "quotaExceeded" in text or "uploadLimitExceeded" in text:
                retryable = False
            raise PublishError(f"YouTube upload failed ({status}): {text[:400]}", retryable) from exc
        vid = resp["id"]
        return PublishResult(vid, f"https://youtube.com/shorts/{vid}")
