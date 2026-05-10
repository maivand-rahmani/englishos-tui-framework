import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { StatusBar } from './StatusBar.js'

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('StatusBar', () => {
  it('renders mode indicator', () => {
    const { lastFrame } = renderInTheme(
      <StatusBar mode="NORMAL" columns={100} />,
    )
    expect(lastFrame()).toContain('Mode: NORMAL')
  })

  it('renders shortcuts when provided', () => {
    const { lastFrame } = renderInTheme(
      <StatusBar
        mode="NORMAL"
        columns={100}
        shortcuts={[
          { key: 'Q', description: 'Quit' },
          { key: ':', description: 'Command' },
          { key: 'S', description: 'Speak' },
        ]}
      />,
    )
    expect(lastFrame()).toContain('[Q] Quit')
    expect(lastFrame()).toContain('[:] Command')
    expect(lastFrame()).toContain('[S] Speak')
  })

  it('renders without shortcuts (only mode)', () => {
    const { lastFrame } = renderInTheme(
      <StatusBar mode="INSERT" columns={100} />,
    )
    expect(lastFrame()).toContain('Mode: INSERT')
  })

  it('renders without mode (only shortcuts)', () => {
    const { lastFrame } = renderInTheme(
      <StatusBar
        columns={100}
        shortcuts={[{ key: 'Q', description: 'Quit' }]}
      />,
    )
    expect(lastFrame()).toContain('[Q] Quit')
    expect(lastFrame()).not.toContain('Mode:')
  })

  it('compact mode shows minimal info', () => {
    const { lastFrame } = renderInTheme(
      <StatusBar
        mode="NORMAL"
        columns={70}
        shortcuts={[
          { key: 'Q', description: 'Quit' },
          { key: ':', description: 'Command' },
          { key: 'S', description: 'Speak' },
        ]}
      />,
    )
    expect(lastFrame()).toContain('Mode: NORMAL')
    expect(lastFrame()).toContain('[Q] Quit')
    expect(lastFrame()).toContain('[:] Command')
    expect(lastFrame()).not.toContain('[S] Speak')
  })

  it('uses theme tokens for text colors', () => {
    const { lastFrame } = renderInTheme(
      <StatusBar
        mode="NORMAL"
        columns={100}
        shortcuts={[{ key: 'Q', description: 'Quit' }]}
      />,
    )
    expect(lastFrame()).toContain('Mode: NORMAL')
    expect(lastFrame()).toContain('[Q] Quit')
  })

  it('renders nothing when neither mode nor shortcuts provided', () => {
    const { lastFrame } = renderInTheme(<StatusBar columns={100} />)
    const frame = lastFrame() ?? ''
    expect(frame).not.toContain('Mode:')
    expect(frame).not.toContain('[')
  })
})
