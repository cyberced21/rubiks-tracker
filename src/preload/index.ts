import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Sessions
  createSession: (name: string, cubeType: string) =>
    ipcRenderer.invoke('db:session:create', name, cubeType),
  getSessions: (cubeType?: string) =>
    ipcRenderer.invoke('db:session:list', cubeType),
  deleteSession: (id: number) =>
    ipcRenderer.invoke('db:session:delete', id),

  // Solves
  createSolve: (input: {
    sessionId: number
    cubeType: string
    timeMs: number
    scramble: string
    comment?: string
  }) => ipcRenderer.invoke('db:solve:create', input),
  getSolves: (filters: {
    sessionId?: number
    cubeType?: string
    dateFrom?: number
    dateTo?: number
    limit?: number
    offset?: number
  }) => ipcRenderer.invoke('db:solve:list', filters),
  updateSolvePenalty: (id: number, penalty: 'none' | '+2' | 'dnf') =>
    ipcRenderer.invoke('db:solve:penalty', id, penalty),
  updateSolveComment: (id: number, comment: string) =>
    ipcRenderer.invoke('db:solve:comment', id, comment),
  deleteSolve: (id: number) =>
    ipcRenderer.invoke('db:solve:delete', id),

  // Algorithm progress
  getAlgorithmProgress: (cubeType: string) =>
    ipcRenderer.invoke('db:algo:list', cubeType),
  updateAlgorithmProgress: (
    cubeType: string,
    algorithmSet: string,
    caseId: string,
    rating: string,
    isFavorite: boolean
  ) => ipcRenderer.invoke('db:algo:update', cubeType, algorithmSet, caseId, rating, isFavorite),

  // Settings
  getSetting: (key: string) =>
    ipcRenderer.invoke('db:settings:get', key),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke('db:settings:set', key, value),
  getAllSettings: () =>
    ipcRenderer.invoke('db:settings:all'),

  // Data export
  exportJson: () =>
    ipcRenderer.invoke('db:export:json'),
  exportCsv: (filters?: {
    sessionId?: number
    cubeType?: string
    dateFrom?: number
    dateTo?: number
  }) => ipcRenderer.invoke('db:export:csv', filters),

  // Backup / Restore
  createBackup: () =>
    ipcRenderer.invoke('db:backup:create'),
  listBackups: () =>
    ipcRenderer.invoke('db:backup:list'),
  restoreBackup: () =>
    ipcRenderer.invoke('db:backup:restore')
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-ignore (fallback for non-isolated contexts in dev)
  window.api = api
}
