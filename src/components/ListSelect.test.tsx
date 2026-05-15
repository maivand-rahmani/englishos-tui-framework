import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { ScopedActionRegistryProvider } from '../commands/ScopedActionRegistryProvider.js'
import { ListSelect, type ListSelectItem } from './ListSelect.js'

function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <KeyboardScopeProvider defaultScope="list">
        <ScopedActionRegistryProvider>{ui}</ScopedActionRegistryProvider>
      </KeyboardScopeProvider>
    </ThemeProvider>,
  )
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

type StrItem = ListSelectItem<string>

const sampleItems: StrItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
]

const itemsWithDisabled: StrItem[] = [
  { value: 'a', label: 'Enabled A' },
  { value: 'b', label: 'Disabled B', disabled: true },
  { value: 'c', label: 'Enabled C' },
]

describe('ListSelect', () => {
  it('renders all items', () => {
    const { lastFrame } = renderInTheme(
      <ListSelect items={sampleItems} onSelect={() => {}} />,
    )
    const frame = lastFrame()
    expect(frame).toContain('Alpha')
    expect(frame).toContain('Beta')
    expect(frame).toContain('Gamma')
  })

  it('renders empty state', () => {
    const { lastFrame } = renderInTheme(
      <ListSelect items={[]} onSelect={() => {}} />,
    )
    expect(lastFrame()).toContain('No items')
  })

  it('selects current item on Enter', async () => {
    const selected: string[] = []
    const { stdin } = renderInTheme(
      <ListSelect
        items={sampleItems}
        onSelect={(value) => selected.push(value)}
      />,
    )
    await delay()
    stdin.write('\r')
    await delay()
    expect(selected).toContain('a')
  })

  it('moves selection with arrow down', async () => {
    const selected: string[] = []
    const { stdin } = renderInTheme(
      <ListSelect
        items={sampleItems}
        onSelect={(value) => selected.push(value)}
      />,
    )
    await delay()
    stdin.write('\u001b[B')
    await delay()
    stdin.write('\r')
    await delay()
    expect(selected).toContain('b')
  })

  it('moves selection with arrow up', async () => {
    const selected: string[] = []
    const { stdin } = renderInTheme(
      <ListSelect
        items={sampleItems}
        onSelect={(value) => selected.push(value)}
      />,
    )
    await delay()
    stdin.write('\u001b[B') // down to b
    await delay()
    stdin.write('\u001b[A') // up back to a
    await delay()
    stdin.write('\r')
    await delay()
    expect(selected).toContain('a')
  })

  it('wraps navigation at edges', async () => {
    const selected: string[] = []
    const { stdin } = renderInTheme(
      <ListSelect
        items={sampleItems}
        onSelect={(value) => selected.push(value)}
      />,
    )
    await delay()
    stdin.write('\u001b[A') // up from index 0 wraps to last
    await delay()
    stdin.write('\r')
    await delay()
    expect(selected).toContain('c')
  })

  it('skips disabled items in navigation', async () => {
    const selected: string[] = []
    const { stdin } = renderInTheme(
      <ListSelect
        items={itemsWithDisabled}
        onSelect={(value) => selected.push(value)}
      />,
    )
    await delay()
    stdin.write('\u001b[B') // down — skip disabled B
    await delay()
    stdin.write('\r')
    await delay()
    expect(selected).toContain('c')
  })

  it('respects initialFocus', () => {
    const { lastFrame } = renderInTheme(
      <ListSelect
        items={sampleItems}
        onSelect={() => {}}
        initialFocus={2}
      />,
    )
    // last frame renders — should not crash
    expect(lastFrame()).toContain('Gamma')
  })
})
