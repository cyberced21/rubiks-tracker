/**
 * Postinstall script — runs after npm install.
 * 1. Downloads the Electron binary (if missing).
 * 2. Downloads the better-sqlite3 prebuilt for the installed Electron version.
 */
const { execSync, spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const root = path.resolve(__dirname, '..')

// ── 1. Electron binary ────────────────────────────────────────────────────
const electronInstall = path.join(root, 'node_modules', 'electron', 'install.js')
if (fs.existsSync(electronInstall)) {
  console.log('[postinstall] Installing Electron binary...')
  try {
    execSync(`node "${electronInstall}"`, { stdio: 'inherit', cwd: root })
  } catch (e) {
    console.warn('[postinstall] Electron binary install failed (may already be cached):', e.message)
  }
}

// ── 2. better-sqlite3 prebuilt for Electron ───────────────────────────────
const electronPkg = path.join(root, 'node_modules', 'electron', 'package.json')
if (!fs.existsSync(electronPkg)) {
  console.warn('[postinstall] Could not find electron package — skipping better-sqlite3 rebuild')
  process.exit(0)
}

const electronVersion = JSON.parse(fs.readFileSync(electronPkg, 'utf8')).version
const sqliteDir = path.join(root, 'node_modules', 'better-sqlite3')
const prebuildBin = path.join(root, 'node_modules', 'prebuild-install', 'bin.js')

if (!fs.existsSync(sqliteDir) || !fs.existsSync(prebuildBin)) {
  console.warn('[postinstall] better-sqlite3 or prebuild-install not found — skipping')
  process.exit(0)
}

console.log(`[postinstall] Fetching better-sqlite3 prebuilt for Electron ${electronVersion}...`)
const result = spawnSync(
  process.execPath,
  [prebuildBin, '--runtime', 'electron', '--target', electronVersion, '--arch', 'x64'],
  { stdio: 'inherit', cwd: sqliteDir }
)

if (result.status !== 0) {
  console.error(
    '[postinstall] No prebuilt found for this Electron version. ' +
    'Install "Desktop development with C++" via Visual Studio Installer to compile from source.'
  )
  process.exit(1)
}

console.log('[postinstall] Done.')
