import { getDb } from './schema'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Session {
  id: number
  name: string
  cube_type: string
  created_at: number
}

export interface Solve {
  id: number
  session_id: number
  cube_type: string
  time_ms: number
  penalty: 'none' | '+2' | 'dnf'
  scramble: string
  comment: string | null
  created_at: number
}

export interface CreateSolveInput {
  sessionId: number
  cubeType: string
  timeMs: number
  scramble: string
  comment?: string
}

export interface SolveFilters {
  sessionId?: number
  cubeType?: string
  dateFrom?: number
  dateTo?: number
  limit?: number
  offset?: number
}

export interface AlgorithmProgress {
  id: number
  cube_type: string
  algorithm_set: string
  case_id: string
  rating: 'easy' | 'hard' | 'again' | 'unrated'
  is_favorite: number
  last_practiced_at: number | null
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function createSession(name: string, cubeType: string): Session {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO sessions (name, cube_type, created_at) VALUES (?, ?, ?)'
  )
  const result = stmt.run(name, cubeType, Date.now())
  return getSessionById(result.lastInsertRowid as number)!
}

export function getSessionById(id: number): Session | undefined {
  return getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | undefined
}

export function getSessions(cubeType?: string): Session[] {
  const db = getDb()
  if (cubeType) {
    return db.prepare('SELECT * FROM sessions WHERE cube_type = ? ORDER BY created_at DESC').all(cubeType) as Session[]
  }
  return db.prepare('SELECT * FROM sessions ORDER BY created_at DESC').all() as Session[]
}

export function deleteSession(id: number): void {
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id)
}

// ── Solves ───────────────────────────────────────────────────────────────────

export function createSolve(input: CreateSolveInput): Solve {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO solves (session_id, cube_type, time_ms, penalty, scramble, comment, created_at)
    VALUES (?, ?, ?, 'none', ?, ?, ?)
  `)
  const result = stmt.run(
    input.sessionId,
    input.cubeType,
    input.timeMs,
    input.scramble,
    input.comment ?? null,
    Date.now()
  )
  return getSolveById(result.lastInsertRowid as number)!
}

export function getSolveById(id: number): Solve | undefined {
  return getDb().prepare('SELECT * FROM solves WHERE id = ?').get(id) as Solve | undefined
}

export function getSolves(filters: SolveFilters): Solve[] {
  const db = getDb()
  const conditions: string[] = []
  const params: (number | string)[] = []

  if (filters.sessionId !== undefined) {
    conditions.push('session_id = ?')
    params.push(filters.sessionId)
  }
  if (filters.cubeType) {
    conditions.push('cube_type = ?')
    params.push(filters.cubeType)
  }
  if (filters.dateFrom !== undefined) {
    conditions.push('created_at >= ?')
    params.push(filters.dateFrom)
  }
  if (filters.dateTo !== undefined) {
    conditions.push('created_at <= ?')
    params.push(filters.dateTo)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = filters.limit ? `LIMIT ${filters.limit}` : ''
  const offset = filters.offset ? `OFFSET ${filters.offset}` : ''

  const sql = `SELECT * FROM solves ${where} ORDER BY created_at ASC ${limit} ${offset}`
  return db.prepare(sql).all(...params) as Solve[]
}

export function updateSolvePenalty(id: number, penalty: 'none' | '+2' | 'dnf'): void {
  getDb().prepare('UPDATE solves SET penalty = ? WHERE id = ?').run(penalty, id)
}

export function updateSolveComment(id: number, comment: string): void {
  getDb().prepare('UPDATE solves SET comment = ? WHERE id = ?').run(comment, id)
}

export function deleteSolve(id: number): void {
  getDb().prepare('DELETE FROM solves WHERE id = ?').run(id)
}

// ── Algorithm Progress ────────────────────────────────────────────────────────

export function getAlgorithmProgress(cubeType: string): AlgorithmProgress[] {
  return getDb()
    .prepare('SELECT * FROM algorithm_progress WHERE cube_type = ?')
    .all(cubeType) as AlgorithmProgress[]
}

export function upsertAlgorithmProgress(
  cubeType: string,
  algorithmSet: string,
  caseId: string,
  rating: string,
  isFavorite: boolean
): void {
  getDb().prepare(`
    INSERT INTO algorithm_progress (cube_type, algorithm_set, case_id, rating, is_favorite, last_practiced_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(cube_type, case_id) DO UPDATE SET
      rating = excluded.rating,
      is_favorite = excluded.is_favorite,
      last_practiced_at = excluded.last_practiced_at
  `).run(cubeType, algorithmSet, caseId, rating, isFavorite ? 1 : 0, Date.now())
}

// ── Settings ─────────────────────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}
