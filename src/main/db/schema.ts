import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { runMigrations } from './migrations'

let db: Database.Database

export function getDb(): Database.Database {
  return db
}

export function getDbPath(): string {
  return join(app.getPath('userData'), 'rubiks-tracker.db')
}

export function initDatabase(): void {
  const dbPath = getDbPath()
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
}
