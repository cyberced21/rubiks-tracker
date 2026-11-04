import { lazy, type JSX } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import Layout from './components/Layout'

// Pages are split into their own chunks so the heavy cubing.js modules
// (solver, scramble generator, 3D player) only load when a page needs them
const Timer = lazy(() => import('./pages/Timer'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Algorithms = lazy(() => import('./pages/Algorithms'))
const Solver = lazy(() => import('./pages/Solver'))
const Settings = lazy(() => import('./pages/Settings'))

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/timer" replace />} />
        <Route path="timer" element={<Timer />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="algorithms" element={<Algorithms />} />
        <Route path="solver" element={<Solver />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
