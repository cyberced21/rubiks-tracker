// ── Domain types (mirror main-process DB types for the renderer) ─────────────

export type CubeType = '3x3' | '2x2' | '4x4' | 'pyraminx' | 'megaminx'

export type Penalty = 'none' | '+2' | 'dnf'

export type AlgorithmRating = 'easy' | 'hard' | 'again' | 'unrated'

export interface Session {
  id: number
  name: string
  cube_type: CubeType
  created_at: number
}

export interface Solve {
  id: number
  session_id: number
  cube_type: CubeType
  time_ms: number
  penalty: Penalty
  scramble: string
  comment: string | null
  created_at: number
}

export interface AlgorithmProgress {
  id: number
  cube_type: CubeType
  algorithm_set: string
  case_id: string
  rating: AlgorithmRating
  is_favorite: number
  last_practiced_at: number | null
}

export interface AppSettings {
  inspection_enabled: string    // 'true' | 'false'
  timer_hold_ms: string         // milliseconds as string
  active_cube_type: CubeType
  active_session_id: string     // number as string
}

// ── Timer state ───────────────────────────────────────────────────────────────

export type TimerPhase =
  | 'idle'        // waiting to start
  | 'holding'     // spacebar held, waiting for threshold
  | 'ready'       // threshold reached, release to start
  | 'inspection'  // 15s inspection countdown
  | 'running'     // timer counting up
  | 'stopped'     // just finished, showing result

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface SolveStats {
  best: number | null
  mo3: number | null
  ao5: number | null
  ao12: number | null
  ao100: number | null
  sessionMean: number | null
  count: number
}

// ── Algorithm types ───────────────────────────────────────────────────────────

export type AlgorithmSet = 'OLL' | 'PLL' | 'F2L' | 'beginners'

export interface AlgorithmCase {
  id: string          // e.g. 'OLL-1', 'PLL-Aa'
  set: AlgorithmSet
  name: string        // human readable name
  algorithms: string[] // primary + alternatives
  svgPattern?: string  // SVG top-face pattern
}
