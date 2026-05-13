// ── Focus Scopes ──
export type BuiltinFocusScope =
  | 'navigation'
  | 'list'
  | 'command'
  | 'modal'
  | 'textinput'

/**
 * Framework consumers can introduce additional scopes by using string literals.
 * Built-ins are still strongly typed for the default interaction model.
 */
export type FocusScope = BuiltinFocusScope | (string & {})

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
