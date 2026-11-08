"""SQLite state: every stage is resumable after a crash, reboot or power cut."""

from __future__ import annotations

import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    source_id TEXT NOT NULL,
    license TEXT NOT NULL,
    credit TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',      -- new | detected | failed | deleted
    duration REAL,
    added_at TEXT NOT NULL,
    processed_at TEXT,
    error TEXT
);
CREATE TABLE IF NOT EXISTS clips (
    id INTEGER PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES files(id),
    start REAL NOT NULL,
    end REAL NOT NULL,
    score REAL NOT NULL,
    features TEXT DEFAULT '{}',
    transcript TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'candidate', -- candidate | rendered | rejected | failed | deleted
    render_path TEXT,
    hook TEXT, title TEXT, description TEXT, hashtags TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    rendered_at TEXT,
    error TEXT
);
CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY,
    platform TEXT NOT NULL,
    plan_date TEXT NOT NULL,
    due_at TEXT NOT NULL,                     -- UTC ISO-8601
    status TEXT NOT NULL DEFAULT 'planned',   -- planned | posted | skipped | failed
    clip_id INTEGER,
    attempts INTEGER NOT NULL DEFAULT 0,
    next_try_at TEXT,
    note TEXT,
    UNIQUE(platform, due_at)
);
CREATE TABLE IF NOT EXISTS plans (
    platform TEXT NOT NULL,
    plan_date TEXT NOT NULL,
    PRIMARY KEY (platform, plan_date)
);
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY,
    clip_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    remote_id TEXT,
    url TEXT,
    dry_run INTEGER NOT NULL DEFAULT 0,
    posted_at TEXT NOT NULL,
    UNIQUE(clip_id, platform)
);
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT);
CREATE INDEX IF NOT EXISTS idx_clips_status ON clips(status);
CREATE INDEX IF NOT EXISTS idx_slots_due ON slots(status, due_at);
"""


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds")


def parse_iso(s: str) -> datetime:
    return datetime.fromisoformat(s)


class DB:
    """Thin wrapper; one connection per thread (sqlite3 objects are not thread-safe)."""

    def __init__(self, path: Path | str):
        self.path = str(path)
        if self.path != ":memory:":
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self._local = threading.local()
        self._shared = None
        if self.path == ":memory:":
            self._shared = self._connect()
        self.conn.executescript(SCHEMA)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path, timeout=30, check_same_thread=self.path != ":memory:")
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    @property
    def conn(self) -> sqlite3.Connection:
        if self._shared is not None:
            return self._shared
        c = getattr(self._local, "conn", None)
        if c is None:
            c = self._local.conn = self._connect()
        return c

    def execute(self, sql: str, params=()) -> sqlite3.Cursor:
        with self.conn:
            return self.conn.execute(sql, params)

    def one(self, sql: str, params=()):
        return self.conn.execute(sql, params).fetchone()

    def all(self, sql: str, params=()):
        return self.conn.execute(sql, params).fetchall()

    # -- kv -------------------------------------------------------------
    def get(self, key: str, default=None):
        row = self.one("SELECT value FROM kv WHERE key=?", (key,))
        return json.loads(row["value"]) if row else default

    def set(self, key: str, value) -> None:
        self.execute("INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                     (key, json.dumps(value)))

    # -- files ----------------------------------------------------------
    def add_file(self, path: str, source_id: str, license: str, credit: str = "") -> int | None:
        cur = self.execute(
            "INSERT OR IGNORE INTO files(path, source_id, license, credit, added_at) VALUES(?,?,?,?,?)",
            (path, source_id, license, credit, iso(utcnow())),
        )
        return cur.lastrowid if cur.rowcount else None

    def has_file(self, path: str) -> bool:
        return self.one("SELECT 1 FROM files WHERE path=?", (path,)) is not None
