// ── Focus Scopes ──
export type BuiltinFocusScope =
  | 'navigation'
  | 'list'
  | 'command'
  | 'modal'
  | 'textinput'
  | 'process'

/**
 * Framework consumers can introduce additional scopes by using string literals.
 * Built-ins are still strongly typed for the default interaction model.
 */
export type FocusScope = BuiltinFocusScope | (string & {})

// ── v2: Normalized Key Event (maps Ink's raw (input, key) into a predictable shape) ──
export interface NormalizedKeyEvent {
  /** Printable character string (empty for non-printable keys). */
  text: string
  /** Lowercase letter for a-z, or key name for specials: 'enter','escape','tab','backspace','delete','up','down','left','right','space' */
  key: string
  /** Physical key code (same as event.key). */
  code: string
  /** True if this key produces visible text. */
  isPrintable: boolean
  /** Semantic flags for common actions. */
  backspace: boolean
  enter: boolean
  escape: boolean
  tab: boolean
  space: boolean
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  /** Modifier states. */
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
  /** Original Ink input string. */
  rawInput: string
}

// ── v2: Structured Consumption Result ──
export enum InputConsumptionResult {
  /** Event not consumed; should continue to next handler. */
  NotConsumed = 0,
  /** Event consumed; stop propagation to siblings but allow unrelated scopes. */
  Consumed = 1,
  /** Event consumed AND trapped; no further propagation to any scope. */
  ConsumedAndTrapped = 2,
}

// ── v2: Scope Entry (describes one level in the scope stack) ──
export interface ScopeEntry {
  /** Unique scope identifier (e.g. 'modal', 'textinput', 'practice'). */
  id: FocusScope
  /** Priority within the stack (lower = higher precedence for same-depth scopes). */
  priority: number
  /** When true, prevents events from bubbling past this scope. */
  trapsInput: boolean
  /** When true, unconsumed events may bubble to parent scopes. */
  allowsBubbling: boolean
  /** When false, shell/global shortcuts are suspended while this scope is deepest active. */
  globalShortcutsEnabled: boolean
}

// ── v2: Focus Tree Node ──
export type FocusNodeType = 'zone' | 'group' | 'focusable'

export interface FocusNodeInfo {
  id: string
  type: FocusNodeType
  parentId: string | null
  isActive: boolean
  label?: string
}

// ── v2: Action / Hotkey Categories ──
export type ActionCategory = 'system' | 'navigation' | 'context' | 'input'

// ── Theme Tokens Interface ──
export interface ThemeTokens {
  colors: {
    text: { primary: string; secondary: string; muted: string; inverse: string }
    status: { success: string; warning: string; error: string; info: string }
    focus: { ring: string; active: string; selected: string }
    surface: { base: string; elevated: string; overlay: string }
    border: { default: string; focus: string; error: string }
  }
  spacing: Record<string, number>
  typography: Record<string, string>
  borderStyles: Record<string, string>
}

// ── Keyboard Shortcut ──
export interface KeyboardShortcut {
  keys: string
  description: string
  scope: FocusScope
}
