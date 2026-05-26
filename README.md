# Rubik's Tracker

A personal Rubik's cube solve tracker built with Electron, React, and TypeScript.

## Features

- Track solve times across different cube types (2x2 through 7x7)
- Session-based solve grouping
- Statistics: averages (Ao5, Ao12, Ao100), best/worst times, standard deviation
- Interactive scramble visualization using `cubing.js`
- Local SQLite database — your data stays on your machine

## Tech Stack

- **Electron** + **electron-vite** — desktop shell and build tooling
- **React 18** + **TypeScript** — UI
- **Zustand** — state management
- **better-sqlite3** — local persistence
- **Lucide React** — icons

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for Windows
npm run build:win
```

## License

[MIT](LICENSE)
