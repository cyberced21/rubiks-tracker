import { ipcMain } from 'electron'
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
  getAllSettings
} from './queries'

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
}
