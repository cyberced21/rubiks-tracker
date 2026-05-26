import type { Session, Solve, AlgorithmProgress } from '../main/db/queries'

declare global {
  interface Window {
    api: {
      createSession: (name: string, cubeType: string) => Promise<Session>
      getSessions: (cubeType?: string) => Promise<Session[]>
      deleteSession: (id: number) => Promise<void>

      createSolve: (input: {
        sessionId: number
        cubeType: string
        timeMs: number
        scramble: string
        comment?: string
      }) => Promise<Solve>
      getSolves: (filters: {
        sessionId?: number
        cubeType?: string
        dateFrom?: number
        dateTo?: number
        limit?: number
        offset?: number
      }) => Promise<Solve[]>
      updateSolvePenalty: (id: number, penalty: 'none' | '+2' | 'dnf') => Promise<void>
      updateSolveComment: (id: number, comment: string) => Promise<void>
      deleteSolve: (id: number) => Promise<void>

      getAlgorithmProgress: (cubeType: string) => Promise<AlgorithmProgress[]>
      updateAlgorithmProgress: (
        cubeType: string,
        algorithmSet: string,
        caseId: string,
        rating: string,
        isFavorite: boolean
      ) => Promise<void>

      getSetting: (key: string) => Promise<string | null>
      setSetting: (key: string, value: string) => Promise<void>
      getAllSettings: () => Promise<Record<string, string>>
    }
  }
}
