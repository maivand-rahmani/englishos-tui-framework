import { Box, Text } from 'ink'
import { useTheme } from '../design-system/ThemeProvider.js'
import { LAYOUT } from '../constants.js'

export interface StatusBarProps {
  mode?: string
  shortcuts?: { key?: string; keys?: string; description: string; scope?: string }[]
  columns?: number
}

export function StatusBar({
  mode,
  shortcuts,
  columns = LAYOUT.narrow + 1,
}: StatusBarProps) {
  const theme = useTheme()
  const isCompact = columns < LAYOUT.narrow

  if (mode == null && (shortcuts == null || shortcuts.length === 0)) {
    return null
  }

  const displayShortcuts = isCompact
    ? (shortcuts ?? []).slice(0, 2)
    : (shortcuts ?? [])

  return (
    <Box flexDirection="row" justifyContent="space-between">
      <Box>
        {mode != null && (
          <Text color={theme.colors.text.muted}>Mode: {mode}</Text>
        )}
      </Box>

      <Box flexDirection="row" gap={theme.spacing.sm}>
        {displayShortcuts.map((shortcut, index) => {
          const keyLabel = shortcut.keys ?? shortcut.key ?? ''
          return (
            <Text key={`${keyLabel}-${index}`} color={theme.colors.text.secondary}>
              [{keyLabel}] {shortcut.description}
            </Text>
          )
        })}
      </Box>
    </Box>
  )
}
