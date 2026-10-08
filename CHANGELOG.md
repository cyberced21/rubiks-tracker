# Changelog

All notable changes to Rubiks Tracker will be documented in this file.

## [Unreleased]

### Fixed
- Linux AppImage builds: better-sqlite3 13 ships N-API prebuilds for every platform, so the
  Windows-only native rebuild postinstall script is gone
- Preload API typings now include the export and backup methods
- Save/open dialogs are now modal to the app window
- Scramble generation: cubing.js's search worker failed to start because it loaded the app entry
  chunk (`document is not defined`)

### Changed
- Switched to pnpm as the single package manager
- Upgraded to Electron 44, React 19, React Router 8, Vite 7, electron-vite 5, Vitest 5,
  TypeScript 7, electron-builder 26, cubing 0.63 and lucide-react 1.x
- CI runs typecheck and tests, and builds installers on pull requests
- Hardened packaged builds with Electron fuses (no run-as-node, no NODE_OPTIONS / inspect flags)
- Removed unused zustand and @electron-toolkit/preload dependencies
- Renderer runs with Electron's process sandbox enabled
- Pages are lazy-loaded and the renderer bundle is minified (entry chunk 1 MB → 270 KB)
- Packaged app payload shrank from 84 MB to 6 MB: renderer libraries are no longer shipped twice,
  and only the target platform's SQLite binary is included
- Packaging config moved to `electron-builder.ts`; Windows release builds can be signed with
  Azure Artifact Signing

## [1.0.0] - 2026-05-27

### Added
- Personal Rubik's cube solve tracker with timer and statistics
- SQLite database for persistent solve storage
- Data export functionality
- Backup and restore support
- Database migrations system
- Keyboard shortcuts
- App icon and branding
- GitHub Actions workflow for automated Windows builds
- Test suite with Vitest

### Tech Stack
- Electron + React 18 + TypeScript
- Vite build system via electron-vite
- SQLite via better-sqlite3
- Zustand for state management
- React Router for navigation
- Lucide React for icons
- Cubing library for cube visualization
