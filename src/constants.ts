import type { BuiltinFocusScope, FocusScope } from './types.js'

export const LAYOUT = {
  narrow: 80,
  medium: 100,
  sidebarMaxItems: 8,
  listMaxVisible: 10,
} as const

export const FOCUS_SCOPE_PRIORITY: Record<BuiltinFocusScope, number> = {
  modal: 0,
  command: 1,
  textinput: 2,
  list: 3,
  navigation: 4,
} as const

export function getScopePriority(scope: FocusScope): number {
  if (scope in FOCUS_SCOPE_PRIORITY) {
    return FOCUS_SCOPE_PRIORITY[scope as BuiltinFocusScope]
  }
  return 100
}
