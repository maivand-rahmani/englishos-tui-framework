import type { ReactNode } from 'react'
import { Box, useWindowSize } from 'ink'
import { useTheme } from '../design-system/ThemeProvider.js'
import { LAYOUT } from '../constants.js'

export interface AppShellProps {
  /** Optional top bar (app name, screen title, date) */
  topBar?: ReactNode

  /** Optional sidebar (screen navigation) — hidden below 80 cols */
  sidebar?: ReactNode

  /** Optional status bar (keyboard hints, mode indicator) */
  statusBar?: ReactNode

  /** Content area — renders current screen */
  children: ReactNode

  /** Override detected terminal width (for testing / responsive simulation) */
  columns?: number
}

const SIDEBAR_WIDTH = 20

export function AppShell({
  topBar,
  sidebar,
  statusBar,
  children,
  columns: columnsOverride,
}: AppShellProps) {
  const { columns: detectedColumns } = useWindowSize()
  const columns = columnsOverride ?? detectedColumns ?? LAYOUT.medium
  const theme = useTheme()

  const isNarrow = columns < LAYOUT.narrow
  const isWide = columns >= LAYOUT.medium
  const showSidebar = sidebar != null && !isNarrow

  return (
    <Box flexDirection="column">
      {topBar != null && (
        <Box marginBottom={theme.spacing.sm}>{topBar}</Box>
      )}

      <Box
        flexDirection={isWide ? 'row' : 'column'}
        gap={isWide ? theme.spacing.xs : 0}
      >
        {showSidebar && (
          <Box width={isWide ? SIDEBAR_WIDTH : undefined} flexShrink={0}>
            {sidebar}
          </Box>
        )}
        <Box flexGrow={1} flexShrink={isWide ? 1 : 0}>
          {children}
        </Box>
      </Box>

      {statusBar != null && (
        <Box
          marginTop={theme.spacing.sm}
          borderStyle="single"
          borderColor={theme.colors.border.default}
        >
          {statusBar}
        </Box>
      )}
    </Box>
  )
}
