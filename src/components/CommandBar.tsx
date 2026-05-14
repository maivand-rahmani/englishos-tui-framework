import { Box, Text } from 'ink'
import { useTheme } from '../design-system/ThemeProvider.js'
import type { CommandSessionMode } from '../commands/useCommandSession.js'

export interface CommandBarProps {
  /** Current mode determines rendering and whether input is shown. */
  mode: CommandSessionMode
  /** Current input text. */
  value: string
  /** Called when the user changes the input text. */
  onChange: (value: string) => void
  /** Called when the user submits (presses Enter). */
  onSubmit: () => void
  /** Placeholder text shown when input is empty. */
  placeholder?: string
  /** Visible label shown before the input. */
  prompt?: string
}

/**
 * Presentational component that renders the command input area.
 * Displays a prompt symbol, the current input text, and a cursor.
 * Keyboard input is handled by `useCommandSession`; this component
 * only renders the visual state.
 */
export function CommandBar({
  mode,
  value,
  onChange: _onChange,
  onSubmit: _onSubmit,
  placeholder = 'Type a command...',
  prompt = '>',
}: CommandBarProps) {
  const { colors } = useTheme()

  if (mode === 'navigation') {
    return null
  }

  const showPrompt = mode === 'command'

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color={colors.focus.active}>
          {showPrompt ? `${prompt} ` : ''}
        </Text>
        {value.length > 0 ? (
          <Text>{value}</Text>
        ) : (
          <Text dimColor>{placeholder}</Text>
        )}
        <Text color={colors.focus.ring}>|</Text>
      </Box>
      {mode === 'process' && (
        <Box>
          <Text dimColor>(stdin) </Text>
        </Box>
      )}
    </Box>
  )
}
