import { describe, it, expect } from 'vitest'
import { migrations } from './migrations'

describe('migrations', () => {
  it('has sequential version numbers starting from 1', () => {
    for (let i = 0; i < migrations.length; i++) {
      expect(migrations[i].version).toBe(i + 1)
    }
  })

  it('every migration has a description', () => {
    for (const m of migrations) {
      expect(m.description).toBeTruthy()
      expect(typeof m.description).toBe('string')
    }
  })

  it('every migration has an up function', () => {
    for (const m of migrations) {
      expect(typeof m.up).toBe('function')
    }
  })

  it('has no duplicate version numbers', () => {
    const versions = migrations.map((m) => m.version)
    expect(new Set(versions).size).toBe(versions.length)
  })
})
