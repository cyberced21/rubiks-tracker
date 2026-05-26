import { ipcMain, dialog } from 'electron'
import {
  createSession,
  getSessions,
  deleteSession,
  createSolve,
  getSolves,
  updateSolvePenalty,
  updateSolveComment,
  deleteSolve,
  getAlgorithmProgress,
  upsertAlgorithmProgress,
  getSetting,
  setSetting,
  getAllSettings,
  exportDataAsJson,
  exportSolvesAsCsv,
  createBackup,
  restoreBackup,
  listBackups
} from './queries'
import { initDatabase } from './schema'
import { writeFileSync } from 'fs'

export function registerIpcHandlers(): void {
  // Sessions
  ipcMain.handle('db:session:create', (_, name: string, cubeType: string) =>
    createSession(name, cubeType)
  )
  ipcMain.handle('db:session:list', (_, cubeType?: string) =>
    getSessions(cubeType)
  )
  ipcMain.handle('db:session:delete', (_, id: number) =>
    deleteSession(id)
  )

  // Solves
  ipcMain.handle('db:solve:create', (_, input) =>
    createSolve(input)
  )
  ipcMain.handle('db:solve:list', (_, filters) =>
    getSolves(filters)
  )
  ipcMain.handle('db:solve:penalty', (_, id: number, penalty: 'none' | '+2' | 'dnf') =>
    updateSolvePenalty(id, penalty)
  )
  ipcMain.handle('db:solve:comment', (_, id: number, comment: string) =>
    updateSolveComment(id, comment)
  )
  ipcMain.handle('db:solve:delete', (_, id: number) =>
    deleteSolve(id)
  )

  // Algorithm progress
  ipcMain.handle('db:algo:list', (_, cubeType: string) =>
    getAlgorithmProgress(cubeType)
  )
  ipcMain.handle('db:algo:update', (_, cubeType, algorithmSet, caseId, rating, isFavorite) =>
    upsertAlgorithmProgress(cubeType, algorithmSet, caseId, rating, isFavorite)
  )

  // Settings
  ipcMain.handle('db:settings:get', (_, key: string) =>
    getSetting(key)
  )
  ipcMain.handle('db:settings:set', (_, key: string, value: string) =>
    setSetting(key, value)
  )
  ipcMain.handle('db:settings:all', () =>
    getAllSettings()
  )

  // Data export
  ipcMain.handle('db:export:json', async (event) => {
    const data = exportDataAsJson()
    const { canceled, filePath } = await dialog.showSaveDialog(
      { title: 'Export data', defaultPath: 'rubiks-tracker-export.json', filters: [{ name: 'JSON', extensions: ['json'] }] }
    )
    if (canceled || !filePath) return null
    writeFileSync(filePath, JSON.stringify(data, null, 2))
    return filePath
  })

  ipcMain.handle('db:export:csv', async (event, filters?) => {
    const csv = exportSolvesAsCsv(filters)
    const { canceled, filePath } = await dialog.showSaveDialog(
      { title: 'Export solves', defaultPath: 'rubiks-tracker-solves.csv', filters: [{ name: 'CSV', extensions: ['csv'] }] }
    )
    if (canceled || !filePath) return null
    writeFileSync(filePath, csv)
    return filePath
  })

  // Backup / Restore
  ipcMain.handle('db:backup:create', () =>
    createBackup()
  )

  ipcMain.handle('db:backup:list', () =>
    listBackups()
  )

  ipcMain.handle('db:backup:restore', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(
      { title: 'Restore backup', filters: [{ name: 'Database', extensions: ['db'] }], properties: ['openFile'] }
    )
    if (canceled || filePaths.length === 0) return null
    const success = restoreBackup(filePaths[0])
    if (success) {
      initDatabase() // Reopen the restored DB
    }
    return success
  })
}
