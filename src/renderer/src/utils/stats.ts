import type { Solve, Session } from '../types'
import { effectiveTime } from './time'

// ── Leaderboard computation types ─────────────────────────────────────────────

export interface SingleEntry {
  rank: number
  solve: Solve
  session: Session | undefined
  effectiveTimeMs: number
}

export interface AoNEntry {
  rank: number
  ao: number
  solves: Solve[]           // the N solves in this window
  droppedBest: Solve        // the one trimmed as best
  droppedWorst: Solve       // the one trimmed as worst
  session: Session | undefined
  endDate: number
}

export interface SessionEntry {
  rank: number
  session: Session
  count: number
  mean: number | null
  bestSingle: number | null
  ao5: number | null
  ao12: number | null
  firstSolve: number
  lastSolve: number
}

/**
 * Average of N: trim 1 best + 1 worst, average the rest.
 * Returns Infinity if 2+ DNFs, null if not enough solves.
 */
export function aoN(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null
  const last = solves.slice(-n)
  const times = last.map((s) => effectiveTime(s.time_ms, s.penalty))
  const dnfCount = times.filter((t) => !isFinite(t)).length
  if (dnfCount > 1) return Infinity
  const sorted = [...times].sort((a, b) => a - b)
  // Remove best (index 0) and worst (last index)
  const trimmed = sorted.slice(1, -1)
  if (trimmed.some((t) => !isFinite(t))) return Infinity
  return trimmed.reduce((sum, t) => sum + t, 0) / trimmed.length
}

/** Mean of N (no trimming) — used for Mo3. Null if not enough solves. */
export function moN(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null
  const last = solves.slice(-n)
  const times = last.map((s) => effectiveTime(s.time_ms, s.penalty))
  if (times.some((t) => !isFinite(t))) return Infinity
  return times.reduce((sum, t) => sum + t, 0) / times.length
}

/** Best single solve (effective time). Null if no solves. */
export function bestSingle(solves: Solve[]): number | null {
  if (solves.length === 0) return null
  const times = solves.map((s) => effectiveTime(s.time_ms, s.penalty))
  return Math.min(...times)
}

/** Best AoN across all windows in the solve list. Null if not enough solves. */
export function bestAoN(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null
  let best: number | null = null
  for (let i = n; i <= solves.length; i++) {
    const window = solves.slice(i - n, i)
    const avg = aoN(window, n)
    if (avg !== null) {
      if (best === null || avg < best) best = avg
    }
  }
  return best
}

export interface SessionStats {
  single: number | null      // last solve effective time
  bestSingle: number | null
  mo3: number | null
  ao5: number | null
  bestAo5: number | null
  ao12: number | null
  bestAo12: number | null
  ao100: number | null
  sessionMean: number | null
  count: number
}

export function computeStats(solves: Solve[]): SessionStats {
  const validSolves = solves.filter((s) => s.penalty !== 'dnf')

  const lastSolve = solves.at(-1)
  const single = lastSolve
    ? effectiveTime(lastSolve.time_ms, lastSolve.penalty)
    : null

  const mean =
    validSolves.length === 0
      ? null
      : validSolves.reduce((sum, s) => sum + s.time_ms, 0) / validSolves.length

  return {
    single,
    bestSingle: bestSingle(solves),
    mo3: moN(solves, 3),
    ao5: aoN(solves, 5),
    bestAo5: bestAoN(solves, 5),
    ao12: aoN(solves, 12),
    bestAo12: bestAoN(solves, 12),
    ao100: aoN(solves, 100),
    sessionMean: mean,
    count: solves.length
  }
}

// ── Leaderboard builders ──────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: (t: T) => string | number): Map<string | number, T[]> {
  const map = new Map<string | number, T[]>()
  for (const item of arr) {
    const k = key(item)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(item)
  }
  return map
}

export function buildSingleLeaderboard(
  solves: Solve[],
  sessions: Session[]
): SingleEntry[] {
  const sessionMap = new Map(sessions.map((s) => [s.id, s]))

  const entries: SingleEntry[] = solves
    .map((solve) => ({
      rank: 0,
      solve,
      session: sessionMap.get(solve.session_id),
      effectiveTimeMs: effectiveTime(solve.time_ms, solve.penalty)
    }))
    .filter((e) => isFinite(e.effectiveTimeMs))
    .sort((a, b) => a.effectiveTimeMs - b.effectiveTimeMs)

  entries.forEach((e, i) => { e.rank = i + 1 })
  return entries
}

export function buildAoNLeaderboard(
  solves: Solve[],
  sessions: Session[],
  n: number
): AoNEntry[] {
  const sessionMap = new Map(sessions.map((s) => [s.id, s]))
  const bySession = groupBy(solves, (s) => s.session_id)
  const entries: AoNEntry[] = []

  for (const [sessionId, sessionSolves] of bySession) {
    const sorted = [...sessionSolves].sort((a, b) => a.created_at - b.created_at)
    for (let i = n - 1; i < sorted.length; i++) {
      const window = sorted.slice(i - n + 1, i + 1)
      const times = window.map((s) => ({ solve: s, t: effectiveTime(s.time_ms, s.penalty) }))
      const dnfCount = times.filter((x) => !isFinite(x.t)).length
      if (dnfCount > 1) continue

      const sortedByTime = [...times].sort((a, b) => {
        if (!isFinite(a.t) && !isFinite(b.t)) return 0
        if (!isFinite(a.t)) return 1
        if (!isFinite(b.t)) return -1
        return a.t - b.t
      })
      const droppedBest = sortedByTime[0].solve
      const droppedWorst = sortedByTime[sortedByTime.length - 1].solve
      const middle = sortedByTime.slice(1, -1)
      if (middle.some((x) => !isFinite(x.t))) continue
      const ao = middle.reduce((sum, x) => sum + x.t, 0) / middle.length

      entries.push({
        rank: 0,
        ao,
        solves: window,
        droppedBest,
        droppedWorst,
        session: sessionMap.get(Number(sessionId)),
        endDate: window[window.length - 1].created_at
      })
    }
  }

  entries.sort((a, b) => a.ao - b.ao)
  entries.forEach((e, i) => { e.rank = i + 1 })
  return entries
}

export function buildSessionLeaderboard(
  solves: Solve[],
  sessions: Session[]
): SessionEntry[] {
  const bySession = groupBy(solves, (s) => s.session_id)
  const entries: SessionEntry[] = []

  for (const session of sessions) {
    const sessionSolves = (bySession.get(session.id) ?? []).sort(
      (a, b) => a.created_at - b.created_at
    )
    if (sessionSolves.length === 0) continue

    const valid = sessionSolves.filter((s) => s.penalty !== 'dnf')
    const mean =
      valid.length === 0
        ? null
        : valid.reduce((sum, s) => sum + s.time_ms, 0) / valid.length

    entries.push({
      rank: 0,
      session,
      count: sessionSolves.length,
      mean,
      bestSingle: bestSingle(sessionSolves),
      ao5: bestAoN(sessionSolves, 5),
      ao12: bestAoN(sessionSolves, 12),
      firstSolve: sessionSolves[0].created_at,
      lastSolve: sessionSolves[sessionSolves.length - 1].created_at
    })
  }

  entries.sort((a, b) => {
    if (a.mean === null && b.mean === null) return 0
    if (a.mean === null) return 1
    if (b.mean === null) return -1
    return a.mean - b.mean
  })
  entries.forEach((e, i) => { e.rank = i + 1 })
  return entries
}
