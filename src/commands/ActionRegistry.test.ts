import { describe, it, expect, beforeEach } from 'vitest'
import { ActionRegistry } from './ActionRegistry.js'

function createTestRegistry() {
  const r = new ActionRegistry()
  r.register({
    id: 'start',
    label: 'Start Daily Plan',
    description: 'Begin your daily learning session',
    category: 'learning',
    handler: () => {},
  })
  r.register({
    id: 'speak',
    label: 'Speaking Practice',
    description: 'Practice speaking with AI feedback',
    category: 'learning',
    handler: () => {},
  })
  r.register({
    id: 'write',
    label: 'Writing Practice',
    description: 'Practice writing with AI corrections',
    category: 'learning',
    handler: () => {},
  })
  r.register({
    id: 'stats',
    label: 'View Statistics',
    description: 'Show your progress and statistics',
    category: 'system',
    handler: () => {},
    shortcut: 't',
  })
  r.register({
    id: 'config',
    label: 'Configuration',
    description: 'Configure app settings',
    category: 'system',
    handler: () => {},
    shortcut: 'c',
  })
  r.register({
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Go to the main dashboard',
    category: 'navigation',
    handler: () => {},
    shortcut: 'b',
  })
  return r
}

describe('ActionRegistry', () => {
  let registry: ActionRegistry

  beforeEach(() => {
    registry = createTestRegistry()
  })

  it('registers and retrieves an action', () => {
    const action = registry.get('start')
    expect(action).toBeDefined()
    expect(action!.label).toBe('Start Daily Plan')
  })

  it('returns undefined for unknown action', () => {
    expect(registry.get('nonexistent')).toBeUndefined()
  })

  it('returns all registered actions', () => {
    expect(registry.getAll()).toHaveLength(6)
  })

  it('has returns true for registered action', () => {
    expect(registry.has('speak')).toBe(true)
  })

  it('has returns false for unknown action', () => {
    expect(registry.has('nope')).toBe(false)
  })

  it('throws on duplicate registration', () => {
    expect(() =>
      registry.register({
        id: 'start',
        label: 'Duplicate',
        category: 'other',
        handler: () => {},
      }),
    ).toThrow('Action "start" is already registered')
  })

  it('unregisters an action', () => {
    registry.unregister('config')
    expect(registry.has('config')).toBe(false)
    expect(registry.getAll()).toHaveLength(5)
  })

  it('throws on unregistering unknown action', () => {
    expect(() => registry.unregister('nope')).toThrow(
      'Action "nope" not found in registry',
    )
  })

  it('searches by label (exact match highest score)', () => {
    const results = registry.search('Speaking Practice')
    expect(results[0].action.id).toBe('speak')
    expect(results[0].score).toBeGreaterThan(0)
  })

  it('searches by label (partial match)', () => {
    const results = registry.search('speak')
    expect(results).toHaveLength(1)
    expect(results[0].action.id).toBe('speak')
  })

  it('searches by id', () => {
    const results = registry.search('config')
    expect(results).toHaveLength(1)
    expect(results[0].action.id).toBe('config')
  })

  it('searches by description', () => {
    const results = registry.search('statistics')
    expect(results).toHaveLength(1)
    expect(results[0].action.id).toBe('stats')
  })

  it('returns all actions for empty query', () => {
    const results = registry.search('')
    expect(results).toHaveLength(6)
  })

  it('returns all actions for whitespace query', () => {
    const results = registry.search('   ')
    expect(results).toHaveLength(6)
  })

  it('returns empty for unmatched query', () => {
    const results = registry.search('zzzzz')
    expect(results).toHaveLength(0)
  })

  it('sorts results by score descending', () => {
    const results = registry.search('st')
    expect(results.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('fuzzy matches characters in order', () => {
    const results = registry.search('spk')
    expect(results).toHaveLength(1)
    expect(results[0].action.id).toBe('speak')
  })

  it('does not match out-of-order characters', () => {
    const results = registry.search('ksp')
    const speak = results.find((r) => r.action.id === 'speak')
    expect(speak).toBeUndefined()
  })
})
