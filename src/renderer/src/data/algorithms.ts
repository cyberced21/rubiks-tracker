export type AlgorithmSet = 'OLL' | 'PLL' | 'F2L' | 'beginners'

export interface AlgorithmCase {
  id: string
  set: AlgorithmSet
  name: string
  algorithms: string[]   // [primary, ...alternatives]
  group?: string         // e.g. "Cross", "T shapes", "Dot"
}

// ── OLL (57 cases) ────────────────────────────────────────────────────────────
// Algorithms orient the last layer. Applied to a solved cube = recognition state.
// Grouped by edge orientation pattern.

const OLL: AlgorithmCase[] = [
  // ── Dot (no edges oriented) ───────────────────────────────────────────────
  { id:'OLL-1',  set:'OLL', group:'Dot', name:'Dot 1', algorithms:["R U2 R2 F R F' U2 R' F R F'"] },
  { id:'OLL-2',  set:'OLL', group:'Dot', name:'Dot 2', algorithms:["F R U R' U' F' f R U R' U' f'"] },
  { id:'OLL-3',  set:'OLL', group:'Dot', name:'Dot 3', algorithms:["f R U R' U' f' U' F R U R' U' F'"] },
  { id:'OLL-4',  set:'OLL', group:'Dot', name:'Dot 4', algorithms:["f R U R' U' f' U F R U R' U' F'"] },

  // ── C shapes ──────────────────────────────────────────────────────────────
  { id:'OLL-5',  set:'OLL', group:'C shape', name:'C shape 1', algorithms:["r' U2 R U R' U r"] },
  { id:'OLL-6',  set:'OLL', group:'C shape', name:'C shape 2', algorithms:["r U2 R' U' R U' r'"] },

  // ── W shapes ──────────────────────────────────────────────────────────────
  { id:'OLL-7',  set:'OLL', group:'W shape', name:'W shape 1', algorithms:["r U R' U R U2 r'"] },
  { id:'OLL-8',  set:'OLL', group:'W shape', name:'W shape 2', algorithms:["l' U' L U' L' U2 l"] },

  // ── P shapes ──────────────────────────────────────────────────────────────
  { id:'OLL-31', set:'OLL', group:'P shape', name:'P shape 1', algorithms:["R' U' F U R U' R' F' R"] },
  { id:'OLL-32', set:'OLL', group:'P shape', name:'P shape 2', algorithms:["R U B' U' R' U R B R'"] },
  { id:'OLL-43', set:'OLL', group:'P shape', name:'P shape 3', algorithms:["R' U' F' U F R"] },
  { id:'OLL-44', set:'OLL', group:'P shape', name:'P shape 4', algorithms:["f R U R' U' f'"] },

  // ── Fish shapes ───────────────────────────────────────────────────────────
  { id:'OLL-9',  set:'OLL', group:'Fish', name:'Fish 1', algorithms:["R U R' U' R' F R2 U R' U' F'"] },
  { id:'OLL-10', set:'OLL', group:'Fish', name:'Fish 2', algorithms:["R U R' U R' F R F' R U2 R'"] },

  // ── T shapes ──────────────────────────────────────────────────────────────
  { id:'OLL-33', set:'OLL', group:'T shape', name:'T shape 1', algorithms:["R U R' U' R' F R F'"] },
  { id:'OLL-45', set:'OLL', group:'T shape', name:'T shape 2', algorithms:["F R U R' U' F'"] },

  // ── Knight move shapes ────────────────────────────────────────────────────
  { id:'OLL-11', set:'OLL', group:'Knight', name:'Knight 1', algorithms:["r U R' U R' F R F' R U2 r'"] },
  { id:'OLL-12', set:'OLL', group:'Knight', name:'Knight 2', algorithms:["M' R' U' R U' R' U2 R U' R r'"] },

  // ── Awkward shapes ────────────────────────────────────────────────────────
  { id:'OLL-29', set:'OLL', group:'Awkward', name:'Awkward 1', algorithms:["R U R' U' R U' R' F' U' F R U R'"] },
  { id:'OLL-30', set:'OLL', group:'Awkward', name:'Awkward 2', algorithms:["F R' F R2 U' R' U' R U R' F2"] },
  { id:'OLL-41', set:'OLL', group:'Awkward', name:'Awkward 3', algorithms:["R U R' U R U2 R' F R U R' U' F'"] },
  { id:'OLL-42', set:'OLL', group:'Awkward', name:'Awkward 4', algorithms:["R' U' R U' R' U2 R F R U R' U' F'"] },

  // ── L shapes ──────────────────────────────────────────────────────────────
  { id:'OLL-13', set:'OLL', group:'L shape', name:'L shape 1', algorithms:["F U R U2 R' U' R U R' F'"] },
  { id:'OLL-14', set:'OLL', group:'L shape', name:'L shape 2', algorithms:["R' F R U R' F' R F U' F'"] },
  { id:'OLL-15', set:'OLL', group:'L shape', name:'L shape 3', algorithms:["r' U' r R' U' R U r' U r"] },
  { id:'OLL-16', set:'OLL', group:'L shape', name:'L shape 4', algorithms:["r U r' R U R' U' r U' r'"] },

  // ── Big lightning bolt ────────────────────────────────────────────────────
  { id:'OLL-39', set:'OLL', group:'Lightning', name:'Lightning 1', algorithms:["R U R' F' U' F U R U2 R'"] },
  { id:'OLL-40', set:'OLL', group:'Lightning', name:'Lightning 2', algorithms:["R' F R F' U' R' U' R U R' U R"] },

  // ── Small lightning bolt ──────────────────────────────────────────────────
  { id:'OLL-17', set:'OLL', group:'Small Lightning', name:'Lightning 3', algorithms:["F R' F' R U R U' R'"] },
  { id:'OLL-18', set:'OLL', group:'Small Lightning', name:'Lightning 4', algorithms:["R U R' U R U' R' U' R' F R F'"] },
  { id:'OLL-19', set:'OLL', group:'Small Lightning', name:'Lightning 5', algorithms:["r' R U R U R' U' M' R' F R F'"] },
  { id:'OLL-20', set:'OLL', group:'Small Lightning', name:'Lightning 6', algorithms:["r U R' U' M2 U R U' R' U' M'"] },

  // ── S shapes ──────────────────────────────────────────────────────────────
  { id:'OLL-23', set:'OLL', group:'S shape', name:'S shape 1', algorithms:["R2 D R' U2 R D' R' U2 R'"] },
  { id:'OLL-24', set:'OLL', group:'S shape', name:'S shape 2', algorithms:["r U R' U' r' F R F'"] },

  // ── Z shapes ──────────────────────────────────────────────────────────────
  { id:'OLL-25', set:'OLL', group:'Z shape', name:'Z shape 1', algorithms:["R' F R B' R' F' R B"] },
  { id:'OLL-26', set:'OLL', group:'Z shape', name:'Z shape 2', algorithms:["R U2 R' U' R U' R'"] },  // Sune (AUF)

  // ── Line ──────────────────────────────────────────────────────────────────
  { id:'OLL-46', set:'OLL', group:'Line', name:'Line 1', algorithms:["R' U' R' F R F' U R"] },
  { id:'OLL-47', set:'OLL', group:'Line', name:'Line 2', algorithms:["F' L' U' L U F"] },
  { id:'OLL-48', set:'OLL', group:'Line', name:'Line 3', algorithms:["F R U R' U' F'"] },
  { id:'OLL-49', set:'OLL', group:'Line', name:'Line 4', algorithms:["r U' r2 U r2 U r2 U' r"] },
  { id:'OLL-50', set:'OLL', group:'Line', name:'Line 5', algorithms:["r' U r2 U' r2 U' r2 U r'"] },

  // ── Corners correct, edges wrong ──────────────────────────────────────────
  { id:'OLL-21', set:'OLL', group:'Cross', name:'Cross 1 – All corners bad', algorithms:["R U2 R' U' R U R' U' R U' R'"] },
  { id:'OLL-22', set:'OLL', group:'Cross', name:'Cross 2 – All corners good', algorithms:["R U2 R2 U' R2 U' R2 U2 R"] },
  { id:'OLL-27', set:'OLL', group:'Cross', name:'Cross – Sune', algorithms:["R U R' U R U2 R'"] },
  { id:'OLL-26b',set:'OLL', group:'Cross', name:'Cross – Anti Sune', algorithms:["R' U' R U' R' U2 R"] },

  // ── Squares ───────────────────────────────────────────────────────────────
  { id:'OLL-51', set:'OLL', group:'Square', name:'Square 1', algorithms:["f R U R' U' R U R' U' f'"] },
  { id:'OLL-52', set:'OLL', group:'Square', name:'Square 2', algorithms:["R U R' U R U' B U' B' R'"] },

  // ── Corners ───────────────────────────────────────────────────────────────
  { id:'OLL-35', set:'OLL', group:'Fish', name:'Fish 3', algorithms:["R U2 R2 F R F' R U2 R'"] },
  { id:'OLL-36', set:'OLL', group:'Fish', name:'Fish 4', algorithms:["L' U' L U' L' U L U L F' L' F"] },
  { id:'OLL-37', set:'OLL', group:'Sune', name:'Corner 1', algorithms:["F R' F' R U R U' R'"] },
  { id:'OLL-38', set:'OLL', group:'Sune', name:'Corner 2', algorithms:["R U R' U' R' F R F'"] },

  { id:'OLL-53', set:'OLL', group:'Fat L', name:'Fat L 1', algorithms:["l' U2 L U L' U l"] },
  { id:'OLL-54', set:'OLL', group:'Fat L', name:'Fat L 2', algorithms:["r U2 R' U' R U' r'"] },
  { id:'OLL-55', set:'OLL', group:'Fat L', name:'Fat L 3', algorithms:["R' F R U R U' R2 F' R2 U' R' U R U R'"] },
  { id:'OLL-56', set:'OLL', group:'Fat L', name:'Fat L 4', algorithms:["r' U' r U' R' U R U' R' U R r' U r"] },
  { id:'OLL-57', set:'OLL', group:'Star', name:'Star', algorithms:["R U R' U' M' U R U' r'"] },

  // ── Remaining cases ───────────────────────────────────────────────────────
  { id:'OLL-28', set:'OLL', group:'Corners', name:'All corners flipped', algorithms:["r U R' U' r' R U R U' R'"] },
  { id:'OLL-34', set:'OLL', group:'T shape', name:'T shape 3', algorithms:["R U R2 U' R' F R U R U' F'"] },
  { id:'OLL-43b',set:'OLL', group:'F shape', name:'F shape 1', algorithms:["f' L' U' L U f"] },
  { id:'OLL-44b',set:'OLL', group:'F shape', name:'F shape 2', algorithms:["F U R U' R' F'"] },
]

// ── PLL (21 cases) ────────────────────────────────────────────────────────────

const PLL: AlgorithmCase[] = [
  // ── Edge permutations ─────────────────────────────────────────────────────
  { id:'PLL-Ua', set:'PLL', group:'U perms', name:'U perm (a)',
    algorithms:["R U' R U R U R U' R' U' R2", "M2 U M U2 M' U M2"] },
  { id:'PLL-Ub', set:'PLL', group:'U perms', name:'U perm (b)',
    algorithms:["R2 U R U R' U' R' U' R' U R'", "M2 U' M U2 M' U' M2"] },
  { id:'PLL-Z',  set:'PLL', group:'Z perm',  name:'Z perm',
    algorithms:["M2 U M2 U M' U2 M2 U2 M' U2"] },
  { id:'PLL-H',  set:'PLL', group:'H perm',  name:'H perm',
    algorithms:["M2 U M2 U2 M2 U M2"] },

  // ── Corner permutations ───────────────────────────────────────────────────
  { id:'PLL-Aa', set:'PLL', group:'A perms', name:'A perm (a)',
    algorithms:["x R' U R' D2 R U' R' D2 R2 x'", "l' U R' D2 R U' R' D2 R2 x'"] },
  { id:'PLL-Ab', set:'PLL', group:'A perms', name:'A perm (b)',
    algorithms:["x R2 D2 R U R' D2 R U' R x'"] },
  { id:'PLL-E',  set:'PLL', group:'E perm',  name:'E perm',
    algorithms:["x' R U' R' D R U R' D' R U R' D R U' R' D' x"] },

  // ── G perms ───────────────────────────────────────────────────────────────
  { id:'PLL-Ga', set:'PLL', group:'G perms', name:'G perm (a)',
    algorithms:["R2 U R' U R' U' R U' R2 D U' R' U R D'"] },
  { id:'PLL-Gb', set:'PLL', group:'G perms', name:'G perm (b)',
    algorithms:["R' U' R U D' R2 U R' U R U' R U' R2 D"] },
  { id:'PLL-Gc', set:'PLL', group:'G perms', name:'G perm (c)',
    algorithms:["R2 F2 R U2 R U2 R' F R U R' U' R' F R2"] },
  { id:'PLL-Gd', set:'PLL', group:'G perms', name:'G perm (d)',
    algorithms:["R U R' U' D R2 U' R U' R' U R' U R2 D'"] },

  // ── J perms ───────────────────────────────────────────────────────────────
  { id:'PLL-Ja', set:'PLL', group:'J perms', name:'J perm (a)',
    algorithms:["x R2 F R F' R U2 r' U r U2 x'", "R' U L' U2 R U' R' U2 R L"] },
  { id:'PLL-Jb', set:'PLL', group:'J perms', name:'J perm (b)',
    algorithms:["R U R' F' R U R' U' R' F R2 U' R'"] },

  // ── T perm ───────────────────────────────────────────────────────────────
  { id:'PLL-T',  set:'PLL', group:'T perm',  name:'T perm',
    algorithms:["R U R' U' R' F R2 U' R' U' R U R' F'"] },

  // ── F perm ───────────────────────────────────────────────────────────────
  { id:'PLL-F',  set:'PLL', group:'F perm',  name:'F perm',
    algorithms:["R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"] },

  // ── R perms ───────────────────────────────────────────────────────────────
  { id:'PLL-Ra', set:'PLL', group:'R perms', name:'R perm (a)',
    algorithms:["R U' R' U' R U R D R' U' R D' R' U2 R'"] },
  { id:'PLL-Rb', set:'PLL', group:'R perms', name:'R perm (b)',
    algorithms:["R2 F R U R U' R' F' R U2 R' U2 R"] },

  // ── N perms ───────────────────────────────────────────────────────────────
  { id:'PLL-Na', set:'PLL', group:'N perms', name:'N perm (a)',
    algorithms:["R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"] },
  { id:'PLL-Nb', set:'PLL', group:'N perms', name:'N perm (b)',
    algorithms:["R' U R U' R' F' U' F R U R' F R' F' R U' R"] },

  // ── V perm ───────────────────────────────────────────────────────────────
  { id:'PLL-V',  set:'PLL', group:'V perm',  name:'V perm',
    algorithms:["R' U R' d' R' F' R2 U' R' U R' F R F"] },

  // ── Y perm ───────────────────────────────────────────────────────────────
  { id:'PLL-Y',  set:'PLL', group:'Y perm',  name:'Y perm',
    algorithms:["F R U' R' U' R U R' F' R U R' U' R' F R F'"] },

  // ── Skip ──────────────────────────────────────────────────────────────────
  { id:'PLL-Skip', set:'PLL', group:'Skip', name:'PLL Skip', algorithms:["(already solved)"] },
]

// ── F2L (key cases) ───────────────────────────────────────────────────────────

const F2L: AlgorithmCase[] = [
  { id:'F2L-1',  set:'F2L', group:'Basic', name:'Easy 1 – Both in top, matched',
    algorithms:["U R U' R'"] },
  { id:'F2L-2',  set:'F2L', group:'Basic', name:'Easy 2 – Both in top, separated',
    algorithms:["U' F' U F"] },
  { id:'F2L-3',  set:'F2L', group:'Tricky', name:'Edge in slot, corner on top',
    algorithms:["R U R' U2 R U' R'", "R U' R' U R U' R'"] },
  { id:'F2L-4',  set:'F2L', group:'Tricky', name:'Corner in slot, edge on top',
    algorithms:["R U2 R' U' R U R'", "U R U' R' U' F' U F"] },
  { id:'F2L-5',  set:'F2L', group:'Tricky', name:'Corner flipped in slot',
    algorithms:["R U' R' U R U' R' U R U' R'"] },
  { id:'F2L-6',  set:'F2L', group:'Tricky', name:'Edge flipped',
    algorithms:["F' U F U2 F' U' F"] },
  { id:'F2L-7',  set:'F2L', group:'Paired', name:'Pair joined, wrong orientation',
    algorithms:["U R U2 R' U R U' R'", "U' F' U2 F U' F' U F"] },
  { id:'F2L-8',  set:'F2L', group:'Paired', name:'Pair joined, correct slot',
    algorithms:["R U' R'"] },
  { id:'F2L-9',  set:'F2L', group:'Back slot', name:'Both pieces in slots, wrong way',
    algorithms:["R U2 R' U2 R U' R'"] },
  { id:'F2L-10', set:'F2L', group:'Back slot', name:'Slot occupied, piece on top',
    algorithms:["U R U' R' U' F' U F", "R U' R' U2 F' U' F"] },
]

// ── Beginner's method ─────────────────────────────────────────────────────────

const BEGINNERS: AlgorithmCase[] = [
  { id:'BEG-1', set:'beginners', group:'Step 1', name:'White cross',
    algorithms:["(intuitive – get white edges to match centre colours)"] },
  { id:'BEG-2', set:'beginners', group:'Step 2', name:'White corners (insert)',
    algorithms:["R U R' U'  (repeat until corner drops)"] },
  { id:'BEG-3', set:'beginners', group:'Step 3', name:'Middle layer edges',
    algorithms:["U R U' R' U' F' U F", "U' L' U L U F U' F'"] },
  { id:'BEG-4', set:'beginners', group:'Step 4', name:'Yellow cross (OLL)',
    algorithms:["F R U R' U' F'"] },
  { id:'BEG-5', set:'beginners', group:'Step 5', name:'Orient yellow corners',
    algorithms:["R U R' U R U2 R'  (Sune – repeat as needed)"] },
  { id:'BEG-6', set:'beginners', group:'Step 6', name:'Permute yellow corners',
    algorithms:["U R U' L' U R' U' L"] },
  { id:'BEG-7', set:'beginners', group:'Step 7', name:'Cycle last layer edges',
    algorithms:["F2 U R' L F2 L' R U F2", "M2 U M2 U2 M2 U M2  (H perm)"] },
]

// ── Export ────────────────────────────────────────────────────────────────────

export const ALL_ALGORITHMS: AlgorithmCase[] = [
  ...OLL,
  ...PLL,
  ...F2L,
  ...BEGINNERS
]

export const ALGORITHM_SETS: AlgorithmSet[] = ['OLL', 'PLL', 'F2L', 'beginners']

export const SET_LABEL: Record<AlgorithmSet, string> = {
  OLL: 'OLL',
  PLL: 'PLL',
  F2L: 'F2L',
  beginners: "Beginner's"
}

export function getBySet(set: AlgorithmSet): AlgorithmCase[] {
  return ALL_ALGORITHMS.filter((a) => a.set === set)
}

export function groupCases(cases: AlgorithmCase[]): Map<string, AlgorithmCase[]> {
  const map = new Map<string, AlgorithmCase[]>()
  for (const c of cases) {
    const g = c.group ?? 'Other'
    if (!map.has(g)) map.set(g, [])
    map.get(g)!.push(c)
  }
  return map
}
