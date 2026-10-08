import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// main/preload externalize package.json dependencies by default (build.externalizeDeps)
export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    build: {
      // electron-vite leaves the renderer unminified by default
      minify: true,
      // cubing.js starts its search worker from a chunk in the main graph. Keep
      // Vite's dynamic-import helper out of the app entry (which touches
      // `document` on load) and skip modulepreload links, which the helper
      // would otherwise build with `document` inside the worker.
      modulePreload: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('vite/preload-helper')) return 'preload-helper'
            return undefined
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ['cubing']
    },
    worker: {
      format: 'es'
    }
  }
})
