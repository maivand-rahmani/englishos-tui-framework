import { describe, it, expect } from 'vitest'
import type { FocusScope, ThemeTokens, KeyboardShortcut } from './types.js'
import {
  LAYOUT,
  FOCUS_SCOPE_PRIORITY,
  getScopePriority,
} from './constants.js'

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
  it('assigns low precedence to custom scopes', () => {
    expect(getScopePriority('my-custom-scope' as FocusScope)).toBe(100)
  })
})
