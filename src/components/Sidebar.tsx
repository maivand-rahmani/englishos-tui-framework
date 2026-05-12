import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Box, Text, useWindowSize } from 'ink'
import { LAYOUT, SCREEN_CATEGORIES } from '../constants.js'
import { useTheme } from '../design-system/ThemeProvider.js'
import { FocusScope } from '../interaction/FocusScope.js'
import { useFocusable } from '../interaction/useFocusable.js'
import { useNavigation } from '../navigation/NavigationProvider.js'

export type SidebarCategory = keyof typeof SCREEN_CATEGORIES

export interface SidebarItem {
  id: string
  label: string
  description?: string
  category: SidebarCategory
}

export type SidebarSectionTitles = Partial<Record<SidebarCategory, string>>

export interface SidebarProps {
  items: SidebarItem[]
  sectionTitles?: SidebarSectionTitles
  columns?: number
  footer?: ReactNode
}

const DEFAULT_SECTION_TITLES: Record<SidebarCategory, string> = {
  main: 'MAIN',
  learning: 'LEARNING',
  system: 'SYSTEM',
}

function SidebarEntry({
  item,
  active,
  showDescription,
}: {
  item: SidebarItem
  active: boolean
  showDescription: boolean
}) {
  const theme = useTheme()
  const { focused, onActivate } = useFocusable({ id: item.id })

  useEffect(() => {
    if (active) {
      onActivate()
    }
  }, [active, onActivate])

  const marker = focused ? '›' : active ? '•' : ' '
  const labelColor = active
    ? theme.colors.focus.active
    : focused
      ? theme.colors.focus.ring
      : theme.colors.text.primary

  return (
    <Box flexDirection="column" marginTop={theme.spacing.xs}>
      <Text color={labelColor} bold={active || focused}>
        {marker} {item.label}
      </Text>
      {showDescription && item.description != null && item.description.length > 0 && (
        <Text color={theme.colors.text.secondary}>  {item.description}</Text>
      )}
    </Box>
  )
}

export function Sidebar({
  items,
  sectionTitles,
  columns: columnsOverride,
  footer,
}: SidebarProps) {
  const { columns: detectedColumns } = useWindowSize()
  const columns = columnsOverride ?? detectedColumns ?? LAYOUT.medium
  const theme = useTheme()
  const { currentScreenId, push } = useNavigation()
  const showDescriptions = columns >= LAYOUT.medium
  const hasActiveItem = items.some((item) => item.id === currentScreenId)
  const inputOrder = new Map(items.map((item, index) => [item.id, index]))

  const groupedItems = (
    Object.keys(SCREEN_CATEGORIES) as SidebarCategory[]
  ).map((category) => {
    const categoryOrder = SCREEN_CATEGORIES[category] as readonly string[]
    const ordered = items
      .filter((item) => item.category === category)
      .sort((left, right) => {
        const leftCategoryIndex = categoryOrder.indexOf(left.id)
        const rightCategoryIndex = categoryOrder.indexOf(right.id)
        const leftIndex =
          leftCategoryIndex === -1 ? Number.MAX_SAFE_INTEGER : leftCategoryIndex
        const rightIndex =
          rightCategoryIndex === -1 ? Number.MAX_SAFE_INTEGER : rightCategoryIndex

        if (leftIndex !== rightIndex) {
          return leftIndex - rightIndex
        }

        return (inputOrder.get(left.id) ?? 0) - (inputOrder.get(right.id) ?? 0)
      })

    return { category, items: ordered }
  })
  const visibleGroups = groupedItems.filter((group) => group.items.length > 0)

  return (
    <FocusScope
      scope="navigation"
      autoFocus={!hasActiveItem}
      onActivate={(screenId) => {
        if (screenId !== currentScreenId) {
          push(screenId)
        }
      }}
    >
      <Box flexDirection="column">
        {visibleGroups.map(({ category, items: categoryItems }, categoryIndex) => {
          return (
            <Box
              key={category}
              flexDirection="column"
              marginBottom={
                categoryIndex < visibleGroups.length - 1 ? theme.spacing.sm : 0
              }
            >
              <Text bold color={theme.colors.text.muted}>
                {sectionTitles?.[category] ?? DEFAULT_SECTION_TITLES[category]}
              </Text>
              {categoryItems.map((item) => (
                <SidebarEntry
                  key={item.id}
                  item={item}
                  active={item.id === currentScreenId}
                  showDescription={showDescriptions}
                />
              ))}
            </Box>
          )
        })}
        {footer != null && <Box marginTop={theme.spacing.sm}>{footer}</Box>}
      </Box>
    </FocusScope>
  )
}
