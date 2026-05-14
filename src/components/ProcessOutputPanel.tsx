import { Box, Text } from 'ink'
import { useTheme } from '../design-system/ThemeProvider.js'
import type { OutputLine, SessionStatus } from '../commands/useCommandSession.js'

export interface ProcessOutputPanelProps {
  /** Accumulated output lines from the process. */
  output: OutputLine[]
  /** Lifecycle status of the process. */
  status: SessionStatus
  /** The command string that was used to spawn the process. */
  activeCommand: string | null
  /** Exit code (null if process hasn't exited yet). */
  exitCode: number | null
  /** Maximum number of visible output lines. Older lines are dropped. */
  maxVisibleLines?: number
  /** Maximum height of the output panel (in terminal rows). */
  maxHeight?: number
}

const STATUS_COLORS: Record<SessionStatus, string> = {
  idle: 'gray',
  running: 'green',
  exited: 'yellow',
} as const

const STATUS_LABELS: Record<SessionStatus, string> = {
  idle: 'Idle',
  running: 'Running...',
  exited: 'Exited',
} as const

/**
 * Presentational component that renders the output of a running process.
 * Shows stdout/stderr lines with stream-aware coloring, the active command,
 * and a status indicator bar.
 */
export function ProcessOutputPanel({
  output,
  status,
  activeCommand,
  exitCode,
  maxVisibleLines = 500,
  maxHeight,
}: ProcessOutputPanelProps) {
  const { colors } = useTheme()
  const visible =
    maxVisibleLines > 0 && output.length > maxVisibleLines
      ? output.slice(-maxVisibleLines)
      : output

  const statusColor = STATUS_COLORS[status]
  const statusLabel = STATUS_LABELS[status]

  return (
    <Box flexDirection="column">
      {/* Status bar */}
      <Box>
        <Text color={colors.status.info}>[</Text>
        <Text color={statusColor}>{statusLabel}</Text>
        {activeCommand && (
          <Text color={colors.text.secondary}>
            {' '}
            {activeCommand.length > 40
              ? activeCommand.slice(0, 37) + '...'
              : activeCommand}
          </Text>
        )}
        {exitCode !== null && (
          <Text color={exitCode === 0 ? colors.status.success : colors.status.error}>
            {' '}
            (exit {exitCode})
          </Text>
        )}
        <Text color={colors.status.info}>]</Text>
      </Box>

      {/* Output lines */}
      {visible.length > 0 && (
        <Box flexDirection="column">
          {visible.map((line, i) => (
            <Text
              key={i}
              color={line.stream === 'stderr' ? colors.status.warning : undefined}
            >
              {line.text}
            </Text>
          ))}
        </Box>
      )}

      {visible.length === 0 && status === 'running' && (
        <Box>
          <Text dimColor>Waiting for output...</Text>
        </Box>
      )}
    </Box>
  )
}
