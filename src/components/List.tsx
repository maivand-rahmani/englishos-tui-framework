import { useRef, useEffect, type ReactElement } from 'react'
import { Box, Text } from 'ink'
import { FocusScope, useFocusScope } from '../interaction/FocusScope.js'
import { useFocusable } from '../interaction/useFocusable.js'
import { useTheme } from '../design-system/ThemeProvider.js'
import { LAYOUT } from '../constants.js'

// ── Data Types ──

export interface ListItem {
  id: string
  label: string
  description?: string
}

export interface ListProps<T extends ListItem> {
  items: T[]
  selectedId?: string
  onSelect?: (id: string) => void
  onActivate?: (id: string) => void
  maxVisible?: number
  renderItem?: (
    item: T,
    state: { focused: boolean; selected: boolean },
  ) => ReactElement
}

// ── Public Component ──

export function List<T extends ListItem>({
  items,
  selectedId,
  onSelect,
  onActivate,
  maxVisible = LAYOUT.listMaxVisible,
  renderItem,
}: ListProps<T>) {
  const safeMaxVisible = Math.max(1, maxVisible)
  const displayItems =
    items.length > safeMaxVisible
      ? items.slice(0, safeMaxVisible)
      : items

  if (items.length === 0) {
    return <Text dimColor>No items</Text>
  }

  return (
    <FocusScope scope="list" autoFocus onActivate={onActivate}>
      <Box flexDirection="column">
        <SelectObserver onSelect={onSelect} />
        {displayItems.map((item) => (
          <ListItemRow
            key={item.id}
            item={item}
            selectedId={selectedId}
            renderItem={
              renderItem as
                | ((
                    item: ListItem,
                    state: { focused: boolean; selected: boolean },
                  ) => ReactElement)
                | undefined
            }
          />
        ))}
      </Box>
    </FocusScope>
  )
}

// ── Internal Helpers ──

function SelectObserver({
  onSelect,
}: {
  onSelect?: (id: string) => void
}) {
  const { focusedId } = useFocusScope()
  const prevFocusedId = useRef<string | null>(null)

  useEffect(() => {
    if (
      prevFocusedId.current !== null &&
      focusedId !== null &&
      focusedId !== prevFocusedId.current &&
      onSelect
    ) {
      onSelect(focusedId)
    }
    prevFocusedId.current = focusedId
  }, [focusedId, onSelect])

  return null
}

interface ListItemRowProps {
  item: ListItem
  selectedId?: string
  renderItem?: (
    item: ListItem,
    state: { focused: boolean; selected: boolean },
  ) => ReactElement
}

function ListItemRow({ item, selectedId, renderItem }: ListItemRowProps) {
  const { colors } = useTheme()
  const { focused } = useFocusable({ id: item.id })
  const isSelected = selectedId === item.id

  if (renderItem) {
    return <Box>{renderItem(item, { focused, selected: isSelected })}</Box>
  }

  const labelColor = focused
    ? colors.focus.ring
    : isSelected
      ? colors.focus.active
      : colors.text.primary

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={labelColor} bold={isSelected}>
          {isSelected ? '• ' : '  '}
          {item.label}
        </Text>
      </Box>
      {item.description && (
        <Box>
          <Text color={colors.text.secondary}>
            {'  '}
            {item.description}
          </Text>
        </Box>
      )}
    </Box>
  )
}
