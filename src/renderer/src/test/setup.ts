import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock the Electron preload API
const mockApi = {
  createSession: vi.fn(),
  getSessions: vi.fn().mockResolvedValue([]),
  deleteSession: vi.fn(),
  createSolve: vi.fn(),
  getSolves: vi.fn().mockResolvedValue([]),
  updateSolvePenalty: vi.fn(),
  updateSolveComment: vi.fn(),
  deleteSolve: vi.fn(),
  getAlgorithmProgress: vi.fn().mockResolvedValue([]),
  updateAlgorithmProgress: vi.fn(),
  getSetting: vi.fn().mockResolvedValue(null),
  setSetting: vi.fn(),
  getAllSettings: vi.fn().mockResolvedValue({
    inspection_enabled: 'true',
    timer_hold_ms: '550',
    active_cube_type: '3x3',
    active_session_id: '1',
  }),
  exportJson: vi.fn(),
  exportCsv: vi.fn(),
  createBackup: vi.fn(),
  listBackups: vi.fn().mockResolvedValue([]),
  restoreBackup: vi.fn(),
}

Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true,
})
