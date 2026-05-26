import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Timer from './pages/Timer'
import Leaderboard from './pages/Leaderboard'
import Algorithms from './pages/Algorithms'
import Solver from './pages/Solver'
import Settings from './pages/Settings'

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
