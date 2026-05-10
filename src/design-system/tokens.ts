// ── Design System Tokens ──
// Source of truth for all visual primitives in the TUI.
// Everything derives from these base values — no raw numbers or inline colors.

// ── Spacing (character-based) ──
export const spacing = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
  xxl: 8,
} as const satisfies Record<string, number>

// ── Semantic Color Tokens ──
// Maps design intent to terminal-safe ANSI color names.
// ThemeProvider resolves these further (dark/light mode adaptation).
export const semanticColors = {
  text: {
    primary: 'white',
    secondary: 'gray',
    muted: 'dim',
    inverse: 'black',
  },
  status: {
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'blue',
  },
  focus: {
    ring: 'cyan',
    active: 'cyan',
    selected: 'blue',
  },
  surface: {
    base: 'black',
    elevated: 'gray',
    overlay: 'black',
  },
  border: {
    default: 'gray',
    focus: 'cyan',
    error: 'red',
  },
} as const

// ── Typography Tokens ──
// Maps semantic role to Ink Text props.
export const typography = {
  heading: 'bold',
  label: 'none',
  body: 'none',
  caption: 'dim',
  code: 'none',
} as const satisfies Record<string, string>

// ── Border Style Tokens ──
// Maps component type to Ink Box borderStyle.
export const borderStyles = {
  panel: 'round',
  card: 'round',
  modal: 'round',
  table: 'single',
} as const satisfies Record<string, string>

// ── Derived Types ──
export type SpacingToken = keyof typeof spacing
export type SemanticColorCategory = keyof typeof semanticColors
export type TypographyToken = keyof typeof typography
export type BorderStyleToken = keyof typeof borderStyles
