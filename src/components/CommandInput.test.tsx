import { useState, type ReactElement } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from 'ink-testing-library'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { CommandInput, type CommandInputProps } from './CommandInput.js'

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

function StatefulCommandInput({
  onChange,
  ...props
}: Omit<CommandInputProps, 'value'> & { onChange?: (v: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <CommandInput
      value={val}
      onChange={(v) => {
        setVal(v)
        onChange?.(v)
      }}
      {...props}
    />
  )
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

async function typeChars(
  stdin: { write: (d: string) => void },
  text: string,
) {
  for (const ch of text) {
    stdin.write(ch)
    await delay(30)
  }
}

describe('CommandInput', () => {
  it('renders prompt character by default', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandInput mode="command" value="" onChange={() => {}} onSubmit={() => {}} />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('>')
  })

  it('renders placeholder when value is empty', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandInput mode="command" value="" onChange={() => {}} onSubmit={() => {}} placeholder="Type command..." />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Type command...')
  })

  it('renders value text when present', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandInput mode="command" value="ls -la" onChange={() => {}} onSubmit={() => {}} />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('ls -la')
  })

  it('shows cursor at end of value', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandInput mode="command" value="test" onChange={() => {}} onSubmit={() => {}} />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('test|')
  })

  it('calls onChange when typing characters', async () => {
    const changes: string[] = []
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <StatefulCommandInput mode="command" onChange={(v) => changes.push(v)} onSubmit={() => {}} />
      </KeyboardScopeProvider>,
    )
    await typeChars(stdin, 'hello')
    expect(changes).toEqual(['h', 'he', 'hel', 'hell', 'hello'])
  })

  it('calls onChange with sliced value on backspace', async () => {
    const changes: string[] = []
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandInput mode="command" value="abc" onChange={(v) => changes.push(v)} onSubmit={() => {}} />
      </KeyboardScopeProvider>,
    )
    stdin.write('\b')
    await delay()
    expect(changes).toEqual(['ab'])
  })

  it('calls onSubmit on Enter', async () => {
    const onSubmit = vi.fn()
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandInput mode="command" value="run" onChange={() => {}} onSubmit={onSubmit} />
      </KeyboardScopeProvider>,
    )
    stdin.write('\r')
    await delay()
    expect(onSubmit).toHaveBeenCalled()
  })

  it('calls onCancel on Escape in command mode', async () => {
    const onCancel = vi.fn()
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandInput mode="command" value="cmd" onChange={() => {}} onSubmit={() => {}} onCancel={onCancel} />
      </KeyboardScopeProvider>,
    )
    stdin.write('\x1b')
    await delay()
    expect(onCancel).toHaveBeenCalled()
  })

  it('calls onSubmit on Escape in process mode (kill)', async () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandInput mode="process" value="" onChange={() => {}} onSubmit={onSubmit} onCancel={onCancel} />
      </KeyboardScopeProvider>,
    )
    stdin.write('\x1b')
    await delay()
    expect(onSubmit).toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('renders custom prompt when provided', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandInput mode="command" value="" onChange={() => {}} onSubmit={() => {}} prompt="$" />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('$')
    expect(lastFrame()).not.toContain('>')
  })

  it('does not process input in navigation mode', async () => {
    const onChange = vi.fn()
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="command">
        <CommandInput mode="navigation" value="" onChange={onChange} onSubmit={() => {}} />
      </KeyboardScopeProvider>,
    )
    stdin.write('x')
    await delay()
    expect(onChange).not.toHaveBeenCalled()
  })
})
