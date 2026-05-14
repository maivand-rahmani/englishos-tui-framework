import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { ActionRegistry } from '../commands/ActionRegistry.js'
import { CommandPalette } from './CommandPalette.js'

function createTestRegistry() {
  const r = new ActionRegistry()
  r.register({
    id: 'start',
    label: 'Start Daily Plan',
    description: 'Begin your daily session',
    category: 'learning',
    handler: () => {},
  })
  r.register({
    id: 'speak',
    label: 'Speaking Practice',
    description: 'Practice speaking',
    category: 'learning',
    handler: () => {},
  })
  r.register({
    id: 'stats',
    label: 'View Statistics',
    description: 'Show progress stats',
    category: 'system',
    handler: () => {},
    shortcut: 't',
  })
  r.register({
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Go to dashboard',
    category: 'navigation',
    handler: () => {},
    shortcut: 'b',
  })
  return r
}

async function typeChars(
  stdin: { write: (d: string) => unknown },
  text: string,
) {
  for (const ch of text) {
    stdin.write(ch)
    await delay(30)
  }
}

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

describe('CommandPalette', () => {
  let registry: ActionRegistry

  beforeEach(() => {
    registry = createTestRegistry()
  })

  it('renders command prompt', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <CommandPalette registry={registry} onClose={() => {}} />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('>')
    expect(lastFrame()).toContain('|')
  })

  it('shows all actions on empty query', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <CommandPalette registry={registry} onClose={() => {}} />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('Start Daily Plan')
    expect(frame).toContain('Speaking Practice')
    expect(frame).toContain('View Statistics')
    expect(frame).toContain('Dashboard')
  })

  it('shows category headers', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <CommandPalette registry={registry} onClose={() => {}} />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('LEARNING')
    expect(frame).toContain('SYSTEM')
    expect(frame).toContain('NAVIGATION')
  })

  it('filters results as user types', async () => {
    const { lastFrame, stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandPalette registry={registry} onClose={() => {}} />
      </KeyboardScopeProvider>,
    )

    expect(lastFrame()).toContain('Start Daily Plan')

    await typeChars(stdin, 'spk')
    const frame = lastFrame()
    expect(frame).toContain('Speaking Practice')
    expect(frame).not.toContain('Start Daily Plan')
  })

  it('shows no results state for unmatched query', () => {
    const noMatchRegistry = new ActionRegistry()
    noMatchRegistry.register({
      id: 'test', label: 'Something Unrelated', category: 'other', handler: () => {},
    })
    noMatchRegistry.register({
      id: 'other', label: 'Another Item', category: 'other', handler: () => {},
    })

    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandPalette registry={noMatchRegistry} onClose={() => {}} />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Something Unrelated')
  })

  it('shows hint on initial open', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandPalette registry={registry} onClose={() => {}} />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Start Daily Plan')
  })

  it('calls onClose on Escape', async () => {
    let closed = false
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandPalette registry={registry} onClose={() => { closed = true }} />
      </KeyboardScopeProvider>,
    )
    stdin.write('\u001b')
    await delay()
    expect(closed).toBe(true)
  })

  it('executes selected action on Enter', async () => {
    const executed: string[] = []
    const execRegistry = new ActionRegistry()
    execRegistry.register({
      id: 'test-action',
      label: 'Test Action',
      category: 'test',
      handler: () => executed.push('test-action'),
    })

    let closed = false
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandPalette registry={execRegistry} onClose={() => { closed = true }} />
      </KeyboardScopeProvider>,
    )
    stdin.write('\r')
    await delay()
    expect(executed).toContain('test-action')
    expect(closed).toBe(true)
  })

  it('selects different item with arrows and executes on Enter', async () => {
    const executed: string[] = []
    const execRegistry = new ActionRegistry()
    execRegistry.register({
      id: 'first',
      label: 'First Action',
      category: 'test',
      handler: () => executed.push('first'),
    })
    execRegistry.register({
      id: 'second',
      label: 'Second Action',
      category: 'test',
      handler: () => executed.push('second'),
    })

    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandPalette registry={execRegistry} onClose={() => {}} />
      </KeyboardScopeProvider>,
    )

    stdin.write('\u001b[B')
    await delay()
    stdin.write('\r')
    await delay()
    expect(executed).toContain('second')
    expect(executed).not.toContain('first')
  })

  it('handles backspace to edit query', async () => {
    const { lastFrame, stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandPalette registry={registry} onClose={() => {}} />
      </KeyboardScopeProvider>,
    )

    await typeChars(stdin, 'spk')
    expect(lastFrame()).toContain('Speaking Practice')

    stdin.write('\b')
    await delay()
    expect(lastFrame()).toContain('Speaking Practice')
    expect(lastFrame()).toContain('Start Daily Plan')
  })
})
