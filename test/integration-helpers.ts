import { render as inkRender } from 'ink-testing-library'
import type { ReactElement } from 'react'
import { normalizeFrame } from './integration-setup.js'
import { appendFileSync, mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

export { normalizeFrame }

/**
 * Render an Ink element and return helpers.
 * Wraps ink-testing-library render for consistent usage.
 */
export function renderApp(ui: ReactElement) {
  return inkRender(ui)
}

/**
 * Write scenario evidence to a file.
 * Creates text content suitable for CI artifact upload.
 */
export function appendEvidence(path: string, content: string): void {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  appendFileSync(path, content + '\n')
}

/**
 * Simulate a sequence of keyboard events via stdin.
 * Each entry is a string passed to stdin.write().
 * Includes a delay between events for React batching.
 */
export async function typeSequence(
  stdin: { write(data: string): boolean },
  keys: string[],
  delayMs = 50,
): Promise<void> {
  for (const key of keys) {
    stdin.write(key)
    await new Promise((r) => setTimeout(r, delayMs))
  }
}

/**
 * Fast delay helper for test timing.
 */
export function delay(ms = 50): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
