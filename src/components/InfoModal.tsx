import { Text } from 'ink'
import { useTheme } from '../design-system/ThemeProvider.js'

export interface InfoModalProps {
  title?: string
  message: string
  details?: string
  dismissLabel?: string
  onDismiss: () => void
}

export function InfoModal({
  title = 'Info',
  message,
  details,
  dismissLabel = 'OK',
  onDismiss,
}: InfoModalProps) {
  const { colors } = useTheme()

  return (
    <>
      <Text bold color={colors.focus.active}>
        {title}
      </Text>
      <Text>{message}</Text>
      {details && <Text dimColor>{details}</Text>}
      <Text>
        <Text color={colors.focus.active}>[{dismissLabel}]</Text>
        <Text dimColor> — Press Enter or Escape</Text>
      </Text>
    </>
  )
}
