import { describe, it, expect, vi } from 'vitest'
import { render } from 'ink-testing-library'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { ConfirmCancel } from './ConfirmCancel.js'

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

describe('ConfirmCancel', () => {
  it('renders title and message', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <ConfirmCancel
          title="Delete?"
          message="Are you sure?"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('Delete?')
    expect(frame).toContain('Are you sure?')
  })

  it('shows default confirm and cancel labels', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <ConfirmCancel
          title="Confirm"
          message="Proceed?"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('[enter]')
    expect(frame).toContain('Confirm')
    expect(frame).toContain('[esc]')
    expect(frame).toContain('Cancel')
  })

  it('shows custom confirm and cancel labels', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <ConfirmCancel
          title="Prompt"
          message="Go ahead?"
          confirmLabel="Yes"
          cancelLabel="No"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('[enter]')
    expect(frame).toContain('Yes')
    expect(frame).toContain('[esc]')
    expect(frame).toContain('No')
  })

  it('calls onConfirm when Enter is pressed', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="modal">
        <ConfirmCancel
          title="Confirm"
          message="Are you sure?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </KeyboardScopeProvider>,
    )

    stdin.write('\r')
    await delay()

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel when Escape is pressed', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="modal">
        <ConfirmCancel
          title="Confirm"
          message="Are you sure?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </KeyboardScopeProvider>,
    )

    stdin.write('\u001b')
    await delay()

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('renders danger variant', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <ConfirmCancel
          title="Delete?"
          message="This cannot be undone"
          onConfirm={() => {}}
          onCancel={() => {}}
          danger
        />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('Delete?')
    expect(frame).toContain('This cannot be undone')
    expect(frame).toContain('[enter]')
    expect(frame).toContain('[esc]')
  })
})
