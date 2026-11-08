# Clipper — GTA VI shorts pipeline for the Mac mini

Turns your own gameplay recordings into vertical shorts, then posts them to
YouTube Shorts, TikTok and Instagram Reels on a steady, human-shaped daily
schedule. It runs unattended as a launchd service.

```
 capture (PS5/Xbox → capture card → OBS)          ~/Clipper/inbox/*.mp4
        │
        ▼
 ingest ── licence gate (owned / permission+evidence / cc-by)
        ▼
 detect ── loudness spikes · sudden rises · scene-change density   (hours of footage → shortlist, CPU only)
        ▼
 rerank ── speech-to-text on the shortlist only · reaction keywords · Claude virality score
        ▼
 render ── 1080×1920, blurred-fill 9:16, hook banner, word captions, −14 LUFS, VideoToolbox H.264
        ▼
 queue  ── SQLite: every stage resumes after crash / reboot / power cut
        ▼
 cadence ─ 3–6 posts/day/platform, evening-weighted, ≥70 min apart, never on :00,
           weekend + launch-surge boost, slows down when the backlog runs thin
        ▼
 publish ─ official APIs only: YouTube Data API · TikTok Content Posting API · Instagram Graph API
```

## Why the sources are restricted

The pipeline only processes footage it can legally monetise:

| licence | what it means | required |
|---|---|---|
| `owned` | you recorded it | — |
| `permission` | another creator gave you **written** permission to clip their VODs (clipping deals, agencies) | `evidence:` file + `credit:` |
| `cc-by` | Creative Commons Attribution footage | `credit:` |

There is deliberately no "scrape trending GTA clips" source. Reposting
other people's clips is copyright infringement and a fast route to strikes. It
also earns nothing: YouTube's reused/inauthentic-content rules and TikTok's
unoriginal-content rules exclude it from monetisation. Rockstar/Take-Two allow
monetised videos of **your own** gameplay, which is what this pipeline is
built around.

Two practical rules that protect the channel:

* **Turn the in-game radio down or off while recording.** GTA's licensed
  music triggers Content ID claims, which send your Shorts revenue to the label.
* **Talk while you play.** Your reactions are the best highlight signal (put the mic on its own
  OBS track), and commentary is what makes the clips clearly *yours* to the monetisation reviewers.

## Install on the Mac mini

```bash
git clone <this repo> ~/singhstudio && cd ~/singhstudio/_clipper
./macos/install.sh --power        # brew deps, venv, launchd agent, never-sleep + auto-restart after power loss
```

Then:

1. **Auto login**: System Settings → Users & Groups → log in automatically (the
   agent runs in your user session).
2. **OBS**: record to `~/Clipper/inbox`, MP4/MKV, 1080p60; Output → Recording →
   Audio tracks 1 (game) + 2 (mic). Split recordings into one file per session or per hour.
3. Edit `~/Clipper/config.yaml` (audience timezone, handle watermark, platforms).
4. Claude copywriting (optional, a fraction of a cent per clip): save your API key to
   `~/Clipper/secrets/anthropic_api_key` (`chmod 600`). Without it, template copy is used.
   Requests send `fallbacks: "default"` so a declined request is retried on a fallback model.
5. Credentials (see the docstrings in `clipper/publishers/*.py` for exact steps):
   * YouTube: OAuth desktop client JSON → `secrets/youtube_client_secret.json`, then `clipper auth youtube`.
   * TikTok: app keys → `secrets/tiktok_app.json`, then `clipper auth tiktok`.
   * Instagram: long-lived token → `secrets/instagram_token.json`.
6. `~/Clipper/.venv/bin/clipper doctor` until everything is green.
7. Leave `publish.dry_run: true` for a day. Watch the renders in `~/Clipper/renders`
   and the would-be posts in `~/Clipper/state/dry_run_posts.jsonl`. Then set it to `false`.

## Platform gates you have to clear

| platform | gate | until cleared |
|---|---|---|
| YouTube | API project audit (YouTube API Services compliance form) | uploads are forced **private** |
| YouTube | default quota 10k units/day | ≈6 uploads/day; keep `max_per_day ≤ 6` or request more |
| TikTok | Content Posting API app audit for Direct Post | posts are private; use `mode: inbox` (drafts you tap to publish) |
| Instagram | professional account + `instagram_content_publish` | publisher disabled; 50 API posts / 24h cap |

## Commands

```
clipper plan --days 7     # preview the posting calendar
clipper process FILE      # run one recording through detect+render right now
clipper status            # backlog, upcoming slots, recent posts, heartbeat
clipper doctor            # environment + credential checks
clipper once              # single pass of everything, then exit
clipper run               # the service (launchd runs this)
```

Logs: `~/Clipper/logs/clipper.log`. Phone alerts and a daily digest are sent
through [ntfy](https://ntfy.sh) when `notify.ntfy_topic` is set (failures,
low disk, empty backlog).

## Keeping it live

* launchd `KeepAlive` restarts the process on any exit; `caffeinate` holds the
  Mac awake; `pmset autorestart` brings it back after a power cut.
* Posting and rendering run on separate threads, so a long render never makes a post late.
* If the Mac was offline, missed slots older than 90 min are skipped, not posted in a burst.
* When the backlog gets low, the daily count drops (`runway_days`) so the
  channel keeps posting instead of emptying the queue and going silent.
* Low disk pauses ingest and render and sends you an alert. Raw recordings are
  never deleted unless you set `ingest.delete_source_after_days`.

The real throughput limit is footage: at 8 clips per hour of gameplay, 3–5
posts a day on each platform needs about 1–2 hours of recorded play per day.

## Tests

```bash
pip install -e '.[dev]' && pytest      # unit tests + synthetic-footage end-to-end (needs ffmpeg)
```
