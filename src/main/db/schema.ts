import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database

export function getDb(): Database.Database {
  return db
}

export function initDatabase(): void {
  const dbPath = join(app.getPath('userData'), 'rubiks-tracker.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations()
}

function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      cube_type  TEXT    NOT NULL DEFAULT '3x3',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS solves (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      cube_type  TEXT    NOT NULL DEFAULT '3x3',
      time_ms    INTEGER NOT NULL,
      penalty    TEXT    NOT NULL DEFAULT 'none'
                         CHECK(penalty IN ('none', '+2', 'dnf')),
      scramble   TEXT    NOT NULL,
      comment    TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_solves_session   ON solves(session_id);
    CREATE INDEX IF NOT EXISTS idx_solves_cube_type ON solves(cube_type);
    CREATE INDEX IF NOT EXISTS idx_solves_created   ON solves(created_at);

    CREATE TABLE IF NOT EXISTS algorithm_progress (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      cube_type         TEXT    NOT NULL DEFAULT '3x3',
      algorithm_set     TEXT    NOT NULL,
      case_id           TEXT    NOT NULL,
      rating            TEXT    NOT NULL DEFAULT 'unrated'
                                CHECK(rating IN ('easy', 'hard', 'again', 'unrated')),
      is_favorite       INTEGER NOT NULL DEFAULT 0,
      last_practiced_at INTEGER,
      UNIQUE(cube_type, case_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('inspection_enabled',    'true');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('timer_hold_ms',         '550');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('active_cube_type',      '3x3');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('active_session_id',     '1');
  `)

  // Ensure a default session exists
  const count = (db.prepare('SELECT COUNT(*) as c FROM sessions').get() as { c: number }).c
  if (count === 0) {
    db.prepare(
      'INSERT INTO sessions (name, cube_type, created_at) VALUES (?, ?, ?)'
    ).run('Default', '3x3', Date.now())

    db.prepare("UPDATE settings SET value = (SELECT id FROM sessions LIMIT 1) WHERE key = 'active_session_id'").run()
  }
}
