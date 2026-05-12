import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { useState, type ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { Tabs, type Tab } from './Tabs.js'

function renderInTheme(ui: ReactElement) {
  return render(
    <KeyboardScopeProvider defaultScope="list">
      <ThemeProvider>{ui}</ThemeProvider>
    </KeyboardScopeProvider>,
  )
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

describe('Tabs', () => {
  const sampleTabs: Tab[] = [
    { id: 'grammar', label: 'Grammar' },
    { id: 'vocab', label: 'Vocabulary' },
    { id: 'speaking', label: 'Speaking' },
  ]

  it('renders all tabs with labels', () => {
    const { lastFrame } = renderInTheme(
      <Tabs tabs={sampleTabs} activeTabId="grammar" onChange={() => {}} />,
    )
    const frame = lastFrame()
    expect(frame).toContain('Grammar')
    expect(frame).toContain('Vocabulary')
    expect(frame).toContain('Speaking')
  })

  it('shows separator between tabs', () => {
    const { lastFrame } = renderInTheme(
      <Tabs tabs={sampleTabs} activeTabId="grammar" onChange={() => {}} />,
    )
    expect(lastFrame()).toMatch(/Grammar\s*\|\s*Vocabulary/)
  })

  it('renders nothing for empty tabs array', () => {
    const { lastFrame } = renderInTheme(
      <Tabs tabs={[]} activeTabId="" onChange={() => {}} />,
    )
    expect(lastFrame()).toBe('')
  })

  it('right arrow moves to next tab', async () => {
    const changes: string[] = []
    const { stdin } = renderInTheme(
      <Tabs
        tabs={sampleTabs}
        activeTabId="grammar"
        onChange={(id) => changes.push(id)}
      />,
    )

    stdin.write('\u001b[C')
    await delay()
    expect(changes).toEqual(['vocab'])
  })

  it('left arrow moves to previous tab', async () => {
    const changes: string[] = []
    const { stdin } = renderInTheme(
      <Tabs
        tabs={sampleTabs}
        activeTabId="vocab"
        onChange={(id) => changes.push(id)}
      />,
    )

    stdin.write('\u001b[D')
    await delay()
    expect(changes).toEqual(['grammar'])
  })

  it('wraps around from first to last on left arrow', async () => {
    const changes: string[] = []
    const { stdin } = renderInTheme(
      <Tabs
        tabs={sampleTabs}
        activeTabId="grammar"
        onChange={(id) => changes.push(id)}
      />,
    )

    stdin.write('\u001b[D')
    await delay()
    expect(changes).toEqual(['speaking'])
  })

  it('wraps around from last to first on right arrow', async () => {
    const changes: string[] = []
    const { stdin } = renderInTheme(
      <Tabs
        tabs={sampleTabs}
        activeTabId="speaking"
        onChange={(id) => changes.push(id)}
      />,
    )

    stdin.write('\u001b[C')
    await delay()
    expect(changes).toEqual(['grammar'])
  })

  it('cycles through tabs with stateful wrapper', async () => {
    const changeLog: string[] = []

    function Harness() {
      const [activeId, setActiveId] = useState('grammar')
      return (
        <Tabs
          tabs={sampleTabs}
          activeTabId={activeId}
          onChange={(id) => {
            changeLog.push(id)
            setActiveId(id)
          }}
        />
      )
    }

    const { stdin } = renderInTheme(<Harness />)
    await delay()

    stdin.write('\u001b[C')
    await delay()

    stdin.write('\u001b[C')
    await delay()

    expect(changeLog).toEqual(['vocab', 'speaking'])
  })

  it('one key writes all onChange in single chunk when no state update between', () => {
    const changes: string[] = []
    const { stdin } = renderInTheme(
      <Tabs
        tabs={sampleTabs}
        activeTabId="grammar"
        onChange={(id) => changes.push(id)}
      />,
    )

    // All arrow keys written as a single stdin chunk.  Since the
    // test driver processes the entire chunk before React commits
    // any state update, all three right-arrow handlers see
    // activeTabId="grammar" and call onChange("vocab"); the final
    // left arrow sees "grammar" and calls onChange("speaking").
    stdin.write('\u001b[C\u001b[C\u001b[C\u001b[D')

    expect(changes).toEqual(['vocab', 'vocab', 'vocab', 'speaking'])
  })

  it('truncates long labels', () => {
    const longTabs: Tab[] = [
      {
        id: 'a',
        label:
          'This is an extremely long grammar tab label that should definitely be truncated in any reasonable terminal width',
      },
      {
        id: 'b',
        label:
          'This vocabulary section label is also very long and should be truncated to fit the available space',
      },
    ]
    const { lastFrame } = renderInTheme(
      <Tabs tabs={longTabs} activeTabId="a" onChange={() => {}} />,
    )

    const frame = lastFrame()
    expect(frame).toBeTruthy()
    expect(frame).not.toContain(
      'This vocabulary section label is also very long and should be truncated',
    )
  })
})
