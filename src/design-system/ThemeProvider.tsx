import { createContext, useContext, type ReactNode } from 'react'
import {
  semanticColors,
  spacing,
  typography,
  borderStyles,
} from './tokens.js'
import type { ThemeTokens } from '../types.js'

type ThemeMode = 'dark' | 'light'

interface ThemeProviderProps {
  mode?: ThemeMode
  children: ReactNode
}

const ThemeContext = createContext<ThemeTokens | null>(null)

function resolveColors(mode: ThemeMode): ThemeTokens['colors'] {
  if (mode === 'dark') {
    return {
      text: { ...semanticColors.text },
      status: { ...semanticColors.status },
      focus: { ...semanticColors.focus },
      surface: { ...semanticColors.surface },
      border: { ...semanticColors.border },
    }
  }

  // Light mode: invert surface and text roles
  return {
    text: {
      primary: 'black',
      secondary: 'gray',
      muted: 'dim',
      inverse: 'white',
    },
    status: { ...semanticColors.status },
    focus: { ...semanticColors.focus },
    surface: {
      base: 'white',
      elevated: 'gray',
      overlay: 'white',
    },
    border: { ...semanticColors.border },
  }
}

function resolveSpacing(): ThemeTokens['spacing'] {
  return { ...spacing }
}

function resolveTypography(): ThemeTokens['typography'] {
  return { ...typography }
}

function resolveBorderStyles(): ThemeTokens['borderStyles'] {
  return { ...borderStyles }
}

export function ThemeProvider({
  mode = 'dark',
  children,
}: ThemeProviderProps) {
  const theme: ThemeTokens = {
    colors: resolveColors(mode),
    spacing: resolveSpacing(),
    typography: resolveTypography(),
    borderStyles: resolveBorderStyles(),
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeTokens {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error(
      'useTheme() must be used within a <ThemeProvider>. ' +
      'Wrap your application in <ThemeProvider> at the root level.',
    )
  }
  return context
}
