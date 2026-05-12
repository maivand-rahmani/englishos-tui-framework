import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { SearchInput } from './SearchInput.js'
import type { ReactElement } from 'react'

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
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

describe('SearchInput', () => {
  it('renders placeholder when empty', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput placeholder="Type here..." />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Type here...')
  })

  it('renders default placeholder when not specified', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Search...')
  })

  it('displays the controlled value as-is', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput value="hello world" />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('hello world')
  })

  it('shows cursor indicator at end', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput value="test" />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    expect(frame).toContain('test')
    expect(frame).toContain('|')
  })

  it('does not show cursor indicator alone when text present', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput value="test" />
      </KeyboardScopeProvider>,
    )
    const frame = lastFrame()
    // cursor should be after text, not instead of it
    expect(frame).toContain('test|')
  })

  it('accepts typed characters (uncontrolled)', async () => {
    const { lastFrame, stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput />
      </KeyboardScopeProvider>,
    )
    await typeChars(stdin, 'hello')
    expect(lastFrame()).toContain('hello')
  })

  it('handles backspace to remove last character', async () => {
    const { lastFrame, stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput />
      </KeyboardScopeProvider>,
    )
    await typeChars(stdin, 'abc')
    expect(lastFrame()).toContain('abc')

    stdin.write('\b')
    await delay()
    expect(lastFrame()).toContain('ab')
    expect(lastFrame()).not.toContain('abc')
  })

  it('calls onChange in uncontrolled mode', async () => {
    const changes: string[] = []
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput onChange={(v) => changes.push(v)} />
      </KeyboardScopeProvider>,
    )
    await typeChars(stdin, 'cat')
    expect(changes).toEqual(['c', 'ca', 'cat'])
  })

  it('calls onChange on backspace', async () => {
    const changes: string[] = []
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput onChange={(v) => changes.push(v)} />
      </KeyboardScopeProvider>,
    )
    await typeChars(stdin, 'ab')
    changes.length = 0
    stdin.write('\b')
    await delay()
    expect(changes).toEqual(['a'])
  })

  it('works in controlled mode — calls onChange with appended value', async () => {
    const changes: string[] = []
    const { stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput value="test" onChange={(v) => changes.push(v)} />
      </KeyboardScopeProvider>,
    )
    stdin.write('x')
    await delay()
    expect(changes).toEqual(['testx'])
  })

  it('does not update display in controlled mode when prop stays same', async () => {
    const { lastFrame, stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput value="fixed" />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('fixed')

    stdin.write('x')
    await delay()
    // value prop is "fixed" so display stays "fixed"
    expect(lastFrame()).toContain('fixed')
    expect(lastFrame()).not.toContain('fixedx')
  })

  it('remains empty after backspace when already empty', async () => {
    const { lastFrame, stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="textinput">
        <SearchInput placeholder="empty" />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('empty')

    stdin.write('\b')
    await delay()
    expect(lastFrame()).toContain('empty')
  })
})
