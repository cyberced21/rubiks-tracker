import { describe, it, expect } from 'vitest'
import { formatTime, effectiveTime, formatSolveTime, formatInspection } from './time'

describe('formatTime', () => {
  it('formats sub-minute times as seconds', () => {
    expect(formatTime(12340)).toBe('12.34')
    expect(formatTime(5000)).toBe('5.00')
    expect(formatTime(990)).toBe('0.99')
  })

  it('formats times over a minute as m:ss.dd', () => {
    expect(formatTime(60000)).toBe('1:00.00')
    expect(formatTime(83450)).toBe('1:23.45')
    expect(formatTime(125000)).toBe('2:05.00')
  })

  it('returns DNF for non-finite values', () => {
    expect(formatTime(Infinity)).toBe('DNF')
    expect(formatTime(-Infinity)).toBe('DNF')
    expect(formatTime(NaN)).toBe('DNF')
  })
})

describe('effectiveTime', () => {
  it('returns raw time for no penalty', () => {
    expect(effectiveTime(5000, 'none')).toBe(5000)
  })

  it('adds 2 seconds for +2 penalty', () => {
    expect(effectiveTime(5000, '+2')).toBe(7000)
  })

  it('returns Infinity for DNF', () => {
    expect(effectiveTime(5000, 'dnf')).toBe(Infinity)
  })
})

describe('formatSolveTime', () => {
  it('formats normal solve', () => {
    expect(formatSolveTime(12340, 'none')).toBe('12.34')
  })

  it('formats +2 solve with plus suffix', () => {
    expect(formatSolveTime(12340, '+2')).toBe('14.34+')
  })

  it('returns DNF for dnf penalty', () => {
    expect(formatSolveTime(12340, 'dnf')).toBe('DNF')
  })
})

describe('formatInspection', () => {
  it('returns countdown for normal inspection', () => {
    const result = formatInspection(10000)
    expect(result.penalty).toBe('none')
    expect(result.display).toBe('5')
  })

  it('returns +2 between 15-17 seconds', () => {
    expect(formatInspection(15500).penalty).toBe('+2')
    expect(formatInspection(16999).penalty).toBe('+2')
  })

  it('returns DNF at 17+ seconds', () => {
    expect(formatInspection(17000).penalty).toBe('dnf')
    expect(formatInspection(20000).penalty).toBe('dnf')
  })
})
