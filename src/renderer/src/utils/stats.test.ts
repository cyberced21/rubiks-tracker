import { describe, it, expect } from 'vitest'
import { aoN, moN, bestSingle, bestAoN, computeStats } from './stats'
import type { Solve } from '../types'

function makeSolve(timeMs: number, penalty: 'none' | '+2' | 'dnf' = 'none', id = 1): Solve {
  return {
    id,
    session_id: 1,
    cube_type: '3x3',
    scramble: '',
    time_ms: timeMs,
    penalty,
    created_at: Date.now(),
    note: null,
  }
}

describe('aoN', () => {
  it('returns null when not enough solves', () => {
    const solves = [makeSolve(5000), makeSolve(6000)]
    expect(aoN(solves, 5)).toBeNull()
  })

  it('calculates ao5 by trimming best and worst', () => {
    // Solves: 5000, 6000, 7000, 8000, 9000
    // Trim best (5000) and worst (9000), average middle: (6000+7000+8000)/3 = 7000
    const solves = [5000, 6000, 7000, 8000, 9000].map((t, i) => makeSolve(t, 'none', i))
    expect(aoN(solves, 5)).toBe(7000)
  })

  it('returns Infinity when 2+ DNFs in window', () => {
    const solves = [
      makeSolve(5000), makeSolve(6000), makeSolve(7000, 'dnf'),
      makeSolve(8000, 'dnf'), makeSolve(9000),
    ]
    expect(aoN(solves, 5)).toBe(Infinity)
  })

  it('handles single DNF correctly', () => {
    // 5000, 6000, 7000, 8000, DNF
    // DNF is worst (trimmed), 5000 is best (trimmed), avg of 6000,7000,8000 = 7000
    const solves = [
      makeSolve(5000, 'none', 0), makeSolve(6000, 'none', 1),
      makeSolve(7000, 'none', 2), makeSolve(8000, 'none', 3),
      makeSolve(9000, 'dnf', 4),
    ]
    expect(aoN(solves, 5)).toBe(7000)
  })
})

describe('moN', () => {
  it('returns null when not enough solves', () => {
    expect(moN([makeSolve(5000)], 3)).toBeNull()
  })

  it('calculates mean of last N solves', () => {
    const solves = [5000, 6000, 7000].map((t, i) => makeSolve(t, 'none', i))
    expect(moN(solves, 3)).toBe(6000)
  })

  it('returns Infinity if any DNF', () => {
    const solves = [makeSolve(5000), makeSolve(6000), makeSolve(7000, 'dnf')]
    expect(moN(solves, 3)).toBe(Infinity)
  })
})

describe('bestSingle', () => {
  it('returns null for empty array', () => {
    expect(bestSingle([])).toBeNull()
  })

  it('returns the fastest effective time', () => {
    const solves = [makeSolve(8000), makeSolve(5000), makeSolve(7000)]
    expect(bestSingle(solves)).toBe(5000)
  })

  it('accounts for +2 penalty', () => {
    const solves = [makeSolve(3000, '+2'), makeSolve(5500)]
    // 3000+2000=5000 vs 5500 → 5000 is best
    expect(bestSingle(solves)).toBe(5000)
  })
})

describe('bestAoN', () => {
  it('returns null when not enough solves', () => {
    const solves = [makeSolve(5000), makeSolve(6000)]
    expect(bestAoN(solves, 5)).toBeNull()
  })

  it('finds the best ao5 across all windows', () => {
    // Window 1: 10000,9000,8000,7000,6000 → trim 6k,10k → avg 8000
    // Window 2: 9000,8000,7000,6000,5000 → trim 5k,9k → avg 7000
    const solves = [10000, 9000, 8000, 7000, 6000, 5000].map((t, i) => makeSolve(t, 'none', i))
    expect(bestAoN(solves, 5)).toBe(7000)
  })
})

describe('computeStats', () => {
  it('returns zeroed stats for empty solves', () => {
    const stats = computeStats([])
    expect(stats.count).toBe(0)
    expect(stats.single).toBeNull()
    expect(stats.bestSingle).toBeNull()
    expect(stats.ao5).toBeNull()
  })

  it('computes stats for a set of solves', () => {
    const solves = [5000, 6000, 7000, 8000, 9000].map((t, i) => makeSolve(t, 'none', i))
    const stats = computeStats(solves)
    expect(stats.count).toBe(5)
    expect(stats.single).toBe(9000) // last solve
    expect(stats.bestSingle).toBe(5000)
    expect(stats.ao5).toBe(7000)
  })
})
