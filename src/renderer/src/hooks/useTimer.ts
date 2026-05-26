import { useState, useEffect, useRef, useCallback } from 'react'
import type { TimerPhase } from '../types'

type SpacebarState = 'up' | 'holding' | 'ready'

export interface TimerResult {
  phase: TimerPhase
  spacebarState: SpacebarState
  displayMs: number
  inspectionElapsed: number
  inspectionPenalty: 'none' | '+2' | 'dnf'
  finalTimeMs: number | null
  reset: () => void
}

interface UseTimerOptions {
  inspectionEnabled: boolean
  holdThresholdMs: number
  onSolveComplete: (timeMs: number, penalty: 'none' | '+2' | 'dnf') => void
  onReset: () => void
}

/**
 * Core timer state machine.
 *
 * Phase transitions:
 *   idle → (hold space ≥ threshold) → ready → (release) → inspection → (hold+release) → running → (space) → stopped
 *   idle → (hold space ≥ threshold) → ready → (release, no inspection) → running → (space) → stopped
 *   stopped → (space) → idle  [caller provides new scramble via onReset]
 */
export function useTimer({
  inspectionEnabled,
  holdThresholdMs,
  onSolveComplete,
  onReset
}: UseTimerOptions): TimerResult {
  // ── Display state (drives renders) ──────────────────────────────────────
  const [phase, setPhaseState] = useState<TimerPhase>('idle')
  const [spacebarState, setSpacebarState] = useState<SpacebarState>('up')
  const [displayMs, setDisplayMs] = useState(0)
  const [inspectionElapsed, setInspectionElapsed] = useState(0)
  const [inspectionPenalty, setInspectionPenalty] = useState<'none' | '+2' | 'dnf'>('none')
  const [finalTimeMs, setFinalTimeMs] = useState<number | null>(null)

  // ── Refs (used in callbacks to avoid stale closures) ─────────────────────
  const phaseRef = useRef<TimerPhase>('idle')
  const spacebarRef = useRef<SpacebarState>('up')
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runStartRef = useRef<number | null>(null)
  const inspectionStartRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onSolveCompleteRef = useRef(onSolveComplete)
  const onResetRef = useRef(onReset)
  onSolveCompleteRef.current = onSolveComplete
  onResetRef.current = onReset

  // Helper: set phase in both state and ref atomically
  const setPhase = useCallback((p: TimerPhase) => {
    phaseRef.current = p
    setPhaseState(p)
  }, [])

  const setSpacer = useCallback((s: SpacebarState) => {
    spacebarRef.current = s
    setSpacebarState(s)
  }, [])

  // ── RAF loop for running timer ────────────────────────────────────────────
  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startRaf = useCallback(() => {
    runStartRef.current = Date.now()
    const tick = () => {
      setDisplayMs(Date.now() - runStartRef.current!)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  // ── Inspection interval ───────────────────────────────────────────────────
  const stopInspection = useCallback(() => {
    if (inspectionIntervalRef.current !== null) {
      clearInterval(inspectionIntervalRef.current)
      inspectionIntervalRef.current = null
    }
  }, [])

  const startInspection = useCallback(() => {
    inspectionStartRef.current = Date.now()
    setInspectionElapsed(0)
    setInspectionPenalty('none')

    inspectionIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - inspectionStartRef.current!
      const newPenalty =
        elapsed >= 17_000 ? 'dnf' : elapsed >= 15_000 ? '+2' : 'none'
      setInspectionElapsed(elapsed)
      setInspectionPenalty(newPenalty as 'none' | '+2' | 'dnf')

      // Auto-DNF at 17s
      if (elapsed >= 17_000 && phaseRef.current === 'inspection') {
        stopInspection()
        phaseRef.current = 'stopped'
        setPhaseState('stopped')
        setFinalTimeMs(null)
        onSolveCompleteRef.current(0, 'dnf')
      }
    }, 100)
  }, [stopInspection])

  // ── Hold threshold timeout ────────────────────────────────────────────────
  const clearHold = useCallback(() => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  // ── Stop running timer and record result ──────────────────────────────────
  const stopTimer = useCallback(() => {
    stopRaf()
    const elapsed = Date.now() - runStartRef.current!
    setDisplayMs(elapsed)
    setFinalTimeMs(elapsed)
    phaseRef.current = 'stopped'
    setPhaseState('stopped')
    onSolveCompleteRef.current(elapsed, 'none')
  }, [stopRaf])

  // ── Keyboard handlers ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (e.repeat) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      e.preventDefault()

      const phase = phaseRef.current
      const sb = spacebarRef.current

      if (phase === 'running') {
        stopTimer()
        return
      }

      if (phase === 'stopped') {
        // Any keydown on stopped → reset to idle
        phaseRef.current = 'idle'
        setPhaseState('idle')
        spacebarRef.current = 'up'
        setSpacebarState('up')
        setDisplayMs(0)
        setInspectionElapsed(0)
        setInspectionPenalty('none')
        setFinalTimeMs(null)
        onResetRef.current()
        return
      }

      if (sb === 'up') {
        spacebarRef.current = 'holding'
        setSpacebarState('holding')
        clearHold()
        holdTimerRef.current = setTimeout(() => {
          spacebarRef.current = 'ready'
          setSpacebarState('ready')
        }, holdThresholdMs)
      }
    },
    [stopTimer, clearHold, holdThresholdMs]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      e.preventDefault()

      const phase = phaseRef.current
      const sb = spacebarRef.current

      if (phase === 'running' || phase === 'stopped') return

      clearHold()

      if (sb === 'holding') {
        // Released before threshold — cancel
        spacebarRef.current = 'up'
        setSpacebarState('up')
        return
      }

      if (sb === 'ready') {
        spacebarRef.current = 'up'
        setSpacebarState('up')

        if (phase === 'inspection') {
          // Read current inspection penalty from ref state
          const elapsed = inspectionStartRef.current
            ? Date.now() - inspectionStartRef.current
            : 0
          const pen =
            elapsed >= 17_000 ? 'dnf' : elapsed >= 15_000 ? '+2' : 'none'
          stopInspection()
          if (pen === 'dnf') {
            phaseRef.current = 'stopped'
            setPhaseState('stopped')
            setFinalTimeMs(null)
            onSolveCompleteRef.current(0, 'dnf')
          } else {
            setInspectionPenalty(pen as 'none' | '+2' | 'dnf')
            // Store penalty for when solve is saved
            phaseRef.current = 'running'
            setPhaseState('running')
            startRaf()
          }
        } else {
          // idle → start
          if (inspectionEnabled) {
            phaseRef.current = 'inspection'
            setPhaseState('inspection')
            startInspection()
          } else {
            phaseRef.current = 'running'
            setPhaseState('running')
            setInspectionPenalty('none')
            startRaf()
          }
        }
      }
    },
    [clearHold, stopInspection, startInspection, startRaf, inspectionEnabled]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHold()
      stopRaf()
      stopInspection()
    }
  }, [clearHold, stopRaf, stopInspection])

  const reset = useCallback(() => {
    clearHold()
    stopRaf()
    stopInspection()
    phaseRef.current = 'idle'
    spacebarRef.current = 'up'
    setPhaseState('idle')
    setSpacebarState('up')
    setDisplayMs(0)
    setInspectionElapsed(0)
    setInspectionPenalty('none')
    setFinalTimeMs(null)
  }, [clearHold, stopRaf, stopInspection])

  return {
    phase,
    spacebarState,
    displayMs,
    inspectionElapsed,
    inspectionPenalty,
    finalTimeMs,
    reset
  }
}
