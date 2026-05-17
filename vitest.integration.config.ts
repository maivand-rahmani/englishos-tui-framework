import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'forks',
    retry: 1,
    testTimeout: 30000,
    passWithNoTests: true,
    setupFiles: ['./test/integration-setup.ts'],
    include: ['examples/__tests__/**/*.test.*'],
    exclude: ['src/**', 'node_modules/**'],
    snapshotFormat: undefined,
  },
})
