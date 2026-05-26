import { useState, useEffect, useCallback, useRef } from 'react'
import { randomScrambleForEvent } from 'cubing/scramble'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import { useTimer } from '../hooks/useTimer'
import { computeStats } from '../utils/stats'
import { formatTime, formatSolveTime, formatInspection } from '../utils/time'
import type { Session, Solve } from '../types'

// ── Cube type → cubing.js event ID ───────────────────────────────────────────
const CUBE_EVENT: Record<string, string> = { '3x3': '333' }

// ── Scramble generation ───────────────────────────────────────────────────────
async function generateScramble(cubeType: string): Promise<string> {
  const event = CUBE_EVENT[cubeType] ?? '333'
  const scramble = await randomScrambleForEvent(event)
  return scramble.toString()
}

// ── Timer colour by phase / spacebar state ────────────────────────────────────
function timerColor(
  phase: string,
  spacebarState: string
): string {
  if (phase === 'running') return 'var(--text-primary)'
  if (spacebarState === 'ready') return 'var(--green)'
  if (spacebarState === 'holding') return 'var(--yellow)'
  if (phase === 'stopped') return 'var(--accent)'
  return 'var(--text-primary)'
}

export default function Timer(): JSX.Element {
  // ── App state ─────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [activeCubeType] = useState('3x3')
  const [solves, setSolves] = useState<Solve[]>([])
  const [scramble, setScramble] = useState('Generating scramble...')
  const [settings, setSettings] = useState({ inspection_enabled: 'true', timer_hold_ms: '550' })
  const [showNewSession, setShowNewSession] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')

  // Post-solve state
  const [lastSolveId, setLastSolveId] = useState<number | null>(null)
  const [pendingPenalty, setPendingPenalty] = useState<'none' | '+2' | 'dnf'>('none')
  const [comment, setComment] = useState('')
  const [showComment, setShowComment] = useState(false)

  // Inspection penalty carried from inspection phase into running
  const inspectionPenaltyRef = useRef<'none' | '+2' | 'dnf'>('none')

  // ── Load initial data ─────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const [allSettings, allSessions] = await Promise.all([
        window.api.getAllSettings(),
        window.api.getSessions()
      ])
      setSettings(allSettings as typeof settings)
      setSessions(allSessions)

      const sessionId = Number(allSettings.active_session_id)
      setActiveSessionId(sessionId || (allSessions[0]?.id ?? null))
    }
    init()
  }, [])

  // Load solves when session changes
  useEffect(() => {
    if (!activeSessionId) return
    window.api.getSolves({ sessionId: activeSessionId, cubeType: activeCubeType })
      .then(setSolves)
  }, [activeSessionId, activeCubeType])

  // Generate first scramble
  useEffect(() => {
    generateScramble(activeCubeType).then(setScramble)
  }, [activeCubeType])

  // ── Solve complete callback ───────────────────────────────────────────────
  const handleSolveComplete = useCallback(
    async (timeMs: number, timerPenalty: 'none' | '+2' | 'dnf') => {
      if (!activeSessionId) return
      // Combine timer penalty with any inspection penalty
      const pen =
        timerPenalty === 'dnf'
          ? 'dnf'
          : inspectionPenaltyRef.current === 'dnf'
          ? 'dnf'
          : inspectionPenaltyRef.current === '+2' || timerPenalty === '+2'
          ? '+2'
          : 'none'

      const solve = await window.api.createSolve({
        sessionId: activeSessionId,
        cubeType: activeCubeType,
        timeMs,
        scramble
      })
      if (pen !== 'none') {
        await window.api.updateSolvePenalty(solve.id, pen)
      }
      const savedSolve = { ...solve, penalty: pen }
      setSolves((prev) => [...prev, savedSolve])
      setLastSolveId(solve.id)
      setPendingPenalty(pen)
      setComment('')
      setShowComment(false)
    },
    [activeSessionId, activeCubeType, scramble]
  )

  // ── Reset callback (called when spacebar pressed on 'stopped') ────────────
  const handleReset = useCallback(() => {
    setLastSolveId(null)
    setPendingPenalty('none')
    setComment('')
    setShowComment(false)
    inspectionPenaltyRef.current = 'none'
    generateScramble(activeCubeType).then(setScramble)
  }, [activeCubeType])

  // ── Timer hook ────────────────────────────────────────────────────────────
  const {
    phase,
    spacebarState,
    displayMs,
    inspectionElapsed,
    inspectionPenalty,
    finalTimeMs,
    reset: resetTimer
  } = useTimer({
    inspectionEnabled: settings.inspection_enabled === 'true',
    holdThresholdMs: Number(settings.timer_hold_ms) || 550,
    onSolveComplete: handleSolveComplete,
    onReset: handleReset
  })

  // Keep inspection penalty ref in sync
  useEffect(() => {
    inspectionPenaltyRef.current = inspectionPenalty
  }, [inspectionPenalty])

  // ── Penalty updates (post-solve) ──────────────────────────────────────────
  const applyPenalty = useCallback(
    async (pen: 'none' | '+2' | 'dnf') => {
      if (!lastSolveId) return
      await window.api.updateSolvePenalty(lastSolveId, pen)
      setPendingPenalty(pen)
      setSolves((prev) =>
        prev.map((s) => (s.id === lastSolveId ? { ...s, penalty: pen } : s))
      )
    },
    [lastSolveId]
  )

  const saveComment = useCallback(async () => {
    if (!lastSolveId || !comment.trim()) return
    await window.api.updateSolveComment(lastSolveId, comment.trim())
  }, [lastSolveId, comment])

  const deleteLastSolve = useCallback(async () => {
    if (!lastSolveId) return
    await window.api.deleteSolve(lastSolveId)
    setSolves((prev) => prev.filter((s) => s.id !== lastSolveId))
    setLastSolveId(null)
    resetTimer()
    generateScramble(activeCubeType).then(setScramble)
  }, [lastSolveId, resetTimer, activeCubeType])

  // ── Session management ────────────────────────────────────────────────────
  const switchSession = useCallback(
    async (id: number) => {
      setActiveSessionId(id)
      await window.api.setSetting('active_session_id', String(id))
    },
    []
  )

  const createSession = useCallback(async () => {
    if (!newSessionName.trim()) return
    const s = await window.api.createSession(newSessionName.trim(), activeCubeType)
    setSessions((prev) => [s, ...prev])
    setActiveSessionId(s.id)
    setSolves([])
    setNewSessionName('')
    setShowNewSession(false)
    await window.api.setSetting('active_session_id', String(s.id))
  }, [newSessionName, activeCubeType])

  // ── Derived display values ────────────────────────────────────────────────
  const stats = computeStats(solves)
  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const recentSolves = [...solves].reverse().slice(0, 15)

  const { display: inspDisplay, penalty: inspPen } = formatInspection(inspectionElapsed)
  const isInspectionWarning = inspPen !== 'none'

  const timerDisplay = (() => {
    if (phase === 'inspection') return inspDisplay
    if (phase === 'stopped' && finalTimeMs !== null) {
      return formatSolveTime(finalTimeMs, pendingPenalty)
    }
    if (phase === 'running' || phase === 'stopped') return formatTime(displayMs)
    return formatTime(displayMs)
  })()

  const hintText = (() => {
    if (phase === 'inspection') {
      if (spacebarState === 'ready') return 'Release to start'
      if (spacebarState === 'holding') return 'Hold...'
      return 'Hold space to start timer'
    }
    if (phase === 'running') return 'Press space to stop'
    if (phase === 'stopped') return 'Press space for next solve'
    if (spacebarState === 'ready') return 'Release to start'
    if (spacebarState === 'holding') return 'Hold...'
    return 'Hold space to start'
  })()

  const color = phase === 'inspection' && isInspectionWarning
    ? 'var(--red)'
    : timerColor(phase, spacebarState)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          {/* Session selector */}
          <div style={s.selectorWrap}>
            <select
              style={s.select}
              value={activeSessionId ?? ''}
              onChange={(e) => switchSession(Number(e.target.value))}
            >
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} style={s.chevron} />
          </div>

          {/* Cube type */}
          <div style={{ ...s.selectorWrap, opacity: 0.6, pointerEvents: 'none' }}>
            <select style={s.select} value={activeCubeType} readOnly>
              <option value="3x3">3x3</option>
            </select>
            <ChevronDown size={12} style={s.chevron} />
          </div>
        </div>

        <div style={s.headerRight}>
          {showNewSession ? (
            <form
              style={s.newSessionForm}
              onSubmit={(e) => { e.preventDefault(); createSession() }}
            >
              <input
                autoFocus
                style={s.newSessionInput}
                placeholder="Session name"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setShowNewSession(false)}
              />
              <button type="submit" style={s.btnPrimary}>Create</button>
              <button type="button" style={s.btnGhost} onClick={() => setShowNewSession(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button style={s.btnGhost} onClick={() => setShowNewSession(true)}>
              <Plus size={14} />
              New session
            </button>
          )}
        </div>
      </div>

      {/* Main timer area */}
      <div style={s.timerArea}>
        {/* Scramble */}
        {phase !== 'running' && (
          <p style={s.scramble}>{scramble}</p>
        )}

        {/* Timer display */}
        <div style={s.timerWrap}>
          <span style={{ ...s.timerNumber, color, fontSize: timerFontSize(timerDisplay) }}>
            {timerDisplay}
          </span>
          <span style={s.hint}>{hintText}</span>
        </div>

        {/* Post-solve controls */}
        {phase === 'stopped' && lastSolveId !== null && (
          <div style={s.postSolve}>
            <div style={s.penaltyRow}>
              <button
                style={{ ...s.penBtn, ...(pendingPenalty === '+2' ? s.penBtnActive : {}) }}
                onClick={() => applyPenalty(pendingPenalty === '+2' ? 'none' : '+2')}
              >
                +2
              </button>
              <button
                style={{ ...s.penBtn, ...(pendingPenalty === 'dnf' ? s.penBtnActiveDnf : {}) }}
                onClick={() => applyPenalty(pendingPenalty === 'dnf' ? 'none' : 'dnf')}
              >
                DNF
              </button>
              <button style={{ ...s.penBtn, ...s.penBtnDanger }} onClick={deleteLastSolve}>
                <Trash2 size={13} />
              </button>
              <button style={s.btnGhost} onClick={() => setShowComment((v) => !v)}>
                {showComment ? 'Hide comment' : 'Add comment'}
              </button>
            </div>
            {showComment && (
              <textarea
                style={s.commentInput}
                placeholder="Add a note about this solve..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onBlur={saveComment}
                rows={2}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div style={s.bottomPanel}>
        {/* Stats */}
        <div style={s.statsPanel}>
          <StatsRow label="Single" current={stats.single} best={stats.bestSingle} />
          <StatsRow label="Ao5" current={stats.ao5} best={stats.bestAo5} />
          <StatsRow label="Ao12" current={stats.ao12} best={stats.bestAo12} />
          <div style={s.statsDivider} />
          <div style={s.statMeta}>
            <span style={s.statMetaLabel}>Session</span>
            <span style={s.statMetaValue}>{stats.count} solves</span>
          </div>
          {stats.sessionMean !== null && (
            <div style={s.statMeta}>
              <span style={s.statMetaLabel}>Mean</span>
              <span style={s.statMetaValue}>{formatTime(stats.sessionMean)}</span>
            </div>
          )}
        </div>

        {/* Solve list */}
        <div style={s.solveList}>
          {recentSolves.length === 0 ? (
            <p style={s.emptyList}>No solves yet. Hold space to start.</p>
          ) : (
            recentSolves.map((solve, i) => (
              <SolveRow
                key={solve.id}
                index={solves.length - i}
                solve={solve}
                isLast={solve.id === lastSolveId}
                onDelete={async () => {
                  await window.api.deleteSolve(solve.id)
                  setSolves((prev) => prev.filter((s) => s.id !== solve.id))
                  if (solve.id === lastSolveId) {
                    setLastSolveId(null)
                    resetTimer()
                  }
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatsRow({
  label,
  current,
  best
}: {
  label: string
  current: number | null
  best: number | null
}): JSX.Element {
  const fmt = (v: number | null) =>
    v === null ? '-' : !isFinite(v) ? 'DNF' : formatTime(v)

  return (
    <div style={s.statsRow}>
      <span style={s.statsLabel}>{label}</span>
      <span style={s.statsCurrent}>{fmt(current)}</span>
      <span style={s.statsBest}>{fmt(best)}</span>
    </div>
  )
}

function SolveRow({
  index,
  solve,
  isLast,
  onDelete
}: {
  index: number
  solve: Solve
  isLast: boolean
  onDelete: () => void
}): JSX.Element {
  const [hovered, setHovered] = useState(false)
  const time = formatSolveTime(solve.time_ms, solve.penalty)
  const penClass = solve.penalty === 'dnf' ? 'text-red' : solve.penalty === '+2' ? 'text-yellow' : ''

  return (
    <div
      style={{
        ...s.solveRow,
        background: isLast ? 'var(--accent-dim)' : hovered ? 'var(--bg-hover)' : 'transparent'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={s.solveIndex}>{index}.</span>
      <span style={{ ...s.solveTime, color: penColor(solve.penalty) }}>{time}</span>
      <span style={s.solveDate}>
        {new Date(solve.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      {hovered && (
        <button style={s.solveDelete} onClick={onDelete}>
          <Trash2 size={11} />
        </button>
      )}
    </div>
  )
}

function penColor(pen: string): string {
  if (pen === 'dnf') return 'var(--red)'
  if (pen === '+2') return 'var(--yellow)'
  return 'var(--text-primary)'
}

function timerFontSize(display: string): number {
  if (display.length <= 5) return 96
  if (display.length <= 7) return 80
  return 64
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
    gap: 12
  },
  headerLeft: { display: 'flex', gap: 8, alignItems: 'center' },
  headerRight: { display: 'flex', gap: 8, alignItems: 'center' },
  selectorWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center'
  },
  select: {
    appearance: 'none',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '5px 28px 5px 10px',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none'
  },
  chevron: {
    position: 'absolute',
    right: 8,
    pointerEvents: 'none',
    color: 'var(--text-secondary)'
  },
  newSessionForm: { display: 'flex', gap: 6, alignItems: 'center' },
  newSessionInput: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--accent)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '5px 10px',
    fontSize: 13,
    outline: 'none',
    width: 160
  },

  // Timer area
  timerArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 40px',
    gap: 16,
    minHeight: 0
  },
  scramble: {
    fontFamily: 'var(--font-mono)',
    fontSize: 15,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    maxWidth: 700,
    lineHeight: 1.6,
    letterSpacing: '0.5px'
  },
  timerWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12
  },
  timerNumber: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 300,
    lineHeight: 1,
    letterSpacing: '-2px',
    transition: 'color 0.1s, font-size 0.1s'
  },
  hint: {
    fontSize: 12,
    color: 'var(--text-muted)',
    letterSpacing: '0.3px'
  },

  // Post-solve
  postSolve: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8
  },
  penaltyRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  penBtn: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'background 0.1s, color 0.1s'
  },
  penBtnActive: {
    background: 'var(--yellow-dim)',
    border: '1px solid var(--yellow)',
    color: 'var(--yellow)'
  },
  penBtnActiveDnf: {
    background: 'var(--red-dim)',
    border: '1px solid var(--red)',
    color: 'var(--red)'
  },
  penBtnDanger: {
    color: 'var(--red)',
    borderColor: 'var(--red)'
  },
  commentInput: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
    resize: 'none',
    width: 360,
    fontFamily: 'var(--font-sans)'
  },

  // Bottom panel
  bottomPanel: {
    display: 'flex',
    borderTop: '1px solid var(--border-subtle)',
    height: 160,
    flexShrink: 0
  },

  // Stats
  statsPanel: {
    width: 280,
    borderRight: '1px solid var(--border-subtle)',
    padding: '12px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flexShrink: 0,
    overflow: 'hidden'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '52px 1fr 1fr',
    alignItems: 'center',
    padding: '3px 0'
  },
  statsLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statsCurrent: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    color: 'var(--text-primary)',
    textAlign: 'right'
  },
  statsBest: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--accent)',
    textAlign: 'right'
  },
  statsDivider: {
    height: 1,
    background: 'var(--border-subtle)',
    margin: '6px 0'
  },
  statMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0'
  },
  statMetaLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statMetaValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text-secondary)'
  },

  // Solve list
  solveList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0'
  },
  emptyList: {
    color: 'var(--text-muted)',
    fontSize: 13,
    padding: '16px 20px'
  },
  solveRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 16px',
    gap: 8,
    borderRadius: 4,
    margin: '0 4px',
    transition: 'background 0.1s'
  },
  solveIndex: {
    fontSize: 11,
    color: 'var(--text-muted)',
    width: 28,
    textAlign: 'right',
    flexShrink: 0
  },
  solveTime: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    fontWeight: 500,
    flex: 1
  },
  solveDate: {
    fontSize: 11,
    color: 'var(--text-muted)'
  },
  solveDelete: {
    background: 'none',
    border: 'none',
    color: 'var(--red)',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center'
  },

  // Buttons
  btnPrimary: {
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: '#fff',
    padding: '5px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  },
  btnGhost: {
    background: 'none',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    padding: '5px 12px',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  }
}
