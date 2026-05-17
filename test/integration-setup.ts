/**
 * Integration test setup for Ink-based terminal UI tests.
 *
 * - Forces CI mode so Ink skips interactivity checks
 * - Pins terminal width for deterministic snapshot output
 * - Strips ANSI escape codes via `normalizeFrame()` helper
 * - Cleans up ink-testing-library renders after each test
 */
import { afterEach } from 'vitest'
import { cleanup } from 'ink-testing-library'
import stripAnsi from 'strip-ansi'

process.env.CI = 'true'
process.env.COLUMNS = '80'

afterEach(() => {
  cleanup()
})

/**
 * Normalize a terminal frame string by stripping ANSI escape codes.
 * Use this in assertions to get deterministic, human-readable output.
 *
 * @example
 *   const { lastFrame } = render(<MyComponent />)
 *   expect(normalizeFrame(lastFrame())).toContain('Hello')
 */
export function normalizeFrame(frame: string | undefined): string {
  return stripAnsi(frame ?? '')
}
