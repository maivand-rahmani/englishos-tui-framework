import { describe, it, expect, beforeEach } from 'vitest'
import { ScreenRegistry } from './registry.js'
import type { ScreenDefinition } from './screen.js'

const sampleScreen: ScreenDefinition = {
  id: 'dashboard',
  title: 'Dashboard',
  component: () => null,
  category: 'main',
  sidebar: true,
}

const secondScreen: ScreenDefinition = {
  id: 'lessons',
  title: 'Lessons',
  component: () => null,
  category: 'learning',
  sidebar: true,
}

const systemScreen: ScreenDefinition = {
  id: 'config',
  title: 'Configuration',
  component: () => null,
  category: 'system',
  sidebar: false,
}

describe('ScreenRegistry', () => {
  let registry: ScreenRegistry

  beforeEach(() => {
    registry = new ScreenRegistry()
  })

  it('register and get a screen', () => {
    registry.register(sampleScreen)
    const result = registry.get('dashboard')
    expect(result.id).toBe('dashboard')
    expect(result.title).toBe('Dashboard')
    expect(result.category).toBe('main')
  })

  it('getAll returns all registered screens', () => {
    registry.register(sampleScreen)
    registry.register(secondScreen)
    expect(registry.getAll()).toHaveLength(2)
  })

  it('getAllByCategory filters correctly', () => {
    registry.register(sampleScreen)
    registry.register(secondScreen)
    registry.register(systemScreen)
    expect(registry.getAllByCategory('main')).toHaveLength(1)
    expect(registry.getAllByCategory('learning')).toHaveLength(1)
    expect(registry.getAllByCategory('system')).toHaveLength(1)
  })

  it('get throws for nonexistent screen', () => {
    expect(() => registry.get('nonexistent')).toThrow(
      'Screen "nonexistent" not found in registry',
    )
  })

  it('register throws on duplicate id', () => {
    registry.register(sampleScreen)
    expect(() => registry.register(sampleScreen)).toThrow(
      'Screen "dashboard" is already registered',
    )
  })

  it('has returns true for existing screen', () => {
    registry.register(sampleScreen)
    expect(registry.has('dashboard')).toBe(true)
  })

  it('has returns false for missing screen', () => {
    expect(registry.has('nonexistent')).toBe(false)
  })

  it('unregister removes a screen', () => {
    registry.register(sampleScreen)
    registry.unregister('dashboard')
    expect(registry.has('dashboard')).toBe(false)
  })

  it('unregister throws for nonexistent screen', () => {
    expect(() => registry.unregister('nonexistent')).toThrow(
      'Screen "nonexistent" not found in registry',
    )
  })

  it('getAllByCategory with no matches returns empty array', () => {
    registry.register(sampleScreen)
    expect(registry.getAllByCategory('system')).toEqual([])
  })
})
