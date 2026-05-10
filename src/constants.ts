import type { ScreenId, FocusScope } from './types.js'

export const SCREEN_CATEGORIES = {
  main: ['dashboard', 'plan'] as ScreenId[],
  learning: ['lessons', 'lessonDetail', 'speak', 'write', 'stats', 'review'] as ScreenId[],
  system: ['log', 'config', 'terminal'] as ScreenId[],
} as const

export const DEFAULT_SHORTCUTS: Record<string, ScreenId> = {
  b: 'dashboard',
  l: 'lessons',
  s: 'speak',
  w: 'write',
  t: 'stats',
  r: 'review',
  c: 'config',
  g: 'log',
  x: 'terminal',
} as const

export const LAYOUT = {
  narrow: 80,
  medium: 100,
  sidebarMaxItems: 8,
  listMaxVisible: 10,
} as const

export const FOCUS_SCOPE_PRIORITY: Record<FocusScope, number> = {
  modal: 0,
  command: 1,
  textinput: 2,
  list: 3,
  navigation: 4,
} as const
