import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  css: {
    postcss: './postcss.config.js'
  }
})
