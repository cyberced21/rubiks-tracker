import Database from 'better-sqlite3'

export interface Migration {
  version: number
  description: string
  up: (db: Database.Database) => void
}

/**
 * All migrations in order. Each migration runs once.
 * To add a new migration, append to this array with the next version number.
 *
 * IMPORTANT: Never modify an existing migration — always add a new one.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial schema — sessions, solves, algorithm_progress, settings',
    up: (db) => {
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
        db.prepare(
          "UPDATE settings SET value = (SELECT id FROM sessions LIMIT 1) WHERE key = 'active_session_id'"
        ).run()
      }
    }
  },
  // ── Add new migrations below this line ──────────────────────────────────────
  // {
  //   version: 2,
  //   description: 'Add notes column to solves',
  //   up: (db) => {
  //     db.exec(`ALTER TABLE solves ADD COLUMN notes TEXT`)
  //   }
  // },
]

/**
 * Run all pending migrations in order inside a transaction.
 * Tracks applied versions in a `_migrations` meta-table.
 */
export function runMigrations(db: Database.Database): void {
  // Create the migration tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version     INTEGER PRIMARY KEY,
      description TEXT    NOT NULL,
      applied_at  INTEGER NOT NULL
    )
  `)

  const applied = new Set(
    (db.prepare('SELECT version FROM _migrations').all() as { version: number }[])
      .map((r) => r.version)
  )

  const pending = migrations.filter((m) => !applied.has(m.version))
  if (pending.length === 0) return

  const insertMigration = db.prepare(
    'INSERT INTO _migrations (version, description, applied_at) VALUES (?, ?, ?)'
  )

  const runAll = db.transaction(() => {
    for (const migration of pending) {
      console.log(`[migrations] Running v${migration.version}: ${migration.description}`)
      migration.up(db)
      insertMigration.run(migration.version, migration.description, Date.now())
    }
  })

  runAll()
  console.log(`[migrations] Applied ${pending.length} migration(s)`)
}
