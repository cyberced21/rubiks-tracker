// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

let userData: string

vi.mock('electron', () => ({
  app: { getPath: () => userData }
}))

const { initDatabase, getDb, getDbPath } = await import('./schema')
const { createSolve, getSolves, createBackup, restoreBackup, listBackups } = await import('./queries')

function addSolves(count: number): void {
  for (let i = 0; i < count; i++) {
    createSolve({ sessionId: 1, cubeType: '3x3', timeMs: 1000 + i, scramble: 'R U' })
  }
}

beforeEach(() => {
  userData = mkdtempSync(join(tmpdir(), 'rubiks-tracker-test-'))
  initDatabase()
})

afterEach(() => {
  getDb().close()
  rmSync(userData, { recursive: true, force: true })
})

describe('getSolves paging', () => {
  it('applies limit and offset', () => {
    addSolves(5)
    expect(getSolves({ limit: 2 }).map((s) => s.time_ms)).toEqual([1000, 1001])
    expect(getSolves({ limit: 2, offset: 2 }).map((s) => s.time_ms)).toEqual([1002, 1003])
  })

  it('accepts an offset without a limit', () => {
    addSolves(5)
    expect(getSolves({ offset: 3 }).map((s) => s.time_ms)).toEqual([1003, 1004])
  })

  it('binds paging values instead of interpolating them', () => {
    addSolves(1)
    const injected = { limit: '1; DROP TABLE solves' as unknown as number }
    expect(() => getSolves(injected)).toThrow()
    expect(getSolves({})).toHaveLength(1)
  })
})

describe('backup and restore', () => {
  it('createBackup resolves once the backup file is complete', async () => {
    addSolves(3)
    const path = await createBackup()
    expect(existsSync(path)).toBe(true)
    expect(listBackups().map((b) => b.path)).toContain(path)
  })

  it('restores the data from a backup', async () => {
    addSolves(2)
    const backup = await createBackup()
    addSolves(3)
    expect(getSolves({})).toHaveLength(5)

    expect(await restoreBackup(backup)).toBe(true)
    expect(getSolves({})).toHaveLength(2)
    expect(existsSync(`${getDbPath()}.restoring`)).toBe(false)
  })

  it('keeps a pre-restore backup of the replaced data', async () => {
    const backup = await createBackup()
    addSolves(4)
    await restoreBackup(backup)

    const preRestore = listBackups().find((b) => b.name.startsWith('pre-restore-'))
    expect(preRestore).toBeDefined()
    expect(await restoreBackup(preRestore!.path)).toBe(true)
    expect(getSolves({})).toHaveLength(4)
  })

  it('rejects a file that is not a valid backup and leaves data untouched', async () => {
    addSolves(2)
    const bogus = join(userData, 'not-a-backup.db')
    writeFileSync(bogus, 'definitely not sqlite')

    expect(await restoreBackup(bogus)).toBe(false)
    expect(getSolves({})).toHaveLength(2)
    expect(listBackups()).toHaveLength(0)
    expect(existsSync(`${getDbPath()}.restoring`)).toBe(false)
  })

  it('returns false for a missing file', async () => {
    expect(await restoreBackup(join(userData, 'missing.db'))).toBe(false)
  })
})
