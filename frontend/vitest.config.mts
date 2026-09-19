import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The registry and every calculator module import through the "@/" alias, so
  // mirror the tsconfig path here rather than pulling in another dependency.
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // ui.store persists through localStorage, which Node either does not define
    // or defines without setItem depending on the version. See the setup file.
    setupFiles: ['./vitest.setup.ts'],
  },
})
