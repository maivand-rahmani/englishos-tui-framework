import { Text } from 'ink'
import type { ReactElement } from 'react'
import { useTheme } from '../design-system/ThemeProvider.js'
import { useNavigation } from '../navigation/NavigationProvider.js'

export interface BreadcrumbsProps {
  onSelect?: (screenId: string) => void
  maxItems?: number
  separator?: string
}

export function Breadcrumbs({
  onSelect,
  maxItems = 5,
  separator = ' > ',
}: BreadcrumbsProps) {
  const { breadcrumbs, registry } = useNavigation()
  const { colors } = useTheme()

  const allItems = breadcrumbs.map((b) => ({
    id: b.screenId,
    title: registry.get(b.screenId).title,
  }))

  const items =
    allItems.length <= maxItems
      ? allItems
      : [
          allItems[0],
          ...(maxItems > 2
            ? [{ id: '', title: '...' } as const]
            : []),
          allItems[allItems.length - 1],
        ]

  const elements: ReactElement[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const isLast = i === items.length - 1

    if (i > 0) {
      elements.push(
        <Text key={`sep-${i}`} color={colors.text.secondary}>
          {separator}
        </Text>,
      )
    }

    elements.push(
      <Text
        key={`bc-${item.id || '...'}-${i}`}
        color={isLast ? colors.focus.active : colors.text.secondary}
        dimColor={!isLast && item.title === '...'}
      >
        {item.title}
      </Text>,
    )
  }

  return <Text>{elements}</Text>
}
