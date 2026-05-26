import { NavLink } from 'react-router-dom'
import { Timer, Trophy, BookOpen, RotateCcw, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/timer',       label: 'Timer',       Icon: Timer },
  { to: '/leaderboard', label: 'Leaderboard', Icon: Trophy },
  { to: '/algorithms',  label: 'Algorithms',  Icon: BookOpen },
  { to: '/solver',      label: 'Solver',      Icon: RotateCcw },
  { to: '/settings',    label: 'Settings',    Icon: Settings }
]

export default function Sidebar(): JSX.Element {
  return (
    <nav style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>⬛</span>
        <span style={styles.logoText}>RubiksTracker</span>
      </div>

      <ul style={styles.navList}>
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to} style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {})
            })}>
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      flexShrink: 0
                    }}
                  />
                  <span style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100%',
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    padding: '0 0 16px 0'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 20px 24px',
    borderBottom: '1px solid var(--border-subtle)'
  },
  logoIcon: {
    fontSize: 20
  },
  logoText: {
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: '-0.3px',
    color: 'var(--text-primary)'
  },
  navList: {
    listStyle: 'none',
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 'var(--radius-sm)',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
    transition: 'background 0.1s'
  },
  navItemActive: {
    background: 'var(--accent-dim)'
  }
}
