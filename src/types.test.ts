import { describe, it, expect } from 'vitest'
import type { ScreenId, FocusScope, ThemeTokens, KeyboardShortcut } from './types.js'
import {
  SCREEN_CATEGORIES,
  DEFAULT_SHORTCUTS,
  LAYOUT,
  FOCUS_SCOPE_PRIORITY,
} from './constants.js'

const _screenIdValues: ScreenId[] = [
  'dashboard',
  'plan',
  'lessons',
  'lessonDetail',
  'speak',
  'write',
  'stats',
  'review',
  'log',
  'config',
  'terminal',
]

const _focusScopeValues: FocusScope[] = [
  'navigation',
  'list',
  'command',
  'modal',
  'textinput',
]

const _shortcut: KeyboardShortcut = { keys: 'l', description: 'Lessons', scope: 'navigation' }

const _themeTokens: ThemeTokens = {
  colors: {
    text: { primary: '', secondary: '', muted: '', inverse: '' },
    status: { success: '', warning: '', error: '', info: '' },
    focus: { ring: '', active: '', selected: '' },
    surface: { base: '', elevated: '', overlay: '' },
    border: { default: '', focus: '', error: '' },
  },
  spacing: { xs: 1 },
  typography: { body: '' },
  borderStyles: { thin: '' },
}

describe('SCREEN_CATEGORIES', () => {
  it('groups main screens', () => {
    expect(SCREEN_CATEGORIES.main).toEqual(['dashboard', 'plan'])
  })

  it('groups learning screens', () => {
    expect(SCREEN_CATEGORIES.learning).toEqual([
      'lessons',
      'lessonDetail',
      'speak',
      'write',
      'stats',
      'review',
    ])
  })

  it('groups system screens', () => {
    expect(SCREEN_CATEGORIES.system).toEqual(['log', 'config', 'terminal'])
  })

  it('covers all ScreenId values exactly once', () => {
    const all = [
      ...SCREEN_CATEGORIES.main,
      ...SCREEN_CATEGORIES.learning,
      ...SCREEN_CATEGORIES.system,
    ]
    expect([...all].sort()).toEqual([..._screenIdValues].sort())
  })
})

describe('DEFAULT_SHORTCUTS', () => {
  it('maps b to dashboard', () => { expect(DEFAULT_SHORTCUTS.b).toBe('dashboard') })
  it('maps l to lessons', () => { expect(DEFAULT_SHORTCUTS.l).toBe('lessons') })
  it('maps s to speak', () => { expect(DEFAULT_SHORTCUTS.s).toBe('speak') })
  it('maps w to write', () => { expect(DEFAULT_SHORTCUTS.w).toBe('write') })
  it('maps t to stats', () => { expect(DEFAULT_SHORTCUTS.t).toBe('stats') })
  it('maps r to review', () => { expect(DEFAULT_SHORTCUTS.r).toBe('review') })
  it('maps c to config', () => { expect(DEFAULT_SHORTCUTS.c).toBe('config') })
  it('maps g to log', () => { expect(DEFAULT_SHORTCUTS.g).toBe('log') })
  it('maps x to terminal', () => { expect(DEFAULT_SHORTCUTS.x).toBe('terminal') })
  it('has the expected number of shortcuts', () => {
    expect(Object.keys(DEFAULT_SHORTCUTS)).toHaveLength(9)
  })
})

describe('LAYOUT', () => {
  it('has narrow breakpoint at 80', () => { expect(LAYOUT.narrow).toBe(80) })
  it('has medium breakpoint at 100', () => { expect(LAYOUT.medium).toBe(100) })
  it('has sidebar max items at 8', () => { expect(LAYOUT.sidebarMaxItems).toBe(8) })
  it('has list max visible at 10', () => { expect(LAYOUT.listMaxVisible).toBe(10) })
})

describe('FOCUS_SCOPE_PRIORITY', () => {
  it('assigns modal the highest priority (0)', () => { expect(FOCUS_SCOPE_PRIORITY.modal).toBe(0) })
  it('assigns command priority 1', () => { expect(FOCUS_SCOPE_PRIORITY.command).toBe(1) })
  it('assigns textinput priority 2', () => { expect(FOCUS_SCOPE_PRIORITY.textinput).toBe(2) })
  it('assigns list priority 3', () => { expect(FOCUS_SCOPE_PRIORITY.list).toBe(3) })
  it('assigns navigation the lowest priority (4)', () => { expect(FOCUS_SCOPE_PRIORITY.navigation).toBe(4) })
  it('covers all FocusScope values', () => {
    const scopes = Object.keys(FOCUS_SCOPE_PRIORITY).sort()
    expect(scopes).toEqual(_focusScopeValues.sort())
  })
  it('has unique priority values (no ties)', () => {
    const priorities = Object.values(FOCUS_SCOPE_PRIORITY)
    expect(new Set(priorities).size).toBe(priorities.length)
  })
})
