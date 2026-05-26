import { useState, useEffect } from 'react'
import type { AppSettings } from '../types'

const DEFAULT_SETTINGS: AppSettings = {
  inspection_enabled: true,
  timer_hold_ms: 550,
  active_cube_type: '3x3',
  active_session_id: 1,
}

export default function Settings(): JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getAllSettings().then((raw) => {
      setSettings({
        inspection_enabled: raw.inspection_enabled === 'true',
        timer_hold_ms: Number(raw.timer_hold_ms ?? 550),
        active_cube_type: (raw.active_cube_type as AppSettings['active_cube_type']) ?? '3x3',
        active_session_id: Number(raw.active_session_id ?? 1),
      })
      setLoading(false)
    })
  }, [])

  const save = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    await window.api.setSetting('inspection_enabled', String(next.inspection_enabled))
    await window.api.setSetting('timer_hold_ms', String(next.timer_hold_ms))
    await window.api.setSetting('active_cube_type', next.active_cube_type)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  if (loading) return <div style={styles.page}><span style={styles.muted}>Loading…</span></div>

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <h2 style={styles.title}>Settings</h2>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Timer</h3>

          <SettingRow
            label="WCA Inspection"
            description="15-second inspection countdown before each solve (+2 at 15s, DNF at 17s)"
          >
            <Toggle
              value={settings.inspection_enabled}
              onChange={(v) => save({ inspection_enabled: v })}
            />
          </SettingRow>

          <SettingRow
            label="Hold-to-start threshold"
            description="How long you must hold the spacebar before the timer arms (ms)"
          >
            <div style={styles.sliderGroup}>
              <input
                type="range"
                min={200}
                max={1000}
                step={50}
                value={settings.timer_hold_ms}
                onChange={(e) => save({ timer_hold_ms: Number(e.target.value) })}
                style={styles.slider}
              />
              <span style={styles.sliderValue}>{settings.timer_hold_ms} ms</span>
            </div>
          </SettingRow>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Cube</h3>

          <SettingRow
            label="Default cube type"
            description="Cube type used for new sessions"
          >
            <select
              value={settings.active_cube_type}
              onChange={(e) => save({ active_cube_type: e.target.value as AppSettings['active_cube_type'] })}
              style={styles.select}
            >
              <option value="3x3">3×3×3</option>
              <option value="2x2" disabled>2×2×2 (coming soon)</option>
              <option value="4x4" disabled>4×4×4 (coming soon)</option>
            </select>
          </SettingRow>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Data</h3>

          <SettingRow
            label="Export solves"
            description="Save all your solve data as JSON or CSV"
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <ActionButton label="JSON" onClick={async () => {
                const path = await window.api.exportJson()
                if (path) { setSaved(true); setTimeout(() => setSaved(false), 1500) }
              }} />
              <ActionButton label="CSV" onClick={async () => {
                const path = await window.api.exportCsv()
                if (path) { setSaved(true); setTimeout(() => setSaved(false), 1500) }
              }} />
            </div>
          </SettingRow>

          <SettingRow
            label="Backup database"
            description="Create a full backup of your database"
          >
            <ActionButton label="Backup" onClick={async () => {
              await window.api.createBackup()
              setSaved(true); setTimeout(() => setSaved(false), 1500)
            }} />
          </SettingRow>

          <SettingRow
            label="Restore from backup"
            description="Replace current data with a backup file"
          >
            <ActionButton label="Restore" onClick={async () => {
              const ok = await window.api.restoreBackup()
              if (ok) { window.location.reload() }
            }} />
          </SettingRow>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Keyboard Shortcuts</h3>
          <div style={styles.shortcutList}>
            <ShortcutRow keys="Space" description="Start / stop timer" />
            <ShortcutRow keys="Escape" description="Cancel current solve" />
            <ShortcutRow keys="1" description="No penalty" />
            <ShortcutRow keys="2" description="+2 penalty" />
            <ShortcutRow keys="3" description="DNF" />
            <ShortcutRow keys="Delete" description="Delete last solve" />
          </div>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>About</h3>
          <div style={styles.aboutCard}>
            <p style={styles.aboutItem}><span style={styles.aboutLabel}>App</span> Rubik's Tracker</p>
            <p style={styles.aboutItem}><span style={styles.aboutLabel}>Stack</span> Electron · React · SQLite · cubing.js</p>
          </div>
        </section>

        {saved && <div style={styles.toast}>Saved ✓</div>}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SettingRow({ label, description, children }: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div style={styles.row}>
      <div style={styles.rowLabel}>
        <span style={styles.label}>{label}</span>
        <span style={styles.desc}>{description}</span>
      </div>
      <div style={styles.rowControl}>{children}</div>
    </div>
  )
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={styles.actionBtn}>
      {label}
    </button>
  )
}

function ShortcutRow({ keys, description }: { keys: string; description: string }) {
  return (
    <div style={styles.shortcutRow}>
      <kbd style={styles.kbd}>{keys}</kbd>
      <span style={styles.shortcutDesc}>{description}</span>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        ...styles.toggle,
        background: value ? 'var(--accent)' : 'var(--bg-elevated)',
        border: value ? '1px solid var(--accent)' : '1px solid var(--border)',
      }}
      aria-pressed={value}
    >
      <div style={{
        ...styles.toggleKnob,
        transform: value ? 'translateX(20px)' : 'translateX(2px)',
        background: value ? '#fff' : 'var(--text-muted)',
      }} />
    </button>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--bg-base)',
    overflowY: 'auto',
  },
  content: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '28px 24px 40px',
    width: '100%',
  },
  title: {
    margin: '0 0 24px',
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    margin: '0 0 12px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    paddingBottom: 8,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid var(--border)',
    gap: 24,
  },
  rowLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  desc: {
    fontSize: 12,
    color: 'var(--text-muted)',
    maxWidth: 380,
  },
  rowControl: {
    flexShrink: 0,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    cursor: 'pointer',
    position: 'relative',
    padding: 0,
    transition: 'background 0.2s, border 0.2s',
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    position: 'absolute',
    top: 2,
    transition: 'transform 0.2s',
  },
  sliderGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  slider: {
    width: 120,
    accentColor: 'var(--accent)',
    cursor: 'pointer',
  },
  sliderValue: {
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    minWidth: 52,
  },
  select: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: 13,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  aboutCard: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  aboutItem: {
    margin: 0,
    fontSize: 13,
    color: 'var(--text-primary)',
    display: 'flex',
    gap: 12,
  },
  aboutLabel: {
    color: 'var(--text-muted)',
    minWidth: 48,
  },
  actionBtn: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: 13,
    padding: '6px 14px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background 0.15s',
  },
  shortcutList: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '4px 16px',
  },
  shortcutRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
  },
  kbd: {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    minWidth: 60,
    textAlign: 'center' as const,
  },
  shortcutDesc: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  muted: {
    color: 'var(--text-muted)',
    fontSize: 14,
    margin: 'auto',
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    background: 'var(--green)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 100,
  },
}
