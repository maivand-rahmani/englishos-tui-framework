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

  /** Sidebar layout mode: 'flow' (default) renders in flex flow, 'fixed' keeps it absolute */
  sidebarPosition?: 'flow' | 'fixed'

  /** Enable scrollable content area (requires sidebarPosition='fixed') */
  scrollContent?: boolean
}

const SIDEBAR_WIDTH = 20

export function AppShell({
  topBar,
  sidebar,
  statusBar,
  children,
  columns: columnsOverride,
  sidebarPosition = 'flow',
  scrollContent = false,
}: AppShellProps) {
  const { columns: detectedColumns } = useWindowSize()
  const columns = columnsOverride ?? detectedColumns ?? LAYOUT.medium
  const theme = useTheme()

  const isNarrow = columns < LAYOUT.narrow
  const isWide = columns >= LAYOUT.medium
  const showSidebar = sidebar != null && !isNarrow
  const isFixedSidebar = sidebarPosition === 'fixed' && showSidebar
  const isScrollable = scrollContent && isFixedSidebar

  // Fixed sidebar + scrollable content uses absolute positioning for sidebar
  // and wraps content in a viewport-height container.
  if (isFixedSidebar) {
    return (
      <Box flexDirection="column" {...(isScrollable ? { height: '100%' } : {})}>
        {topBar != null && (
          <Box marginBottom={theme.spacing.sm}>{topBar}</Box>
        )}

        <Box flexDirection="row" flexGrow={1}>
          {showSidebar && (
            <Box position="absolute" width={SIDEBAR_WIDTH} top={0} left={0}>
              {sidebar}
            </Box>
          )}
          <Box
            flexGrow={1}
            marginLeft={showSidebar ? SIDEBAR_WIDTH : 0}
            {...(isScrollable ? { height: `100%`, overflow: 'hidden' } : {})}
          >
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

  // Legacy flex layout (default)
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
