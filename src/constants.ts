import type { BuiltinFocusScope, FocusScope } from './types.js'

export const LAYOUT = {
  narrow: 80,
  medium: 100,
  sidebarMaxItems: 8,
  listMaxVisible: 10,
} as const

export const FOCUS_SCOPE_PRIORITY: Record<BuiltinFocusScope, number> = {
  modal: 0,
  process: 1,
  command: 2,
  textinput: 3,
  list: 4,
  navigation: 5,
} as const

export function getScopePriority(scope: FocusScope): number {
  if (scope in FOCUS_SCOPE_PRIORITY) {
    return FOCUS_SCOPE_PRIORITY[scope as BuiltinFocusScope]
  }
  return 100
}
