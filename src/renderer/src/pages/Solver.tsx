import { useState, useCallback, useEffect } from 'react'
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search'
import { Alg } from 'cubing/alg'

// Register cubing.js TwistyPlayer web component once
let twistyRegistered = false
function ensureTwistyRegistered() {
  if (twistyRegistered) return
  twistyRegistered = true
  import('cubing/twisty').catch(() => {/* silent */})
}

// ── Facelet scheme ─────────────────────────────────────────────────────────────
// 54 facelets: U(0-8) R(9-17) F(18-26) D(27-35) L(36-44) B(45-53)
// U face layout (looking from top, F at bottom):
//   0(UBL) 1(UB) 2(UBR) | 3(UL) 4(U) 5(UR) | 6(UFL) 7(UF) 8(UFR)
// R: 9(URF) 10(UR) 11(URB) 12(RF) 13(R) 14(RB) 15(DRF) 16(DR) 17(DRB)
// F: 18(UFL) 19(UF) 20(UFR) 21(FL) 22(F) 23(FR) 24(DFL) 25(DF) 26(DFR)
// D: 27(DFL) 28(DF) 29(DFR) 30(DL) 31(D) 32(DR) 33(DBL) 34(DB) 35(DBR)
// L: 36(ULB) 37(UL) 38(ULF) 39(LB) 40(L) 41(LF) 42(DLB) 43(DL) 44(DLF)
// B: 45(URB) 46(UB) 47(UBL) 48(RB) 49(B) 50(BL) 51(DRB) 52(DB) 53(DBL)

const SOLVED_FACELETS = [
  ...Array(9).fill('w'), // U
  ...Array(9).fill('r'), // R
  ...Array(9).fill('g'), // F
  ...Array(9).fill('y'), // D
  ...Array(9).fill('o'), // L
  ...Array(9).fill('b'), // B
]

const PALETTE = ['w', 'r', 'g', 'y', 'o', 'b'] as const
type FaceColor = (typeof PALETTE)[number]

const COLOR_HEX: Record<FaceColor, string> = {
  w: '#EFEFEF',
  r: '#C41E3A',
  g: '#009B48',
  y: '#FFD500',
  o: '#FF5800',
  b: '#0046AD',
}

// ── Piece/facelet lookup tables ────────────────────────────────────────────────
// Corner positions (cubing.js order): 0=UFR 1=UBR 2=UBL 3=UFL 4=DFR 5=DFL 6=DBL 7=DBR
// Each entry: [slot0_facelet, slot1_facelet, slot2_facelet]
// Slot 0 = U/D face sticker; slots 1,2 = the other two faces
const CORNER_SLOTS = [
  [8, 9, 20],   // UFR: U, R, F
  [2, 45, 11],  // UBR: U, B, R
  [0, 36, 47],  // UBL: U, L, B
  [6, 18, 38],  // UFL: U, F, L
  [29, 26, 15], // DFR: D, F, R
  [27, 44, 24], // DFL: D, L, F
  [33, 53, 42], // DBL: D, B, L
  [35, 17, 51], // DBR: D, R, B
]

// Face-index sets for each corner piece (U=0 R=1 F=2 D=3 L=4 B=5)
const CORNER_PIECE_FACES = [
  [0, 1, 2], // UFR
  [0, 5, 1], // UBR
  [0, 4, 5], // UBL
  [0, 2, 4], // UFL
  [3, 2, 1], // DFR
  [3, 4, 2], // DFL
  [3, 5, 4], // DBL
  [3, 1, 5], // DBR
]

// Edge positions: 0=UF 1=UR 2=UB 3=UL 4=DF 5=DR 6=DB 7=DL 8=FR 9=FL 10=BR 11=BL
const EDGE_SLOTS = [
  [7, 19],   // UF: U, F
  [5, 10],   // UR: U, R
  [1, 46],   // UB: U, B
  [3, 37],   // UL: U, L
  [28, 25],  // DF: D, F
  [32, 16],  // DR: D, R
  [34, 52],  // DB: D, B
  [30, 43],  // DL: D, L
  [23, 12],  // FR: F, R
  [21, 41],  // FL: F, L
  [48, 14],  // BR: B, R
  [50, 39],  // BL: B, L
]

const EDGE_PIECE_FACES = [
  [0, 2], [0, 1], [0, 5], [0, 4], // UF UR UB UL
  [3, 2], [3, 1], [3, 5], [3, 4], // DF DR DB DL
  [2, 1], [2, 4], [5, 1], [5, 4], // FR FL BR BL
]

// Primary face index for each edge piece (determines orientation 0)
// 0=U, 3=D, 2=F, 5=B
const EDGE_PRIMARY_FACE = [0, 0, 0, 0, 3, 3, 3, 3, 2, 2, 5, 5]

// Centers: face 0=U(idx4) 1=R(idx13) 2=F(idx22) 3=D(idx31) 4=L(idx40) 5=B(idx49)
const CENTER_FACELETS = [4, 13, 22, 31, 40, 49]

// ── Conversion ─────────────────────────────────────────────────────────────────
function facelets_to_transformation(f: string[]): object | null {
  if (f.length !== 54) return null

  // Build color → face-index map from centers
  const colorToFace = new Map<string, number>()
  for (let fi = 0; fi < 6; fi++) {
    const color = f[CENTER_FACELETS[fi]]
    if (colorToFace.has(color)) return null // duplicate center color
    colorToFace.set(color, fi)
  }

  const setEq = (a: number[], b: number[]) =>
    a.length === b.length && [...a].sort().join() === [...b].sort().join()

  // Corners
  const cPerm = new Array(8).fill(0)
  const cOri = new Array(8).fill(0)
  for (let pos = 0; pos < 8; pos++) {
    const [s0, s1, s2] = CORNER_SLOTS[pos]
    const f0 = colorToFace.get(f[s0])
    const f1 = colorToFace.get(f[s1])
    const f2 = colorToFace.get(f[s2])
    if (f0 === undefined || f1 === undefined || f2 === undefined) return null

    const faces = [f0, f1, f2]
    let piece = -1
    for (let p = 0; p < 8; p++) {
      if (setEq(faces, CORNER_PIECE_FACES[p])) { piece = p; break }
    }
    if (piece === -1) return null
    cPerm[pos] = piece

    // Orientation: which slot has the U-or-D sticker?
    const udFaces = new Set([0, 3]) // U or D face indices
    if (udFaces.has(f0)) cOri[pos] = 0
    else if (udFaces.has(f1)) cOri[pos] = 1
    else if (udFaces.has(f2)) cOri[pos] = 2
    else return null
  }

  // Edges
  const ePerm = new Array(12).fill(0)
  const eOri = new Array(12).fill(0)
  for (let pos = 0; pos < 12; pos++) {
    const [s0, s1] = EDGE_SLOTS[pos]
    const f0 = colorToFace.get(f[s0])
    const f1 = colorToFace.get(f[s1])
    if (f0 === undefined || f1 === undefined) return null

    const faces = [f0, f1]
    let piece = -1
    for (let p = 0; p < 12; p++) {
      if (setEq(faces, EDGE_PIECE_FACES[p])) { piece = p; break }
    }
    if (piece === -1) return null
    ePerm[pos] = piece

    // Orientation: is piece's primary face at slot 0?
    const primaryFaceIdx = EDGE_PRIMARY_FACE[piece]
    const primaryColor = f[CENTER_FACELETS[primaryFaceIdx]]
    eOri[pos] = f[s0] === primaryColor ? 0 : 1
  }

  return {
    EDGES:   { permutation: ePerm, orientation: eOri },
    CORNERS: { permutation: cPerm, orientation: cOri },
    CENTERS: { permutation: [0, 1, 2, 3, 4, 5], orientation: [0, 0, 0, 0, 0, 0] },
  }
}

function validate(f: string[]): string | null {
  const counts = new Map<string, number>()
  for (const c of f) counts.set(c, (counts.get(c) ?? 0) + 1)
  for (const [color, count] of counts) {
    if (!PALETTE.includes(color as FaceColor)) return `Unknown color "${color}"`
    if (count !== 9) return `Color "${color}" appears ${count} times (expected 9)`
  }
  if (counts.size !== 6) return 'Need exactly 6 distinct colors (one per face)'
  return null
}

// ── Face net layout ────────────────────────────────────────────────────────────
// Face net positions: which facelets (0-8) map to row/col within each face
// Row-major 3×3, top-left first
const FACE_FACELET_OFFSETS = [0, 1, 2, 3, 4, 5, 6, 7, 8] // identity mapping
const FACE_BASES = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 }

interface FaceGridProps {
  label: string
  base: number
  facelets: string[]
  selectedColor: string
  onCellClick: (idx: number) => void
  size?: number
}

function FaceGrid({ label, base, facelets, selectedColor, onCellClick, size = 32 }: FaceGridProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${size}px)`, gap: 2 }}>
        {FACE_FACELET_OFFSETS.map((offset) => {
          const idx = base + offset
          const color = facelets[idx] as FaceColor
          const isCenter = offset === 4
          return (
            <div
              key={idx}
              onClick={() => !isCenter && onCellClick(idx)}
              style={{
                width: size,
                height: size,
                background: COLOR_HEX[color] ?? '#333',
                borderRadius: 3,
                border: isCenter
                  ? '2px solid rgba(255,255,255,0.15)'
                  : '2px solid rgba(0,0,0,0.4)',
                cursor: isCenter ? 'default' : 'pointer',
                boxSizing: 'border-box',
                transition: 'transform 0.08s',
              }}
              onMouseEnter={(e) => { if (!isCenter) (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Solver(): JSX.Element {
  const [facelets, setFacelets] = useState<string[]>([...SOLVED_FACELETS])
  const [selectedColor, setSelectedColor] = useState<FaceColor>('w')
  const [tab, setTab] = useState<'kociemba' | 'beginner'>('kociemba')
  const [solution, setSolution] = useState<string | null>(null)
  const [setupAlg, setSetupAlg] = useState<string | null>(null)
  const [solving, setSolving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notationInput, setNotationInput] = useState('')

  useEffect(() => { ensureTwistyRegistered() }, [])

  const handleCellClick = useCallback((idx: number) => {
    setFacelets((prev) => {
      const next = [...prev]
      next[idx] = selectedColor
      return next
    })
    setSolution(null)
    setSetupAlg(null)
    setError(null)
  }, [selectedColor])

  const handleReset = () => {
    setFacelets([...SOLVED_FACELETS])
    setSolution(null)
    setSetupAlg(null)
    setError(null)
    setNotationInput('')
  }

  const handleNotationApply = () => {
    const str = notationInput.trim()
    if (str.length !== 54) {
      setError(`Notation must be 54 characters (got ${str.length})`)
      return
    }
    setFacelets(str.split(''))
    setSolution(null)
    setSetupAlg(null)
    setError(null)
  }

  const handleSolve = async () => {
    const validErr = validate(facelets)
    if (validErr) { setError(validErr); return }

    const transformation = facelets_to_transformation(facelets)
    if (!transformation) { setError('Invalid cube state — check colors are consistent.'); return }

    setSolving(true)
    setSolution(null)
    setSetupAlg(null)
    setError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const alg: Alg = await experimentalSolve3x3x3IgnoringCenters(transformation as any)
      const algStr = alg.toString()
      setSolution(algStr)
      // Setup = inverse of solution → gives the scrambled state from solved
      const inv = alg.invert().toString()
      setSetupAlg(inv)
    } catch (e) {
      setError(`Solve failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSolving(false)
    }
  }

  const moveCount = solution
    ? solution.split(' ').filter(Boolean).length
    : 0

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Cube Solver</h2>
        <p style={styles.subtitle}>Enter your cube state, then hit Solve</p>
      </div>

      <div style={styles.body}>
        {/* Left: Input panel */}
        <div style={styles.inputPanel}>
          {/* Color palette */}
          <div style={styles.paletteRow}>
            {PALETTE.map((c) => (
              <div
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{
                  ...styles.swatch,
                  background: COLOR_HEX[c],
                  outline: selectedColor === c ? '3px solid var(--accent)' : '2px solid transparent',
                  transform: selectedColor === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
            <span style={styles.hint}>Selected: <b style={{ color: COLOR_HEX[selectedColor] }}>{selectedColor.toUpperCase()}</b></span>
          </div>

          {/* Cube net */}
          <div style={styles.net}>
            {/* Top row: U face */}
            <div style={styles.netTopRow}>
              <FaceGrid label="U" base={FACE_BASES.U} facelets={facelets} selectedColor={selectedColor} onCellClick={handleCellClick} />
            </div>
            {/* Middle row: L F R B */}
            <div style={styles.netMiddleRow}>
              <FaceGrid label="L" base={FACE_BASES.L} facelets={facelets} selectedColor={selectedColor} onCellClick={handleCellClick} />
              <FaceGrid label="F" base={FACE_BASES.F} facelets={facelets} selectedColor={selectedColor} onCellClick={handleCellClick} />
              <FaceGrid label="R" base={FACE_BASES.R} facelets={facelets} selectedColor={selectedColor} onCellClick={handleCellClick} />
              <FaceGrid label="B" base={FACE_BASES.B} facelets={facelets} selectedColor={selectedColor} onCellClick={handleCellClick} />
            </div>
            {/* Bottom row: D face */}
            <div style={styles.netTopRow}>
              <FaceGrid label="D" base={FACE_BASES.D} facelets={facelets} selectedColor={selectedColor} onCellClick={handleCellClick} />
            </div>
          </div>

          {/* Notation input */}
          <div style={styles.notationRow}>
            <input
              placeholder="54-char notation (e.g. wwwwwwwwwrrr…)"
              value={notationInput}
              onChange={(e) => setNotationInput(e.target.value)}
              style={styles.notationInput}
            />
            <button onClick={handleNotationApply} style={styles.secondaryBtn}>Apply</button>
          </div>

          {/* Actions */}
          <div style={styles.actionRow}>
            <button onClick={handleReset} style={styles.secondaryBtn}>Reset</button>
            <button onClick={handleSolve} disabled={solving} style={styles.solveBtn}>
              {solving ? 'Solving…' : 'Solve'}
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}
        </div>

        {/* Right: Solution panel */}
        <div style={styles.solutionPanel}>
          {/* Tabs */}
          <div style={styles.tabs}>
            {(['kociemba', 'beginner'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) }}
              >
                {t === 'kociemba' ? 'Optimal (Kociemba)' : "Beginner's Guide"}
              </button>
            ))}
          </div>

          {tab === 'kociemba' && (
            <div style={styles.tabContent}>
              {solving && (
                <div style={styles.placeholder}>
                  <span style={styles.muted}>Computing solution…</span>
                </div>
              )}
              {!solving && solution === null && !error && (
                <div style={styles.placeholder}>
                  <span style={styles.muted}>Enter your cube state and click Solve</span>
                </div>
              )}
              {!solving && solution !== null && (
                <>
                  <div style={styles.solutionHeader}>
                    <span style={styles.solutionLabel}>Solution</span>
                    <span style={styles.moveCount}>{moveCount} moves</span>
                  </div>
                  <p style={styles.solutionAlg}>{solution}</p>

                  {/* TwistyPlayer */}
                  {setupAlg !== null && (
                    <div style={styles.playerWrap}>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `
                            <twisty-player
                              puzzle="3x3x3"
                              experimental-setup-alg="${escapeAttr(setupAlg)}"
                              alg="${escapeAttr(solution)}"
                              visualization="3D"
                              hint-facelets="floating"
                              back-view="none"
                              style="width:320px;height:320px;display:block;"
                              control-panel="bottom-row"
                            ></twisty-player>
                          `,
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'beginner' && (
            <div style={styles.tabContent}>
              <BeginnerGuide solution={solution} setupAlg={setupAlg} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Beginner guide ─────────────────────────────────────────────────────────────
const BEGINNER_STAGES = [
  { name: 'White Cross', desc: 'Form a + on the bottom with white edges aligned to their side colors.' },
  { name: 'White Corners', desc: 'Insert white corners to complete the white face.' },
  { name: 'Middle Layer Edges', desc: 'Insert F2L edges into their correct slots.' },
  { name: 'Yellow Cross', desc: 'Orient last-layer edges so yellow is on top.' },
  { name: 'Orient Last Layer', desc: 'Twist last-layer corners to face yellow up.' },
  { name: 'Permute Last Layer', desc: 'Cycle corners and edges to solve the top layer.' },
]

function BeginnerGuide({ solution, setupAlg }: { solution: string | null; setupAlg: string | null }) {
  if (!solution) {
    return (
      <div style={styles.placeholder}>
        <span style={styles.muted}>Solve the cube first to see a breakdown</span>
      </div>
    )
  }

  // Split solution into stage-like chunks (roughly equal)
  const moves = solution.split(' ').filter(Boolean)
  const chunkSize = Math.max(1, Math.ceil(moves.length / BEGINNER_STAGES.length))
  const chunks: string[] = []
  for (let i = 0; i < moves.length; i += chunkSize) {
    chunks.push(moves.slice(i, i + chunkSize).join(' '))
  }

  // Cumulative algs for each stage
  const cumulative: string[] = []
  let accum = ''
  for (const chunk of chunks) {
    accum = accum ? `${accum} ${chunk}` : chunk
    cumulative.push(accum)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
      <p style={{ ...styles.muted, fontSize: 12, marginBottom: 4 }}>
        Kociemba solution broken into beginner stages (approximate):
      </p>
      {BEGINNER_STAGES.map((stage, i) => {
        const stageMoves = chunks[i] ?? ''
        const cumulativeAlg = cumulative[i] ?? ''
        if (!stageMoves) return null
        const stageSetup = setupAlg ?? ''
        return (
          <div key={i} style={styles.stageCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={styles.stageName}>{stage.name}</span>
              <span style={{ ...styles.muted, fontSize: 11 }}>{stageMoves.split(' ').length} moves</span>
            </div>
            <p style={{ ...styles.muted, fontSize: 12, margin: '2px 0 6px' }}>{stage.desc}</p>
            <p style={styles.stageMoves}>{stageMoves}</p>
            <div
              style={{ marginTop: 6 }}
              dangerouslySetInnerHTML={{
                __html: `
                  <twisty-player
                    puzzle="3x3x3"
                    experimental-setup-alg="${escapeAttr(stageSetup)}"
                    alg="${escapeAttr(cumulativeAlg)}"
                    visualization="2D"
                    hint-facelets="floating"
                    back-view="none"
                    style="width:120px;height:120px;display:block;"
                    control-panel="none"
                  ></twisty-player>
                `,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    background: 'var(--bg-base)',
  },
  header: {
    padding: '20px 24px 12px',
    borderBottom: '1px solid var(--border)',
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  body: {
    flex: 1,
    display: 'flex',
    gap: 0,
    overflow: 'hidden',
  },
  inputPanel: {
    width: 480,
    flexShrink: 0,
    borderRight: '1px solid var(--border)',
    padding: '20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    overflowY: 'auto',
  },
  solutionPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  paletteRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'transform 0.1s, outline 0.1s',
    outlineOffset: 2,
  },
  hint: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginLeft: 4,
  },
  net: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  netTopRow: {
    marginLeft: 106, // align U and D with F face: L-face-width(100) + gap(6)
    display: 'flex',
  },
  netMiddleRow: {
    display: 'flex',
    gap: 6,
  },
  notationRow: {
    display: 'flex',
    gap: 8,
  },
  notationInput: {
    flex: 1,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: 12,
    padding: '6px 10px',
    fontFamily: 'var(--font-mono)',
  },
  actionRow: {
    display: 'flex',
    gap: 10,
  },
  solveBtn: {
    flex: 1,
    padding: '9px 0',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '9px 16px',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  error: {
    margin: 0,
    padding: '8px 12px',
    background: 'rgba(239,68,68,0.12)',
    borderRadius: 6,
    fontSize: 12,
    color: 'var(--red)',
    border: '1px solid rgba(239,68,68,0.25)',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    padding: '0 16px',
  },
  tabBtn: {
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-muted)',
    fontSize: 13,
    cursor: 'pointer',
    marginBottom: -1,
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabBtnActive: {
    color: 'var(--accent)',
    borderBottom: '2px solid var(--accent)',
  },
  tabContent: {
    flex: 1,
    padding: 20,
    overflowY: 'auto',
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  muted: {
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  solutionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  solutionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moveCount: {
    padding: '2px 8px',
    background: 'var(--bg-elevated)',
    borderRadius: 20,
    fontSize: 12,
    color: 'var(--accent)',
    border: '1px solid var(--border)',
  },
  solutionAlg: {
    fontFamily: 'var(--font-mono)',
    fontSize: 16,
    color: 'var(--text-primary)',
    background: 'var(--bg-elevated)',
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    wordBreak: 'break-word',
    lineHeight: 1.8,
    margin: '0 0 16px',
  },
  playerWrap: {
    borderRadius: 8,
    overflow: 'visible',
    width: 'fit-content',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
  },
  stageCard: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '12px 14px',
  },
  stageName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  stageMoves: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'var(--accent)',
    margin: 0,
  },
}
