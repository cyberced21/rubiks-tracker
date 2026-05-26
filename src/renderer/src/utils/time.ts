/** Format a raw millisecond value into a display string: "12.34" or "1:23.45" */
export function formatTime(ms: number): string {
  if (!isFinite(ms)) return 'DNF'
  if (ms < 60_000) {
    return (ms / 1000).toFixed(2)
  }
  const minutes = Math.floor(ms / 60_000)
  const secs = (ms % 60_000) / 1000
  return `${minutes}:${secs.toFixed(2).padStart(5, '0')}`
}

/** Returns effective time in ms (+2 → +2000, DNF → Infinity) */
export function effectiveTime(timeMs: number, penalty: 'none' | '+2' | 'dnf'): number {
  if (penalty === 'dnf') return Infinity
  if (penalty === '+2') return timeMs + 2000
  return timeMs
}

/** Format a time with penalty suffix for display in a solve list */
export function formatSolveTime(timeMs: number, penalty: 'none' | '+2' | 'dnf'): string {
  if (penalty === 'dnf') return 'DNF'
  const t = penalty === '+2' ? timeMs + 2000 : timeMs
  return formatTime(t) + (penalty === '+2' ? '+' : '')
}

/**
 * Given inspection elapsed ms, return the display string and current penalty state.
 * WCA: 15-17s = +2, 17s+ = DNF
 */
export function formatInspection(elapsedMs: number): {
  display: string
  penalty: 'none' | '+2' | 'dnf'
} {
  if (elapsedMs >= 17_000) return { display: 'DNF', penalty: 'dnf' }
  if (elapsedMs >= 15_000) return { display: '+2', penalty: '+2' }
  const remaining = Math.ceil((15_000 - elapsedMs) / 1000)
  return { display: String(Math.max(remaining, 1)), penalty: 'none' }
}
