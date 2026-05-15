import { describe, it, expect, vi } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { ModalDialog } from './ModalDialog.js'
import type { Action } from '../commands/ActionRegistry.js'

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

describe('ModalDialog', () => {
  it('renders title and children', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <ModalDialog title="Modal Title" onClose={() => {}}>
          <Text>Child content</Text>
        </ModalDialog>
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('Modal Title')
    expect(frame).toContain('Child content')
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()

    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="modal">
        <ModalDialog title="Test" onClose={onClose}>
          <Text>Content</Text>
        </ModalDialog>
      </KeyboardScopeProvider>,
    )

    stdin.write('\u001b')
    await delay()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders footer actions as hotkey hints', () => {
    const footer: Action[] = [
      {
        id: 'save',
        label: 'Save',
        category: 'input',
        handler: () => {},
        keys: ['s'],
      },
      {
        id: 'cancel',
        label: 'Cancel',
        category: 'input',
        handler: () => {},
        keys: ['esc'],
      },
    ]

    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <ModalDialog title="Test" onClose={() => {}} footer={footer}>
          <Text>Content</Text>
        </ModalDialog>
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('[s]')
    expect(frame).toContain('Save')
    expect(frame).toContain('[esc]')
    expect(frame).toContain('Cancel')
  })

  it('renders with custom width', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <ModalDialog title="Width Test" onClose={() => {}} width={40}>
          <Text>Fixed width content</Text>
        </ModalDialog>
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Width Test')
    expect(lastFrame()).toContain('Fixed width content')
  })

  it('suspends shell hotkeys when trapFocus is true', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <ModalDialog title="Trap" onClose={() => {}} trapFocus={true}>
          <Text>Focused</Text>
        </ModalDialog>
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Trap')
    expect(lastFrame()).toContain('Focused')
  })
})
