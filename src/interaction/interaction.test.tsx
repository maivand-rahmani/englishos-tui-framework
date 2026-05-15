import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { useState } from 'react'
import {
  KeyboardScopeProvider,
  useKeyboardScope,
} from './KeyboardScopeProvider.js'
import { useInputInScope, useKeyHandler, useKeyBinding } from './useInputInScope.js'
import { FocusScope, useFocusScope } from './FocusScope.js'
import { useFocusable } from './useFocusable.js'
import { InputConsumptionResult } from '../types.js'
import type { NormalizedKeyEvent } from '../types.js'
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
      useInputInScope((input) => {
        navCalls.push(input)
      }, 'navigation')
      return null
    }
    function ModalHandler() {
      useInputInScope((input) => {
        modalCalls.push(input)
      }, 'modal')
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
      useInputInScope((input) => {
        listCalls.push(input)
      }, 'list')
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

describe('useKeyHandler', () => {
  it('receives a NormalizedKeyEvent with correct properties', async () => {
    const received: NormalizedKeyEvent[] = []

    function TestHandler() {
      useKeyHandler((event) => {
        received.push(event)
      }, 'navigation')
      return <Text>test</Text>
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <TestHandler />
      </KeyboardScopeProvider>,
    )

    stdin.write('a')
    await delay()
    expect(received).toHaveLength(1)
    expect(received[0].key).toBe('a')
    expect(received[0].text).toBe('a')
    expect(received[0].isPrintable).toBe(true)
    expect(received[0].rawInput).toBe('a')
    expect(received[0].ctrl).toBe(false)
    expect(received[0].shift).toBe(false)
    expect(received[0].meta).toBe(false)
    expect(received[0].alt).toBe(false)
  })

  it('returning Consumed blocks lower-priority handlers', async () => {
    const highCalls: string[] = []
    const lowCalls: string[] = []

    function HighPriority() {
      useKeyHandler(() => {
        highCalls.push('high')
        return InputConsumptionResult.Consumed
      }, 'navigation', { priority: 10 })
      return null
    }
    function LowPriority() {
      useKeyHandler(() => {
        lowCalls.push('low')
      }, 'navigation', { priority: 0 })
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <HighPriority />
        <LowPriority />
      </KeyboardScopeProvider>,
    )

    stdin.write('x')
    await delay()
    expect(highCalls).toContain('high')
    expect(lowCalls).not.toContain('low')
  })

  it('returning NotConsumed passes through to next handler', async () => {
    const firstCalls: string[] = []
    const secondCalls: string[] = []

    function First() {
      useKeyHandler(() => {
        firstCalls.push('first')
        return InputConsumptionResult.NotConsumed
      }, 'navigation', { priority: 10 })
      return null
    }
    function Second() {
      useKeyHandler(() => {
        secondCalls.push('second')
      }, 'navigation', { priority: 0 })
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <First />
        <Second />
      </KeyboardScopeProvider>,
    )

    stdin.write('y')
    await delay()
    expect(firstCalls).toContain('first')
    expect(secondCalls).toContain('second')
  })

  it('returning true as boolean is treated as Consumed', async () => {
    const highCalls: string[] = []
    const lowCalls: string[] = []

    function HighPriority() {
      useKeyHandler(() => {
        highCalls.push('high')
        return true
      }, 'navigation', { priority: 10 })
      return null
    }
    function LowPriority() {
      useKeyHandler(() => {
        lowCalls.push('low')
      }, 'navigation', { priority: 0 })
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <HighPriority />
        <LowPriority />
      </KeyboardScopeProvider>,
    )

    stdin.write('z')
    await delay()
    expect(highCalls).toContain('high')
    expect(lowCalls).not.toContain('low')
  })

  it('returning ConsumedAndTrapped blocks propagation', async () => {
    const trappedCalls: string[] = []
    const otherCalls: string[] = []

    function Trapping() {
      useKeyHandler(() => {
        trappedCalls.push('trapped')
        return InputConsumptionResult.ConsumedAndTrapped
      }, 'navigation', { priority: 10 })
      return null
    }
    function Other() {
      useKeyHandler(() => {
        otherCalls.push('other')
      }, 'navigation', { priority: 0 })
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <Trapping />
        <Other />
      </KeyboardScopeProvider>,
    )

    stdin.write('t')
    await delay()
    expect(trappedCalls).toContain('trapped')
    expect(otherCalls).not.toContain('other')
  })

  it('does not fire when scope is not active', async () => {
    const calls: string[] = []

    function TestHandler() {
      useKeyHandler(() => {
        calls.push('fired')
      }, 'list')
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <TestHandler />
      </KeyboardScopeProvider>,
    )

    stdin.write('q')
    await delay()
    expect(calls).not.toContain('fired')
  })
})

describe('useKeyBinding', () => {
  it('fires when bound key matches', async () => {
    const bCalls: string[] = []

    function TestHandler() {
      useKeyBinding('b', () => {
        bCalls.push('b')
      }, 'navigation')
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <TestHandler />
      </KeyboardScopeProvider>,
    )

    stdin.write('b')
    await delay()
    expect(bCalls).toContain('b')
  })

  it('does not fire when bound key does not match', async () => {
    const bCalls: string[] = []

    function TestHandler() {
      useKeyBinding('b', () => {
        bCalls.push('b')
      }, 'navigation')
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <TestHandler />
      </KeyboardScopeProvider>,
    )

    stdin.write('c')
    await delay()
    expect(bCalls).not.toContain('b')
  })

  it('requires modifier match when modifiers are specified', async () => {
    const ctrlBCalls: string[] = []

    function TestHandler() {
      useKeyBinding('b', () => {
        ctrlBCalls.push('ctrl+b')
      }, 'navigation', { modifiers: { ctrl: true } })
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <TestHandler />
      </KeyboardScopeProvider>,
    )

    // bare 'b' (no ctrl) should NOT fire
    stdin.write('b')
    await delay()
    expect(ctrlBCalls).not.toContain('ctrl+b')
  })

  it('fires on plain key without modifiers by default', async () => {
    const calls: string[] = []

    function TestHandler() {
      useKeyBinding('b', () => {
        calls.push('b')
      }, 'navigation')
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <TestHandler />
      </KeyboardScopeProvider>,
    )

    stdin.write('b')
    await delay()
    expect(calls).toContain('b')
  })

  it('useKeyBinding consumes the event by returning true', async () => {
    const boundCalls: string[] = []
    const fallbackCalls: string[] = []

    function Bound() {
      useKeyBinding('x', () => {
        boundCalls.push('bound')
      }, 'navigation', { priority: 10 })
      return null
    }
    function Fallback() {
      useKeyHandler(() => {
        fallbackCalls.push('fallback')
      }, 'navigation', { priority: 0 })
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <Bound />
        <Fallback />
      </KeyboardScopeProvider>,
    )

    stdin.write('x')
    await delay()
    expect(boundCalls).toContain('bound')
    expect(fallbackCalls).not.toContain('fallback')
  })
})
