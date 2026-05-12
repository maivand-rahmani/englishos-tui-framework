import type { ReactNode } from 'react'
import { Text } from 'ink'
import { useTheme } from '../design-system/ThemeProvider.js'
import type { ThemeTokens } from '../types.js'

export type ButtonVariant = 'default' | 'primary' | 'danger' | 'ghost'

export interface ButtonProps {
  variant?: ButtonVariant
  disabled?: boolean
  focused?: boolean
  children: ReactNode
  onActivate?: () => void
}

export interface ButtonAppearance {
  color?: string
  dimColor?: boolean
  bold?: boolean
}

export function resolveButtonAppearance(
  theme: ThemeTokens,
  variant: ButtonVariant,
  focused: boolean,
  disabled: boolean,
): ButtonAppearance {
  if (disabled) {
    return {
      color: theme.colors.text.secondary,
      dimColor: true,
    }
  }

  if (focused) {
    return {
      color: theme.colors.focus.ring,
      bold: true,
    }
  }

  switch (variant) {
    case 'primary':
      return { color: theme.colors.status.info }
    case 'danger':
      return { color: theme.colors.status.error }
    case 'ghost':
      return { color: theme.colors.text.secondary, dimColor: true }
    case 'default':
    default:
      return { color: theme.colors.text.primary }
  }
}

export function Button({
  variant = 'default',
  disabled = false,
  focused = false,
  children,
}: ButtonProps) {
  const theme = useTheme()
  const appearance = resolveButtonAppearance(theme, variant, focused, disabled)

  return (
    <Text
      color={appearance.color}
      dimColor={appearance.dimColor}
      bold={appearance.bold}
    >
      [{children}]
    </Text>
  )
}
