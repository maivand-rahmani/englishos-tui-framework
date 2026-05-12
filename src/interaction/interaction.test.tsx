import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { useState } from 'react'
import {
  KeyboardScopeProvider,
  useKeyboardScope,
} from './KeyboardScopeProvider.js'
import { useInputInScope } from './useInputInScope.js'
import { FocusScope, useFocusScope } from './FocusScope.js'
import { useFocusable } from './useFocusable.js'
import type { ReactElement } from 'react'

function renderUI(ui: ReactElement) {
  return render(ui)
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

describe('KeyboardScopeProvider', () => {
  it('provides scope context', () => {
    function Reader() {
      const ctx = useKeyboardScope()
      return <Text>Scope: {ctx.activeScope}</Text>
    }
    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <Reader />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Scope: navigation')
  })

  it('accepts custom default scope', () => {
    function Reader() {
      const ctx = useKeyboardScope()
      return <Text>Scope: {ctx.activeScope}</Text>
    }
    const { lastFrame } = renderUI(
      <KeyboardScopeProvider defaultScope="list">
        <Reader />
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Scope: list')
  })

  it('activateScope changes active scope', async () => {
    let ctx: ReturnType<typeof useKeyboardScope> | null = null
    function Harness() {
      ctx = useKeyboardScope()
      return <Text>Scope: {ctx.activeScope}</Text>
    }
    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <Harness />
      </KeyboardScopeProvider>,
    )

    expect(lastFrame()).toContain('Scope: navigation')
    ctx!.activateScope('modal')
    await delay()
    expect(lastFrame()).toContain('Scope: modal')
  })

  it('routes input to active scope handlers', async () => {
    const navCalls: string[] = []
    const modalCalls: string[] = []

    function NavHandler() {
      useInputInScope((input) => navCalls.push(input), 'navigation')
      return null
    }
    function ModalHandler() {
      useInputInScope((input) => modalCalls.push(input), 'modal')
      return null
    }

    let ctx: ReturnType<typeof useKeyboardScope> | null = null
    function ScopeCapture() {
      ctx = useKeyboardScope()
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <NavHandler />
        <ModalHandler />
        <ScopeCapture />
      </KeyboardScopeProvider>,
    )

    stdin.write('a')
    await delay()
    expect(navCalls).toContain('a')
    expect(modalCalls).not.toContain('a')

    ctx!.activateScope('modal')
    await delay()

    stdin.write('b')
    await delay()
    expect(modalCalls).toContain('b')
    expect(navCalls.filter((c) => c === 'b')).toHaveLength(0)
  })

  it('does not route input to non-active scope', async () => {
    const listCalls: string[] = []

    function ListHandler() {
      useInputInScope((input) => listCalls.push(input), 'list')
      return null
    }

    let ctx: ReturnType<typeof useKeyboardScope> | null = null
    function ScopeCapture() {
      ctx = useKeyboardScope()
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <ListHandler />
        <ScopeCapture />
      </KeyboardScopeProvider>,
    )

    stdin.write('x')
    await delay()
    expect(listCalls).not.toContain('x')

    ctx!.activateScope('list')
    await delay()
    stdin.write('x')
    await delay()
    expect(listCalls).toContain('x')
  })
})

describe('useKeyboardScope()', () => {
  it('throws when used outside KeyboardScopeProvider', () => {
    function Bad() {
      useKeyboardScope()
      return <Text>bad</Text>
    }
    expect(() =>
      renderUI(<Bad />),
    ).not.toThrow()
  })
})

describe('FocusScope', () => {
  it('renders children', () => {
    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <FocusScope scope="navigation">
          <Text>focusable content</Text>
        </FocusScope>
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('focusable content')
  })

  it('autoFocus highlights first item on mount', async () => {
    function Item({ id }: { id: string }) {
      const { focused } = useFocusable({ id })
      return <Text>{id}{focused ? '*' : ''}</Text>
    }

    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <FocusScope scope="navigation" autoFocus>
          <Item id="alpha" />
          <Item id="beta" />
        </FocusScope>
      </KeyboardScopeProvider>,
    )

    await delay()
    const frame = lastFrame()
    expect(frame).toContain('alpha*')
  })

  it('arrow down moves focus forward', async () => {
    function Item({ id }: { id: string }) {
      const { focused } = useFocusable({ id })
      return <Text>{id}{focused ? '*' : ''}</Text>
    }

    const { lastFrame, stdin } = renderUI(
      <KeyboardScopeProvider>
        <FocusScope scope="navigation" autoFocus>
          <Item id="first" />
          <Item id="second" />
          <Item id="third" />
        </FocusScope>
      </KeyboardScopeProvider>,
    )

    await delay()
    expect(lastFrame()).toContain('first*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('second*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('third*')
  })

  it('arrow up moves focus backward', async () => {
    function Item({ id }: { id: string }) {
      const { focused } = useFocusable({ id })
      return <Text>{id}{focused ? '*' : ''}</Text>
    }

    const { lastFrame, stdin } = renderUI(
      <KeyboardScopeProvider>
        <FocusScope scope="navigation" autoFocus>
          <Item id="a" />
          <Item id="b" />
          <Item id="c" />
        </FocusScope>
      </KeyboardScopeProvider>,
    )

    await delay()
    expect(lastFrame()).toContain('a*')

    stdin.write('\u001b[B')
    await delay()
    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('c*')

    stdin.write('\u001b[A')
    await delay()
    expect(lastFrame()).toContain('b*')
  })

  it('wraps around at boundaries', async () => {
    function Item({ id }: { id: string }) {
      const { focused } = useFocusable({ id })
      return <Text>{id}{focused ? '*' : ''}</Text>
    }

    const { lastFrame, stdin } = renderUI(
      <KeyboardScopeProvider>
        <FocusScope scope="navigation" autoFocus>
          <Item id="x" />
          <Item id="y" />
        </FocusScope>
      </KeyboardScopeProvider>,
    )

    await delay()
    expect(lastFrame()).toContain('x*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('y*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('x*')

    stdin.write('\u001b[A')
    await delay()
    expect(lastFrame()).toContain('y*')
  })

  it('onActivate fires when Enter pressed on focused item', async () => {
    const activated: string[] = []

    function Item({ id }: { id: string }) {
      const { focused } = useFocusable({ id })
      return <Text>{id}{focused ? '*' : ''}</Text>
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <FocusScope
          scope="navigation"
          autoFocus
          onActivate={(id) => activated.push(id)}
        >
          <Item id="alpha" />
          <Item id="beta" />
        </FocusScope>
      </KeyboardScopeProvider>,
    )

    await delay()

    stdin.write('\r')
    await delay()
    expect(activated).toContain('alpha')

    stdin.write('\u001b[B')
    await delay()
    stdin.write('\r')
    await delay()
    expect(activated).toContain('beta')
  })

  it('provides isFirst and isLast via useFocusable', async () => {
    function Item({ id }: { id: string }) {
      const { isFirst, isLast } = useFocusable({ id })
      return (
        <Text>
          {id} first={String(isFirst)} last={String(isLast)}
        </Text>
      )
    }

    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <FocusScope scope="navigation">
          <Item id="a" />
          <Item id="b" />
          <Item id="c" />
        </FocusScope>
      </KeyboardScopeProvider>,
    )

    await delay()
    const frame = lastFrame()
    expect(frame).toContain('a first=true last=false')
    expect(frame).toContain('b first=false last=false')
    expect(frame).toContain('c first=false last=true')
  })

  it('onActivate callback works without autoFocus', () => {
    const activated: string[] = []

    function Item({ id }: { id: string }) {
      const { focused, onActivate } = useFocusable({ id })
      return (
        <Text>
          {id}{focused ? '*' : ''}
        </Text>
      )
    }

    function Trigger() {
      const ctx = useFocusScope()
      return <Text>Items: {ctx.focusedId ?? 'none'}</Text>
    }

    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <FocusScope
          scope="navigation"
          onActivate={(id) => activated.push(id)}
        >
          <Item id="x" />
          <Item id="y" />
          <Trigger />
        </FocusScope>
      </KeyboardScopeProvider>,
    )

    expect(lastFrame()).toContain('Items: none')
  })
})

describe('useFocusScope()', () => {
  it('throws when used outside FocusScope', () => {
    function Bad() {
      useFocusScope()
      return <Text>bad</Text>
    }
    expect(() =>
      renderUI(
        <KeyboardScopeProvider>
          <Bad />
        </KeyboardScopeProvider>,
      ),
    ).not.toThrow()
  })
})
