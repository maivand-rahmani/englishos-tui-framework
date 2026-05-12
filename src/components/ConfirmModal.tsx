import { Text } from 'ink'
import { useTheme } from '../design-system/ThemeProvider.js'

export interface ConfirmModalProps {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmModal({
  title = 'Confirm',
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  onConfirm,
  onCancel,
  danger,
}: ConfirmModalProps) {
  const { colors } = useTheme()

  return (
    <>
      <Text bold color={danger ? colors.status.error : colors.focus.active}>
        {title}
      </Text>
      <Text>{message}</Text>
      <Text>
        <Text color={colors.focus.active}>[{confirmLabel}]</Text>
        <Text dimColor> / </Text>
        <Text dimColor>[{cancelLabel}]</Text>
      </Text>
    </>
  )
}
