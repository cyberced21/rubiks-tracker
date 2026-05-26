import { useState, useEffect, useMemo, useCallback } from 'react'
import { BookOpen, Zap, Star, RotateCcw, Check } from 'lucide-react'
import {
  ALL_ALGORITHMS,
  ALGORITHM_SETS,
  SET_LABEL,
  getBySet,
  groupCases,
  type AlgorithmSet,
  type AlgorithmCase
} from '../data/algorithms'
import AlgDiagram from '../components/algorithms/AlgDiagram'
import type { AlgorithmProgress } from '../types'

type Mode = 'browse' | 'practice'
type Filter = 'all' | 'favorites' | 'needs-practice'

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Algorithms(): JSX.Element {
  const [mode, setMode] = useState<Mode>('browse')
  const [activeSet, setActiveSet] = useState<AlgorithmSet>('OLL')
  const [filter, setFilter] = useState<Filter>('all')
  const [progress, setProgress] = useState<Map<string, AlgorithmProgress>>(new Map())
  const [selectedCase, setSelectedCase] = useState<string | null>(null)

  useEffect(() => {
    window.api.getAlgorithmProgress('3x3').then((rows) => {
      setProgress(new Map(rows.map((r) => [r.case_id, r])))
    })
  }, [])

  const updateProgress = useCallback(
    async (caseId: string, set: AlgorithmSet, rating: string, isFavorite: boolean) => {
      await window.api.updateAlgorithmProgress('3x3', set, caseId, rating, isFavorite)
      setProgress((prev) => {
        const next = new Map(prev)
        const existing = next.get(caseId)
        next.set(caseId, {
          id: existing?.id ?? 0,
          cube_type: '3x3',
          algorithm_set: set,
          case_id: caseId,
          rating: rating as AlgorithmProgress['rating'],
          is_favorite: isFavorite ? 1 : 0,
          last_practiced_at: Date.now()
        })
        return next
      })
    },
    []
  )

  const setCases = useMemo(() => getBySet(activeSet), [activeSet])

  const filteredCases = useMemo(() => {
    if (filter === 'all') return setCases
    return setCases.filter((c) => {
      const p = progress.get(c.id)
      if (filter === 'favorites') return p?.is_favorite === 1
      if (filter === 'needs-practice') return p?.rating === 'hard' || p?.rating === 'again' || !p
      return true
    })
  }, [setCases, filter, progress])

  const practiceQueue = useMemo(() => {
    const priority = (id: string) => {
      const r = progress.get(id)?.rating
      if (!r || r === 'unrated') return 0
      if (r === 'again') return 3
      if (r === 'hard') return 2
      if (r === 'easy') return 1
      return 0
    }
    return [...filteredCases].sort((a, b) => priority(b.id) - priority(a.id))
  }, [filteredCases, progress])

  const selectedCaseData = useMemo(
    () => selectedCase ? ALL_ALGORITHMS.find((c) => c.id === selectedCase) ?? null : null,
    [selectedCase]
  )

  const handleSetChange = (set: AlgorithmSet) => {
    setActiveSet(set)
    setSelectedCase(null)
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.titleRow}>
          <BookOpen size={18} style={{ color: 'var(--accent)' }} />
          <h1 style={s.title}>Algorithms</h1>
          <div style={s.modeTabs}>
            <button
              style={{ ...s.modeTab, ...(mode === 'browse' ? s.modeTabActive : {}) }}
              onClick={() => setMode('browse')}
            >
              Browse
            </button>
            <button
              style={{ ...s.modeTab, ...(mode === 'practice' ? s.modeTabActive : {}) }}
              onClick={() => setMode('practice')}
            >
              <Zap size={12} />
              Practice
            </button>
          </div>
        </div>

        <div style={s.setTabs}>
          {ALGORITHM_SETS.map((set) => (
            <button
              key={set}
              style={{ ...s.setTab, ...(activeSet === set ? s.setTabActive : {}) }}
              onClick={() => handleSetChange(set)}
            >
              {SET_LABEL[set]}
              <span style={s.setCount}>{getBySet(set).length}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === 'browse' && (
        <div style={s.filterBar}>
          {(['all', 'favorites', 'needs-practice'] as Filter[]).map((f) => (
            <button
              key={f}
              style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f === 'favorites' && <Star size={11} />}
              {f === 'needs-practice' && <RotateCcw size={11} />}
              {f === 'all' ? 'All' : f === 'favorites' ? 'Favorites' : 'Needs practice'}
            </button>
          ))}
          <span style={s.caseCount}>{filteredCases.length} cases</span>
          {progress.size > 0 && (
            <span style={s.progressSummary}>
              <ProgressBar cases={setCases} progress={progress} />
            </span>
          )}
        </div>
      )}

      <div style={s.body}>
        {mode === 'browse' ? (
          <>
            {/* Left: grid */}
            <div style={s.gridPanel}>
              <BrowseGrid
                cases={filteredCases}
                progress={progress}
                selectedId={selectedCase}
                onSelect={(id) => setSelectedCase(selectedCase === id ? null : id)}
              />
            </div>

            {/* Right: detail panel */}
            {selectedCaseData && (
              <DetailPanel
                alg={selectedCaseData}
                prog={progress.get(selectedCaseData.id)}
                onUpdateProgress={updateProgress}
                onClose={() => setSelectedCase(null)}
              />
            )}
          </>
        ) : (
          <PracticeView
            queue={practiceQueue}
            progress={progress}
            onUpdateProgress={updateProgress}
          />
        )}
      </div>
    </div>
  )
}

// ── Browse grid ───────────────────────────────────────────────────────────────

function BrowseGrid({
  cases,
  progress,
  selectedId,
  onSelect
}: {
  cases: AlgorithmCase[]
  progress: Map<string, AlgorithmProgress>
  selectedId: string | null
  onSelect: (id: string) => void
}): JSX.Element {
  const groups = useMemo(() => groupCases(cases), [cases])

  if (cases.length === 0) {
    return <div style={s.empty}>No cases match the current filter.</div>
  }

  return (
    <div style={s.browseScroll}>
      {Array.from(groups.entries()).map(([group, groupCases]) => (
        <div key={group} style={s.group}>
          <h3 style={s.groupLabel}>{group}</h3>
          <div style={s.grid}>
            {groupCases.map((c) => {
              const prog = progress.get(c.id)
              const rating = prog?.rating ?? 'unrated'
              const isFav = prog?.is_favorite === 1
              const isSelected = selectedId === c.id

              return (
                <button
                  key={c.id}
                  style={{
                    ...s.card,
                    ...(isSelected ? s.cardSelected : {}),
                    ...(rating === 'easy' ? s.cardEasy : {}),
                  }}
                  onClick={() => onSelect(c.id)}
                >
                  {/* Diagram — the main visual */}
                  <div style={s.diagWrap}>
                    <AlgDiagram alg={c.algorithms[0]} size={110} />
                    {/* Rating badge */}
                    <div style={{ ...s.ratingBadge, background: ratingColor(rating) }} />
                    {/* Favorite star */}
                    {isFav && (
                      <div style={s.favBadge}>
                        <Star size={9} fill="currentColor" />
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={s.cardFooter}>
                    <span style={s.cardId}>{c.id}</span>
                    <span style={s.cardName}>{c.name}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  alg,
  prog,
  onUpdateProgress,
  onClose
}: {
  alg: AlgorithmCase
  prog?: AlgorithmProgress
  onUpdateProgress: (id: string, set: AlgorithmSet, rating: string, fav: boolean) => void
  onClose: () => void
}): JSX.Element {
  const isFav = prog?.is_favorite === 1
  const rating = prog?.rating ?? 'unrated'

  return (
    <div style={s.detailPanel}>
      {/* Close */}
      <button style={s.closeBtn} onClick={onClose}>✕</button>

      {/* Big diagram */}
      <div style={s.detailDiagWrap}>
        <AlgDiagram alg={alg.algorithms[0]} size={180} />
      </div>

      <div style={s.detailIdRow}>
        <span style={s.detailId}>{alg.id}</span>
        <span style={s.detailName}>{alg.name}</span>
      </div>

      {/* Algorithms */}
      <div style={s.algList}>
        {alg.algorithms.map((a, i) => (
          <div key={i} style={s.algRow}>
            <span style={{ ...s.algBadge, ...(i > 0 ? s.algBadgeAlt : {}) }}>
              {i === 0 ? 'Main' : `Alt ${i}`}
            </span>
            <code style={s.algText}>{a}</code>
          </div>
        ))}
      </div>

      {/* Favorite */}
      <button
        style={{ ...s.favBtn, ...(isFav ? s.favBtnActive : {}) }}
        onClick={() => onUpdateProgress(alg.id, alg.set, rating, !isFav)}
      >
        <Star size={13} fill={isFav ? 'currentColor' : 'none'} />
        {isFav ? 'Favorited' : 'Add to favorites'}
      </button>

      {/* Rating */}
      <div style={s.detailRatingSection}>
        <span style={s.detailRatingLabel}>How well do you know it?</span>
        <div style={s.detailRatingBtns}>
          {(['again', 'hard', 'easy'] as const).map((r) => (
            <button
              key={r}
              style={{ ...s.detailRatingBtn, ...(rating === r ? ratingBtnActive(r) : {}) }}
              onClick={() => onUpdateProgress(alg.id, alg.set, r, isFav)}
            >
              {r === 'easy' && <Check size={12} />}
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {prog?.last_practiced_at && (
        <span style={s.lastPracticed}>
          Last rated {new Date(prog.last_practiced_at).toLocaleDateString()}
        </span>
      )}
    </div>
  )
}

// ── Practice mode ─────────────────────────────────────────────────────────────

function PracticeView({
  queue,
  progress,
  onUpdateProgress
}: {
  queue: AlgorithmCase[]
  progress: Map<string, AlgorithmProgress>
  onUpdateProgress: (id: string, set: AlgorithmSet, rating: string, fav: boolean) => void
}): JSX.Element {
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const alg = queue[idx % Math.max(queue.length, 1)]

  const handleRate = useCallback(
    (rating: 'again' | 'hard' | 'easy') => {
      if (!alg) return
      const isFav = progress.get(alg.id)?.is_favorite === 1
      onUpdateProgress(alg.id, alg.set, rating, isFav)
      setIdx((i) => i + 1)
      setRevealed(false)
    },
    [alg, progress, onUpdateProgress]
  )

  if (queue.length === 0) {
    return (
      <div style={s.practiceEmpty}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>No cases in queue.</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Switch to Browse and mark cases as needing practice, or use the "All" filter.
        </p>
      </div>
    )
  }

  const prog = progress.get(alg.id)
  const totalDone = [...progress.values()].filter((p) => p.rating !== 'unrated').length

  return (
    <div style={s.practiceWrap}>
      <div style={s.practiceHeader}>
        <span style={s.practiceCounter}>{(idx % queue.length) + 1} / {queue.length}</span>
        <span style={s.practiceDone}>{totalDone} rated total</span>
      </div>

      <div style={s.flashcard}>
        {/* Big diagram */}
        <div style={s.flashDiagram}>
          <AlgDiagram alg={alg.algorithms[0]} size={220} />
        </div>

        <div style={s.flashMeta}>
          <span style={s.flashId}>{alg.id}</span>
          <span style={s.flashName}>{alg.name}</span>
        </div>

        {!revealed ? (
          <button style={s.revealBtn} onClick={() => setRevealed(true)}>
            Show algorithm
          </button>
        ) : (
          <div style={s.flashAlgBlock}>
            {alg.algorithms.map((a, i) => (
              <div key={i} style={s.flashAlgRow}>
                <span style={{ ...s.algBadge, ...(i > 0 ? s.algBadgeAlt : {}) }}>
                  {i === 0 ? 'Main' : `Alt ${i}`}
                </span>
                <code style={s.flashAlgText}>{a}</code>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={s.ratingRow}>
        <button style={{ ...s.bigRatingBtn, ...s.ratingAgain }} onClick={() => handleRate('again')}>
          Again
          <span style={s.ratingHint}>didn't get it</span>
        </button>
        <button style={{ ...s.bigRatingBtn, ...s.ratingHard }} onClick={() => handleRate('hard')}>
          Hard
          <span style={s.ratingHint}>hesitated</span>
        </button>
        <button style={{ ...s.bigRatingBtn, ...s.ratingEasy }} onClick={() => handleRate('easy')}>
          Easy
          <span style={s.ratingHint}>got it</span>
        </button>
      </div>

      {prog?.last_practiced_at && (
        <p style={s.lastPracticed}>
          Last practiced {new Date(prog.last_practiced_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function ProgressBar({ cases, progress }: { cases: AlgorithmCase[]; progress: Map<string, AlgorithmProgress> }) {
  const easy = cases.filter((c) => progress.get(c.id)?.rating === 'easy').length
  const pct = Math.round((easy / cases.length) * 100)
  return (
    <div style={s.progressBarWrap} title={`${easy}/${cases.length} easy (${pct}%)`}>
      <div style={{ ...s.progressBarFill, width: `${pct}%` }} />
    </div>
  )
}

function ratingColor(rating: string): string {
  if (rating === 'easy') return 'var(--green)'
  if (rating === 'hard') return 'var(--yellow)'
  if (rating === 'again') return 'var(--red)'
  return 'var(--bg-hover)'
}

function ratingBtnActive(rating: 'again' | 'hard' | 'easy'): React.CSSProperties {
  if (rating === 'easy') return { background: 'var(--green-dim)', borderColor: 'var(--green)', color: 'var(--green)' }
  if (rating === 'hard') return { background: 'var(--yellow-dim)', borderColor: 'var(--yellow)', color: 'var(--yellow)' }
  return { background: 'var(--red-dim)', borderColor: 'var(--red)', color: 'var(--red)' }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },

  header: { padding: '16px 24px 0', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  title: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', flex: 1 },

  modeTabs: {
    display: 'flex', gap: 4, background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-sm)', padding: 3
  },
  modeTab: {
    background: 'none', border: 'none', borderRadius: 5, color: 'var(--text-secondary)',
    padding: '4px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4
  },
  modeTabActive: { background: 'var(--bg-active)', color: 'var(--text-primary)' },

  setTabs: { display: 'flex', gap: 2 },
  setTab: {
    background: 'none', border: 'none', borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)', padding: '8px 16px', fontSize: 13,
    fontWeight: 500, cursor: 'pointer', marginBottom: -1,
    display: 'flex', alignItems: 'center', gap: 6
  },
  setTabActive: { color: 'var(--text-primary)', borderBottomColor: 'var(--accent)' },
  setCount: {
    background: 'var(--bg-elevated)', borderRadius: 10, fontSize: 10,
    fontWeight: 600, color: 'var(--text-muted)', padding: '1px 6px'
  },

  filterBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 24px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0
  },
  filterBtn: {
    background: 'none', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
    padding: '4px 10px', fontSize: 12, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4
  },
  filterBtnActive: { background: 'var(--accent-dim)', borderColor: 'var(--accent)', color: 'var(--accent)' },
  caseCount: { fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 },
  progressSummary: { marginLeft: 'auto', display: 'flex', alignItems: 'center' },
  progressBarWrap: { width: 80, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', background: 'var(--green)', borderRadius: 3, transition: 'width 0.3s' },

  // Layout
  body: { flex: 1, overflow: 'hidden', display: 'flex' },
  gridPanel: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },

  empty: { padding: '48px 24px', color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' },

  // Browse grid
  browseScroll: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  group: { marginBottom: 32 },
  groupLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.8px', marginBottom: 14, paddingBottom: 8,
    borderBottom: '1px solid var(--border-subtle)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(144px, 1fr))',
    gap: 10
  },

  // Card
  card: {
    background: 'var(--bg-surface)', border: '2px solid var(--border-subtle)',
    borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.1s, box-shadow 0.15s',
    padding: 0, display: 'flex', flexDirection: 'column',
    textAlign: 'left',
  },
  cardSelected: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 0 1px var(--accent), 0 4px 16px rgba(99,102,241,0.2)',
  },
  cardEasy: {
    borderColor: 'rgba(34,197,94,0.3)',
  },

  diagWrap: {
    position: 'relative',
    background: 'var(--bg-elevated)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '12px',
    borderBottom: '1px solid var(--border-subtle)',
    overflow: 'hidden',
  },
  ratingBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: '50%',
  },
  favBadge: {
    position: 'absolute', top: 5, left: 6,
    color: 'var(--yellow)', fontSize: 9,
    display: 'flex', alignItems: 'center',
  },

  cardFooter: {
    padding: '8px 10px',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  cardId: {
    fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.5px',
  },
  cardName: {
    fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },

  // Detail panel
  detailPanel: {
    width: 280, flexShrink: 0,
    borderLeft: '1px solid var(--border-subtle)',
    padding: '20px 18px',
    display: 'flex', flexDirection: 'column', gap: 14,
    overflowY: 'auto',
    background: 'var(--bg-surface)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
    borderRadius: 6, color: 'var(--text-muted)',
    width: 26, height: 26, cursor: 'pointer', fontSize: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  },

  detailDiagWrap: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: 'var(--bg-elevated)', borderRadius: 10,
    padding: '16px',
    border: '1px solid var(--border-subtle)',
  },
  detailIdRow: { display: 'flex', flexDirection: 'column', gap: 3 },
  detailId: { fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.5px' },
  detailName: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' },

  algList: { display: 'flex', flexDirection: 'column', gap: 6 },
  algRow: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  algBadge: {
    background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)',
    borderRadius: 4, fontSize: 9, fontWeight: 700, padding: '2px 6px',
    flexShrink: 0, marginTop: 2,
  },
  algBadgeAlt: {
    background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderColor: 'var(--border-default)'
  },
  algText: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)',
    background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: 5,
    flex: 1, userSelect: 'text', lineHeight: 1.5,
  },

  favBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: '1px solid var(--border-default)',
    borderRadius: 7, color: 'var(--text-secondary)',
    padding: '7px 12px', fontSize: 12, cursor: 'pointer',
    fontWeight: 500,
  },
  favBtnActive: { borderColor: 'var(--yellow)', color: 'var(--yellow)', background: 'var(--yellow-dim)' },

  detailRatingSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  detailRatingLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRatingBtns: { display: 'flex', gap: 6 },
  detailRatingBtn: {
    flex: 1, background: 'none', border: '1px solid var(--border-default)',
    borderRadius: 7, color: 'var(--text-secondary)',
    padding: '7px 0', fontSize: 12, cursor: 'pointer', fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  },

  lastPracticed: { fontSize: 11, color: 'var(--text-muted)', margin: 0 },

  // Practice
  practiceWrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '24px', gap: 20, overflowY: 'auto'
  },
  practiceEmpty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32,
  },
  practiceHeader: { display: 'flex', gap: 16, alignItems: 'center' },
  practiceCounter: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' },
  practiceDone: { fontSize: 11, color: 'var(--text-muted)' },

  flashcard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
    borderRadius: 16, padding: '28px 32px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 14, minWidth: 360, maxWidth: 500, width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
  },

  flashDiagram: {
    background: 'var(--bg-elevated)', borderRadius: 12, padding: 16,
    border: '1px solid var(--border-subtle)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  flashMeta: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  flashId: { fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.5px' },
  flashName: { fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' },

  revealBtn: {
    background: 'var(--accent)', border: 'none', borderRadius: 8,
    color: '#fff', padding: '11px 32px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', marginTop: 4
  },
  flashAlgBlock: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 },
  flashAlgRow: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  flashAlgText: {
    fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-primary)',
    background: 'var(--bg-elevated)', padding: '7px 12px', borderRadius: 6,
    flex: 1, textAlign: 'center', userSelect: 'text'
  },

  ratingRow: { display: 'flex', gap: 10 },
  bigRatingBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 3, padding: '11px 28px', border: '1px solid', borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: 'pointer', minWidth: 96
  },
  ratingHint: { fontSize: 10, fontWeight: 400, opacity: 0.7 },
  ratingAgain: { background: 'var(--red-dim)', borderColor: 'var(--red)', color: 'var(--red)' },
  ratingHard: { background: 'var(--yellow-dim)', borderColor: 'var(--yellow)', color: 'var(--yellow)' },
  ratingEasy: { background: 'var(--green-dim)', borderColor: 'var(--green)', color: 'var(--green)' },
}
