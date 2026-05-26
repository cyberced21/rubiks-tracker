import { useEffect, useRef } from 'react'

// Register cubing.js TwistyPlayer web component once
let registered = false
function ensureRegistered() {
  if (registered) return
  registered = true
  import('cubing/twisty').catch(() => {/* handled below */})
}

interface AlgDiagramProps {
  alg: string
  size?: number
}

/**
 * Renders a 2D cube diagram using cubing.js TwistyPlayer web component.
 * Uses experimental-setup-alg so the diagram shows the CASE STATE
 * (what you see on the cube before applying the algorithm).
 */
export default function AlgDiagram({ alg, size = 80 }: AlgDiagramProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ensureRegistered()
  }, [])

  // Skip rendering for placeholder algs
  const isSkip = alg.startsWith('(')
  if (isSkip) {
    return (
      <div style={{ width: size, height: size, ...placeholderStyle }}>
        <span style={{ fontSize: 10, color: 'var(--green)' }}>SKIP</span>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      style={{ width: size, height: size, flexShrink: 0, borderRadius: 4, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{
        __html: `
          <twisty-player
            puzzle="3x3x3"
            experimental-setup-alg="${escapeAttr(alg)}"
            alg=""
            visualization="2D"
            hint-facelets="none"
            back-view="none"
            style="width:${size}px;height:${size}px;display:block;"
          ></twisty-player>
        `
      }}
    />
  )
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;')
}

const placeholderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-elevated)',
  borderRadius: 4
}
