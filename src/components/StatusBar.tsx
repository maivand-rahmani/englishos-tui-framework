import { Box, Text } from 'ink'
import { useTheme } from '../design-system/ThemeProvider.js'
import { LAYOUT } from '../constants.js'
import { ScopedActionRegistryProvider } from '../commands/ScopedActionRegistryProvider.js'
import { ActionRegistry } from '../commands/ActionRegistry.js'
import { HotkeyHintBar } from './HotkeyHintBar.js'

export interface StatusBarProps {
  mode?: string
  shortcuts?: { key?: string; keys?: string; description: string; scope?: string }[]
  columns?: number
  /** Optional — when provided, auto-generates footer hints from the action registry. */
  registry?: ActionRegistry
}

export function StatusBar({
  mode,
  shortcuts,
  columns = LAYOUT.narrow + 1,
  registry,
}: StatusBarProps) {
  const theme = useTheme()
  const isCompact = columns < LAYOUT.narrow

  const hasMode = mode != null
  const hasShortcuts = shortcuts != null && shortcuts.length > 0
  const hasRegistry = registry != null

  if (!hasMode && !hasShortcuts && !hasRegistry) {
    return null
  }

  const displayShortcuts = isCompact
    ? (shortcuts ?? []).slice(0, 2)
    : (shortcuts ?? [])

  const registryHints = hasRegistry ? (
    <ScopedActionRegistryProvider registry={registry}>
      <HotkeyHintBar />
    </ScopedActionRegistryProvider>
  ) : null

  return (
    <Box flexDirection="row" justifyContent="space-between">
      <Box>
        {hasMode && (
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
        {registryHints}
      </Box>
    </Box>
  )
}
