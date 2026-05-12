import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { SelectableList } from './SelectableList.js'
import type { ReactElement } from 'react'
import type { ListItem } from './List.js'

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

const sampleItems: ListItem[] = [
  { id: 'a', label: 'Apple', description: 'Fruit' },
  { id: 'b', label: 'Banana', description: 'Yellow fruit' },
  { id: 'c', label: 'Carrot', description: 'Vegetable' },
]

describe('SelectableList', () => {
  it('renders all items when no filter', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="list">
        <SelectableList items={sampleItems} />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('Apple')
    expect(frame).toContain('Banana')
    expect(frame).toContain('Carrot')
  })

  it('filters items by query matching label', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="list">
        <SelectableList items={sampleItems} filterQuery="app" />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('Apple')
    expect(frame).not.toContain('Banana')
    expect(frame).not.toContain('Carrot')
  })

  it('filters items case-insensitively', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="list">
        <SelectableList items={sampleItems} filterQuery="APP" />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Apple')
  })

  it('filters items by id', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="list">
        <SelectableList items={sampleItems} filterQuery="c" />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('Carrot')
    expect(frame).not.toContain('Apple')
    expect(frame).not.toContain('Banana')
  })

  it('shows no-results message when filter matches nothing', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="list">
        <SelectableList
          items={sampleItems}
          filterQuery="xyznonexistent"
        />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('No results')
  })

  it('supports custom filterFn that returns boolean', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="list">
        <SelectableList
          items={sampleItems}
          filterQuery="custom-filter"
          filterFn={(item) => item.label.length > 5}
        />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    // Apple (5) is not > 5, Banana (6) > 5, Carrot (6) > 5
    expect(frame).not.toContain('Apple')
    expect(frame).toContain('Banana')
    expect(frame).toContain('Carrot')
  })

  it('passes selectedId through to List', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="list">
        <SelectableList items={sampleItems} selectedId="b" />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('•')
  })

  it('passes custom renderItem to List', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="list">
        <SelectableList
          items={sampleItems}
          renderItem={(item, { focused, selected }) => (
            <Text>
              {item.label} f={String(focused)} s={String(selected)}
            </Text>
          )}
        />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('f=')
    expect(frame).toContain('s=')
  })

  it('onActivate fires when Enter pressed on filtered item', async () => {
    const activated: string[] = []
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="list">
        <SelectableList
          items={sampleItems}
          filterQuery="banana"
          onActivate={(id) => activated.push(id)}
        />
      </KeyboardScopeProvider>,
    )

    // Wait for autoFocus to settle through the filter + List render cycle
    await delay(200)
    stdin.write('\r')
    await delay(100)
    expect(activated).toContain('b')
  })
})
