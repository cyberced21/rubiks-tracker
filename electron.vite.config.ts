import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Applied to production builds only: the dev server relies on inline scripts
// (React Refresh) and a websocket for HMR. cubing.js needs WebAssembly
// ('wasm-unsafe-eval') and may wrap its search worker in a blob: URL.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ')

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: contentSecurityPolicy },
        injectTo: 'head-prepend'
      }
    ]
  }
}

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
    plugins: [react(), cspPlugin()],
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
