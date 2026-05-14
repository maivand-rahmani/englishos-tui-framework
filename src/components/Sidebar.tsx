import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Box, Text, useWindowSize } from 'ink'
import { LAYOUT } from '../constants.js'
import { useTheme } from '../design-system/ThemeProvider.js'
import { FocusScope } from '../interaction/FocusScope.js'
import { useFocusable } from '../interaction/useFocusable.js'
import { useFocusableRegion } from '../interaction/RegionProvider.js'
import { useNavigation } from '../navigation/NavigationProvider.js'

export interface SidebarItem {
  id: string
  label: string
  description?: string
  category?: string
}

export type SidebarSectionTitles = Record<string, string>

export interface SidebarProps {
  items: SidebarItem[]
  sectionTitles?: SidebarSectionTitles
  columns?: number
  categoryOrder?: string[]
  screenOrderByCategory?: Record<string, string[]>
  footer?: ReactNode
}

const DEFAULT_CATEGORY = 'default'

function SidebarEntry({
  item,
  active,
  showDescription,
  regionActive,
}: {
  item: SidebarItem
  active: boolean
  showDescription: boolean
  regionActive: boolean
}) {
  const theme = useTheme()
  const { focused, onActivate } = useFocusable({ id: item.id })
  const onActivateRef = useRef(onActivate)
  onActivateRef.current = onActivate

  useEffect(() => {
    if (active) {
      onActivateRef.current()
    }
  }, [active])

  const marker = focused ? '›' : active ? '•' : ' '
  const labelColor = regionActive
    ? active
      ? theme.colors.focus.active
      : focused
        ? theme.colors.focus.ring
        : theme.colors.text.primary
    : active
      ? theme.colors.focus.active
      : theme.colors.text.muted

  return (
    <Box flexDirection="column" marginTop={theme.spacing.xs}>
      <Text color={labelColor} bold={active || (focused && regionActive)}>
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
  categoryOrder,
  screenOrderByCategory,
  footer,
}: SidebarProps) {
  const { columns: detectedColumns } = useWindowSize()
  const columns = columnsOverride ?? detectedColumns ?? LAYOUT.medium
  const theme = useTheme()
  const { currentScreenId, push } = useNavigation()
  const { isActive: regionActive } = useFocusableRegion('sidebar')
  const showDescriptions = columns >= LAYOUT.medium
  const hasActiveItem = items.some((item) => item.id === currentScreenId)
  const inputOrder = new Map(items.map((item, index) => [item.id, index]))

  const allCategories = new Set<string>([
    ...(categoryOrder ?? []),
    ...items.map((item) => item.category ?? DEFAULT_CATEGORY),
  ])

  const orderedCategories = [...allCategories].sort((left, right) => {
    const leftIndex = categoryOrder?.indexOf(left) ?? -1
    const rightIndex = categoryOrder?.indexOf(right) ?? -1
    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) return 1
      if (rightIndex === -1) return -1
      return leftIndex - rightIndex
    }
    return left.localeCompare(right)
  })

  const groupedItems = orderedCategories.map((category) => {
    const screenOrder = screenOrderByCategory?.[category] ?? []
    const ordered = items
      .filter((item) => (item.category ?? DEFAULT_CATEGORY) === category)
      .sort((left, right) => {
        const leftCategoryIndex = screenOrder.indexOf(left.id)
        const rightCategoryIndex = screenOrder.indexOf(right.id)
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
      autoFocus={regionActive && !hasActiveItem}
      onActivate={(screenId) => {
        if (screenId !== currentScreenId) {
          push(screenId)
        }
      }}
      regionId="sidebar"
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
                {sectionTitles?.[category] ?? category.toUpperCase()}
              </Text>
              {categoryItems.map((item) => (
                <SidebarEntry
                  key={item.id}
                  item={item}
                  active={item.id === currentScreenId}
                  showDescription={showDescriptions}
                  regionActive={regionActive}
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
