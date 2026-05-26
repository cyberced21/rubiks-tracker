import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react'
import {
  buildSingleLeaderboard,
  buildAoNLeaderboard,
  buildSessionLeaderboard,
  type SingleEntry,
  type AoNEntry,
  type SessionEntry
} from '../utils/stats'
import { formatTime, formatSolveTime, effectiveTime } from '../utils/time'
import type { Solve, Session } from '../types'

type Tab = 'single' | 'ao5' | 'ao12' | 'session'

interface DatePreset {
  label: string
  days: number | null
}

const DATE_PRESETS: DatePreset[] = [
  { label: 'All time', days: null },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 }
]

const TAB_LABELS: Record<Tab, string> = {
  single: 'Best Single',
  ao5: 'Best Ao5',
  ao12: 'Best Ao12',
  session: 'Sessions'
}

export default function Leaderboard(): JSX.Element {
  const [tab, setTab] = useState<Tab>('single')
  const [sessions, setSessions] = useState<Session[]>([])
  const [allSolves, setAllSolves] = useState<Solve[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSessionId, setFilterSessionId] = useState<number | 'all'>('all')
  const [datePreset, setDatePreset] = useState<number | null>(null) // days, null = all time
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  // Load all data once
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [sess, solves] = await Promise.all([
        window.api.getSessions(),
        window.api.getSolves({ cubeType: '3x3' })
      ])
      setSessions(sess)
      setAllSolves(solves)
      setLoading(false)
    }
    load()
  }, [])

  // Apply filters to raw solves
  const filteredSolves = useMemo(() => {
    let result = allSolves
    if (filterSessionId !== 'all') {
      result = result.filter((s) => s.session_id === filterSessionId)
    }
    if (datePreset !== null) {
      const cutoff = Date.now() - datePreset * 24 * 60 * 60 * 1000
      result = result.filter((s) => s.created_at >= cutoff)
    }
    return result
  }, [allSolves, filterSessionId, datePreset])

  // Build leaderboard data per tab
  const singleData = useMemo(
    () => (tab === 'single' ? buildSingleLeaderboard(filteredSolves, sessions) : []),
    [tab, filteredSolves, sessions]
  )
  const ao5Data = useMemo(
    () => (tab === 'ao5' ? buildAoNLeaderboard(filteredSolves, sessions, 5) : []),
    [tab, filteredSolves, sessions]
  )
  const ao12Data = useMemo(
    () => (tab === 'ao12' ? buildAoNLeaderboard(filteredSolves, sessions, 12) : []),
    [tab, filteredSolves, sessions]
  )
  const sessionData = useMemo(
    () => (tab === 'session' ? buildSessionLeaderboard(filteredSolves, sessions) : []),
    [tab, filteredSolves, sessions]
  )

  const isEmpty = (() => {
    if (tab === 'single') return singleData.length === 0
    if (tab === 'ao5') return ao5Data.length === 0
    if (tab === 'ao12') return ao12Data.length === 0
    return sessionData.length === 0
  })()

  return (
    <div style={s.page}>
      {/* Page header */}
      <div style={s.header}>
        <div style={s.titleRow}>
          <Trophy size={18} style={{ color: 'var(--accent)' }} />
          <h1 style={s.title}>Leaderboard</h1>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
              onClick={() => { setTab(t); setExpandedRow(null) }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={s.filterBar}>
        {/* Session filter */}
        <div style={s.filterGroup}>
          <span style={s.filterLabel}>Session</span>
          <div style={s.selectorWrap}>
            <select
              style={s.select}
              value={filterSessionId === 'all' ? 'all' : filterSessionId}
              onChange={(e) =>
                setFilterSessionId(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
            >
              <option value="all">All sessions</option>
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} style={s.chevron} />
          </div>
        </div>

        {/* Date presets */}
        <div style={s.filterGroup}>
          <span style={s.filterLabel}>Period</span>
          <div style={s.presetRow}>
            {DATE_PRESETS.map((p) => (
              <button
                key={p.label}
                style={{
                  ...s.presetBtn,
                  ...(datePreset === p.days ? s.presetBtnActive : {})
                }}
                onClick={() => setDatePreset(p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.filterMeta}>
          {!loading && (
            <span style={s.resultCount}>
              {filteredSolves.length} solve{filteredSolves.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.empty}>Loading...</div>
        ) : isEmpty ? (
          <div style={s.empty}>
            No results. {filteredSolves.length === 0 ? 'No solves match the current filters.' : 'Not enough solves yet.'}
          </div>
        ) : (
          <>
            {tab === 'single' && (
              <SingleTable entries={singleData} expandedRow={expandedRow} onExpand={setExpandedRow} />
            )}
            {tab === 'ao5' && (
              <AoNTable entries={ao5Data} n={5} expandedRow={expandedRow} onExpand={setExpandedRow} />
            )}
            {tab === 'ao12' && (
              <AoNTable entries={ao12Data} n={12} expandedRow={expandedRow} onExpand={setExpandedRow} />
            )}
            {tab === 'session' && (
              <SessionTable entries={sessionData} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Single table ──────────────────────────────────────────────────────────────

function SingleTable({
  entries,
  expandedRow,
  onExpand
}: {
  entries: SingleEntry[]
  expandedRow: number | null
  onExpand: (id: number | null) => void
}): JSX.Element {
  return (
    <table style={s.table}>
      <thead>
        <tr style={s.theadRow}>
          <th style={{ ...s.th, width: 48 }}>#</th>
          <th style={{ ...s.th, width: 100 }}>Time</th>
          <th style={s.th}>Session</th>
          <th style={{ ...s.th, width: 140 }}>Date</th>
          <th style={s.th}>Scramble</th>
        </tr>
      </thead>
      <tbody>
        {entries.slice(0, 200).map((entry, idx) => {
          const expanded = expandedRow === entry.solve.id
          const isPb = idx === 0
          return (
            <tr
              key={entry.solve.id}
              style={{
                ...s.tr,
                background: isPb ? 'var(--accent-dim)' : expanded ? 'var(--bg-elevated)' : undefined
              }}
              onClick={() => onExpand(expanded ? null : entry.solve.id)}
            >
              <td style={s.td}>
                <RankBadge rank={entry.rank} isPb={isPb} />
              </td>
              <td style={s.td}>
                <span style={{ ...s.timeCell, color: penColor(entry.solve.penalty) }}>
                  {formatSolveTime(entry.solve.time_ms, entry.solve.penalty)}
                </span>
              </td>
              <td style={s.td}>
                <span style={s.sessionName}>{entry.session?.name ?? '—'}</span>
              </td>
              <td style={s.td}>
                <span style={s.dateCell}>{formatDate(entry.solve.created_at)}</span>
              </td>
              <td style={s.td}>
                <span style={s.scrambleCell}>{entry.solve.scramble}</span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── AoN table ─────────────────────────────────────────────────────────────────

function AoNTable({
  entries,
  n,
  expandedRow,
  onExpand
}: {
  entries: AoNEntry[]
  n: number
  expandedRow: number | null
  onExpand: (id: number | null) => void
}): JSX.Element {
  return (
    <table style={s.table}>
      <thead>
        <tr style={s.theadRow}>
          <th style={{ ...s.th, width: 48 }}>#</th>
          <th style={{ ...s.th, width: 100 }}>Ao{n}</th>
          <th style={s.th}>Session</th>
          <th style={{ ...s.th, width: 140 }}>Date</th>
          <th style={{ ...s.th, width: 28 }} />
        </tr>
      </thead>
      <tbody>
        {entries.slice(0, 200).map((entry, idx) => {
          const rowKey = entry.endDate + '-' + entry.session?.id
          const expanded = expandedRow === entry.endDate
          const isPb = idx === 0
          return (
            <>
              <tr
                key={rowKey}
                style={{
                  ...s.tr,
                  background: isPb ? 'var(--accent-dim)' : expanded ? 'var(--bg-elevated)' : undefined,
                  cursor: 'pointer'
                }}
                onClick={() => onExpand(expanded ? null : entry.endDate)}
              >
                <td style={s.td}>
                  <RankBadge rank={entry.rank} isPb={isPb} />
                </td>
                <td style={s.td}>
                  <span style={s.timeCell}>{formatTime(entry.ao)}</span>
                </td>
                <td style={s.td}>
                  <span style={s.sessionName}>{entry.session?.name ?? '—'}</span>
                </td>
                <td style={s.td}>
                  <span style={s.dateCell}>{formatDate(entry.endDate)}</span>
                </td>
                <td style={s.td}>
                  {expanded ? (
                    <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                  )}
                </td>
              </tr>
              {expanded && (
                <tr key={rowKey + '-expanded'} style={{ background: 'var(--bg-elevated)' }}>
                  <td colSpan={5} style={{ ...s.td, paddingLeft: 48, paddingBottom: 12 }}>
                    <AoNBreakdown entry={entry} />
                  </td>
                </tr>
              )}
            </>
          )
        })}
      </tbody>
    </table>
  )
}

function AoNBreakdown({ entry }: { entry: AoNEntry }): JSX.Element {
  return (
    <div style={s.breakdown}>
      {entry.solves.map((solve) => {
        const isDropped = solve.id === entry.droppedBest.id || solve.id === entry.droppedWorst.id
        const t = formatSolveTime(solve.time_ms, solve.penalty)
        return (
          <span
            key={solve.id}
            style={{
              ...s.breakdownTime,
              color: isDropped ? 'var(--text-muted)' : 'var(--text-primary)',
              textDecoration: isDropped ? 'line-through' : 'none'
            }}
          >
            {isDropped ? `(${t})` : t}
          </span>
        )
      })}
    </div>
  )
}

// ── Session table ─────────────────────────────────────────────────────────────

function SessionTable({ entries }: { entries: SessionEntry[] }): JSX.Element {
  return (
    <table style={s.table}>
      <thead>
        <tr style={s.theadRow}>
          <th style={{ ...s.th, width: 48 }}>#</th>
          <th style={s.th}>Session</th>
          <th style={{ ...s.th, width: 72 }}>Solves</th>
          <th style={{ ...s.th, width: 100 }}>Mean</th>
          <th style={{ ...s.th, width: 100 }}>Best</th>
          <th style={{ ...s.th, width: 100 }}>Ao5</th>
          <th style={{ ...s.th, width: 100 }}>Ao12</th>
          <th style={{ ...s.th, width: 140 }}>Last solve</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, idx) => (
          <tr
            key={entry.session.id}
            style={{ ...s.tr, background: idx === 0 ? 'var(--accent-dim)' : undefined }}
          >
            <td style={s.td}>
              <RankBadge rank={entry.rank} isPb={idx === 0} />
            </td>
            <td style={s.td}>
              <span style={s.sessionName}>{entry.session.name}</span>
            </td>
            <td style={{ ...s.td, color: 'var(--text-secondary)' }}>{entry.count}</td>
            <td style={s.td}>
              <span style={s.timeCell}>{entry.mean !== null ? formatTime(entry.mean) : '—'}</span>
            </td>
            <td style={s.td}>
              <span style={s.timeCell}>
                {entry.bestSingle !== null && isFinite(entry.bestSingle)
                  ? formatTime(entry.bestSingle)
                  : '—'}
              </span>
            </td>
            <td style={s.td}>
              <span style={{ ...s.timeCell, color: 'var(--text-secondary)' }}>
                {entry.ao5 !== null && isFinite(entry.ao5) ? formatTime(entry.ao5) : '—'}
              </span>
            </td>
            <td style={s.td}>
              <span style={{ ...s.timeCell, color: 'var(--text-secondary)' }}>
                {entry.ao12 !== null && isFinite(entry.ao12) ? formatTime(entry.ao12) : '—'}
              </span>
            </td>
            <td style={s.td}>
              <span style={s.dateCell}>{formatDate(entry.lastSolve)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function RankBadge({ rank, isPb }: { rank: number; isPb: boolean }): JSX.Element {
  if (isPb) {
    return (
      <span style={s.pbBadge}>PB</span>
    )
  }
  return <span style={s.rankNum}>{rank}</span>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function penColor(pen: string): string {
  if (pen === 'dnf') return 'var(--red)'
  if (pen === '+2') return 'var(--yellow)'
  return 'var(--text-primary)'
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },

  header: {
    padding: '16px 24px 0',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)'
  },

  // Tabs
  tabs: {
    display: 'flex',
    gap: 2
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.15s',
    marginBottom: -1
  },
  tabActive: {
    color: 'var(--text-primary)',
    borderBottomColor: 'var(--accent)'
  },

  // Filter bar
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: '12px 24px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
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
    padding: '4px 26px 4px 10px',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none'
  },
  chevron: {
    position: 'absolute',
    right: 7,
    pointerEvents: 'none',
    color: 'var(--text-secondary)'
  },
  presetRow: {
    display: 'flex',
    gap: 4
  },
  presetBtn: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.1s, color 0.1s'
  },
  presetBtnActive: {
    background: 'var(--accent-dim)',
    borderColor: 'var(--accent)',
    color: 'var(--accent)'
  },
  filterMeta: {
    marginLeft: 'auto'
  },
  resultCount: {
    fontSize: 12,
    color: 'var(--text-muted)'
  },

  // Table
  tableWrap: {
    flex: 1,
    overflowY: 'auto'
  },
  empty: {
    padding: '48px 24px',
    color: 'var(--text-muted)',
    fontSize: 14,
    textAlign: 'center'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  theadRow: {
    borderBottom: '1px solid var(--border-subtle)',
    position: 'sticky',
    top: 0,
    background: 'var(--bg-base)',
    zIndex: 1
  },
  th: {
    padding: '8px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tr: {
    borderBottom: '1px solid var(--border-subtle)',
    cursor: 'default',
    transition: 'background 0.1s'
  },
  td: {
    padding: '10px 16px',
    verticalAlign: 'middle'
  },

  // Cells
  rankNum: {
    fontSize: 13,
    color: 'var(--text-muted)',
    fontWeight: 600
  },
  pbBadge: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 5px',
    letterSpacing: '0.5px'
  },
  timeCell: {
    fontFamily: 'var(--font-mono)',
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-primary)'
  },
  sessionName: {
    fontSize: 13,
    color: 'var(--text-secondary)'
  },
  dateCell: {
    fontSize: 12,
    color: 'var(--text-muted)'
  },
  scrambleCell: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-muted)',
    maxWidth: 300,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block'
  },

  // AoN breakdown
  breakdown: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 6
  },
  breakdownTime: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13
  }
}
