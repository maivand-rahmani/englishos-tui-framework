import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { ScopedActionRegistryProvider } from '../commands/ScopedActionRegistryProvider.js'
import { OptionGrid } from './OptionGrid.js'

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

const sampleOptions = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' },
  { value: 'opt3', label: 'Option 3' },
  { value: 'opt4', label: 'Option 4' },
]

const optionsWithDisabled = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', disabled: true },
  { value: 'c', label: 'Gamma' },
  { value: 'd', label: 'Delta' },
]

describe('OptionGrid', () => {
  it('renders all options', () => {
    const { lastFrame } = renderInTheme(
      <OptionGrid options={sampleOptions} onSelect={() => {}} />,
    )
    const frame = lastFrame()
    expect(frame).toContain('Option 1')
    expect(frame).toContain('Option 2')
    expect(frame).toContain('Option 3')
    expect(frame).toContain('Option 4')
  })

  it('renders empty state', () => {
    const { lastFrame } = renderInTheme(
      <OptionGrid options={[]} onSelect={() => {}} />,
    )
    expect(lastFrame()).toContain('No options')
  })

  it('selects option on Enter', async () => {
    const selected: string[] = []
    const { stdin } = renderInTheme(
      <OptionGrid
        options={sampleOptions}
        onSelect={(value) => selected.push(value)}
      />,
    )
    await delay()
    stdin.write('\r')
    await delay()
    expect(selected).toContain('opt1')
  })

  it('navigates right', async () => {
    const selected: string[] = []
    const { stdin } = renderInTheme(
      <OptionGrid
        options={sampleOptions}
        columns={2}
        onSelect={(value) => selected.push(value)}
      />,
    )
    await delay()
    stdin.write('\u001b[C') // right
    await delay()
    stdin.write('\r')
    await delay()
    expect(selected).toContain('opt2')
  })

  it('navigates left', async () => {
    const selected: string[] = []
    const { stdin } = renderInTheme(
      <OptionGrid
        options={sampleOptions}
        columns={2}
        onSelect={(value) => selected.push(value)}
      />,
    )
    await delay()
    stdin.write('\u001b[C') // right to opt2
    await delay()
    stdin.write('\u001b[D') // left back to opt1
    await delay()
    stdin.write('\r')
    await delay()
    expect(selected).toContain('opt1')
  })

  it('navigates down to next row', async () => {
    const selected: string[] = []
    const { stdin } = renderInTheme(
      <OptionGrid
        options={sampleOptions}
        columns={2}
        onSelect={(value) => selected.push(value)}
      />,
    )
    await delay()
    stdin.write('\u001b[B') // down to opt3 (row 2, col 0)
    await delay()
    stdin.write('\r')
    await delay()
    expect(selected).toContain('opt3')
  })

  it('skips disabled options in navigation', async () => {
    const selected: string[] = []
    const { stdin } = renderInTheme(
      <OptionGrid
        options={optionsWithDisabled}
        onSelect={(value) => selected.push(value)}
      />,
    )
    await delay()
    stdin.write('\u001b[B') // down — skip disabled Beta, land on Gamma (value: 'c')
    await delay()
    stdin.write('\r')
    await delay()
    expect(selected).toContain('c')
  })
})
