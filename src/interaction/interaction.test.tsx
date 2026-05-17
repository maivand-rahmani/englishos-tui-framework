import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { useState, useContext, useEffect } from 'react'
import type { ReactElement, ReactNode } from 'react'
import {
  KeyboardScopeProvider,
  useKeyboardScope,
} from './KeyboardScopeProvider.js'
import { useInputInScope, useKeyHandler, useKeyBinding } from './useInputInScope.js'
import { FocusScope, useFocusScope } from './FocusScope.js'
import { useFocusable } from './useFocusable.js'
import { RegionProvider } from './RegionProvider.js'
import { useFocusZone, useFocusGroup, useFocusableV2, FocusTreeProvider, FocusZoneContext } from './FocusTreeProvider.js'
import { InputConsumptionResult } from '../types.js'
import type { NormalizedKeyEvent } from '../types.js'

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

describe('FocusTreeProvider & Focus Hierarchy', () => {
  function ZoneHarness({
    zoneId,
    children,
  }: {
    zoneId: string
    children: ReactNode
  }) {
    const { ZoneProvider } = useFocusZone(zoneId, { scope: 'navigation' })
    return <ZoneProvider>{children}</ZoneProvider>
  }

  function GroupHarness({
    groupId,
    children,
  }: {
    groupId: string
    children: ReactNode
  }) {
    const { GroupProvider } = useFocusGroup(groupId, { scope: 'navigation' })
    return <GroupProvider>{children}</GroupProvider>
  }

  function FocusableItem({ id, label }: { id: string; label: string }) {
    const { focused, isFirst, isLast } = useFocusableV2({ id })
    return (
      <Text>
        {label}
        {focused ? '*' : ''} f={String(isFirst)} l={String(isLast)}
      </Text>
    )
  }

  it('useFocusZone provides zone context to children', () => {
    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <ZoneHarness zoneId="main">
          <GroupHarness groupId="list">
            <FocusableItem id="a" label="Alpha" />
          </GroupHarness>
        </ZoneHarness>
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('Alpha')
  })

  it('useFocusableV2 reports focused state in a group', async () => {
    function TestGroup() {
      const { GroupProvider, focusedId } = useFocusGroup('items', {
        autoFocus: true,
        scope: 'navigation',
      })
      return (
        <GroupProvider>
          <Text>focusedId={focusedId ?? 'none'}</Text>
          <FocusableItem id="one" label="One" />
          <FocusableItem id="two" label="Two" />
        </GroupProvider>
      )
    }

    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <ZoneHarness zoneId="main">
          <TestGroup />
        </ZoneHarness>
      </KeyboardScopeProvider>,
    )

    await delay()
    const frame = lastFrame()
    expect(frame).toContain('focusedId=none')
  })

  it('useFocusGroup arrow down moves focus forward', async () => {
    function TestGroup() {
      const { GroupProvider } = useFocusGroup('items', {
        autoFocus: true,
        scope: 'navigation',
      })
      return (
        <GroupProvider>
          <FocusableItem id="first" label="First" />
          <FocusableItem id="second" label="Second" />
          <FocusableItem id="third" label="Third" />
        </GroupProvider>
      )
    }

    const { lastFrame, stdin } = renderUI(
      <KeyboardScopeProvider>
        <ZoneHarness zoneId="main">
          <TestGroup />
        </ZoneHarness>
      </KeyboardScopeProvider>,
    )

    await delay()
    expect(lastFrame()).toContain('Third')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('First*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('Second*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('Third*')
  })

  it('useFocusGroup arrow up moves focus backward and wraps', async () => {
    function TestGroup() {
      const { GroupProvider } = useFocusGroup('items', {
        scope: 'navigation',
      })
      return (
        <GroupProvider>
          <FocusableItem id="a" label="A" />
          <FocusableItem id="b" label="B" />
          <FocusableItem id="c" label="C" />
        </GroupProvider>
      )
    }

    const { lastFrame, stdin } = renderUI(
      <KeyboardScopeProvider>
        <ZoneHarness zoneId="main">
          <TestGroup />
        </ZoneHarness>
      </KeyboardScopeProvider>,
    )

    await delay()

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('A*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('B*')

    stdin.write('\u001b[A')
    await delay()
    expect(lastFrame()).toContain('A*')

    stdin.write('\u001b[A')
    await delay()
    expect(lastFrame()).toContain('C*')
  })

  it('useFocusGroup arrow down wraps at bottom', async () => {
    function TestGroup() {
      const { GroupProvider } = useFocusGroup('items', {
        scope: 'navigation',
      })
      return (
        <GroupProvider>
          <FocusableItem id="x" label="X" />
          <FocusableItem id="y" label="Y" />
        </GroupProvider>
      )
    }

    const { lastFrame, stdin } = renderUI(
      <KeyboardScopeProvider>
        <ZoneHarness zoneId="main">
          <TestGroup />
        </ZoneHarness>
      </KeyboardScopeProvider>,
    )

    await delay()

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('X*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('Y*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('X*')
  })

  it('useFocusableV2 reports isFirst and isLast', async () => {
    function TestGroup() {
      const { GroupProvider } = useFocusGroup('items', {
        scope: 'navigation',
      })
      return (
        <GroupProvider>
          <FocusableItem id="a" label="A" />
          <FocusableItem id="b" label="B" />
          <FocusableItem id="c" label="C" />
        </GroupProvider>
      )
    }

    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <ZoneHarness zoneId="main">
          <TestGroup />
        </ZoneHarness>
      </KeyboardScopeProvider>,
    )

    await delay()
    const frame = lastFrame()
    expect(frame).toContain('A f=true l=false')
    expect(frame).toContain('B f=false l=false')
    expect(frame).toContain('C f=false l=true')
  })

  it('useFocusableV2 returns inert state outside a group', () => {
    function OrphanItem() {
      const { focused, isFirst, isLast } = useFocusableV2({ id: 'orphan' })
      return (
        <Text>
          orphan focused={String(focused)} f={String(isFirst)} l={String(isLast)}
        </Text>
      )
    }

    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <OrphanItem />
      </KeyboardScopeProvider>,
    )

    expect(lastFrame()).toContain('orphan focused=false f=false l=false')
  })

  it('zone tracks active group and deepest focusable', async () => {
    const deepest: string[] = []

    function TestGroup() {
      const { GroupProvider, focusedId } = useFocusGroup('items', {
        autoFocus: true,
        scope: 'navigation',
      })

      useEffect(() => {
        if (focusedId) deepest.push(focusedId)
      }, [focusedId])

      return (
        <GroupProvider>
          <FocusableItem id="one" label="One" />
          <FocusableItem id="two" label="Two" />
        </GroupProvider>
      )
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <ZoneHarness zoneId="main">
          <TestGroup />
        </ZoneHarness>
      </KeyboardScopeProvider>,
    )

    await delay()

    stdin.write('\u001b[B')
    await delay()

    stdin.write('\u001b[B')
    await delay()

    expect(deepest).toContain('one')
    expect(deepest).toContain('two')
  })

  it('useFocusGroup activate() makes zone active group', async () => {
    function Activator() {
      const ctx = useContext(FocusZoneContext)
      return (
        <Text>activeGroup={ctx?.activeGroupId ?? 'noctx'}</Text>
      )
    }

    let groupActivate: (() => void) | null = null

    function GroupWithActivator() {
      const result = useFocusGroup('manual', { scope: 'navigation' })
      groupActivate = result.activate
      const { GroupProvider } = result
      return (
        <GroupProvider>
          <Text>active={String(result.isActive)}</Text>
          <FocusableItem id="x" label="X" />
        </GroupProvider>
      )
    }

    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <ZoneHarness zoneId="main">
          <GroupWithActivator />
          <Activator />
        </ZoneHarness>
      </KeyboardScopeProvider>,
    )

    await delay()
    expect(lastFrame()).toContain('activeGroup=manual')

    expect(groupActivate).not.toBeNull()
    groupActivate!()
    await delay()
    expect(lastFrame()).toContain('active=true')
  })

  it('useFocusableV2 onActivate focuses the item', async () => {
    let activateB: (() => void) | null = null

    function ClickableB() {
      const { onActivate, focused } = useFocusableV2({ id: 'b' })
      activateB = onActivate
      return <Text>bFocused={String(focused)}</Text>
    }

    function TestGroup() {
      const { GroupProvider, focusedId } = useFocusGroup('items', {
        scope: 'navigation',
      })
      return (
        <GroupProvider>
          <Text>focused={focusedId ?? 'none'}</Text>
          <FocusableItem id="a" label="A" />
          <FocusableItem id="b" label="B" />
          <ClickableB />
        </GroupProvider>
      )
    }

    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <ZoneHarness zoneId="main">
          <TestGroup />
        </ZoneHarness>
      </KeyboardScopeProvider>,
    )

    await delay()

    expect(activateB).not.toBeNull()
    activateB!()
    await delay()
    expect(lastFrame()).toContain('bFocused=true')
  })

  it('nested zone→group→focusable works end-to-end', async () => {
    function NestedApp() {
      const { ZoneProvider } = useFocusZone('app', { scope: 'navigation' })
      const { GroupProvider } = useFocusGroup('menu', {
        autoFocus: true,
        scope: 'navigation',
      })
      return (
        <ZoneProvider>
          <GroupProvider>
            <FocusableItem id="home" label="Home" />
            <FocusableItem id="settings" label="Settings" />
            <FocusableItem id="about" label="About" />
          </GroupProvider>
        </ZoneProvider>
      )
    }

    const { lastFrame, stdin } = renderUI(
      <KeyboardScopeProvider>
        <NestedApp />
      </KeyboardScopeProvider>,
    )

    await delay()
    expect(lastFrame()).toContain('Home')
    expect(lastFrame()).toContain('Settings')
    expect(lastFrame()).toContain('About')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('Home*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('Settings*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('About*')

    stdin.write('\u001b[B')
    await delay()
    expect(lastFrame()).toContain('Home*')
  })

  it('FocusTreeProvider wraps children in zone context', () => {
    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <FocusTreeProvider defaultScope="navigation">
          <Text>inside tree</Text>
        </FocusTreeProvider>
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('inside tree')
  })
})

// ── Guardrail: Provider Composition ────────────────────────────────

describe('Provider Composition', () => {
  it('composes all three providers without error', async () => {
    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <FocusTreeProvider>
          <RegionProvider defaultRegion="content">
            <Text>composed providers</Text>
          </RegionProvider>
        </FocusTreeProvider>
      </KeyboardScopeProvider>,
    )
    await delay()
    expect(lastFrame()).toContain('composed providers')
  })
})

// ── Guardrail: Scope Ownership ─────────────────────────────────────

describe('Scope Ownership', () => {
  it('pushScope/popScope follows LIFO order', async () => {
    let ctx: ReturnType<typeof useKeyboardScope> | null = null
    function Harness() {
      ctx = useKeyboardScope()
      return <Text>Scopes: {ctx.activeScopes.join(',')}</Text>
    }
    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <Harness />
      </KeyboardScopeProvider>,
    )
    await delay()
    // Default: ['navigation']
    expect(lastFrame()).toContain('Scopes: navigation')

    ctx!.pushScope('modal')
    await delay()
    expect(lastFrame()).toContain('Scopes: navigation,modal')

    ctx!.pushScope('command')
    await delay()
    expect(lastFrame()).toContain('Scopes: navigation,modal,command')

    // popScope() removes the LAST pushed scope
    ctx!.popScope()
    await delay()
    expect(lastFrame()).toContain('Scopes: navigation,modal')

    // pushScope is idempotent when scope already exists
    ctx!.pushScope('modal')
    await delay()
    expect(lastFrame()).toContain('Scopes: navigation,modal')
  })

  it('popScope with explicit scope removes only that scope', async () => {
    let ctx: ReturnType<typeof useKeyboardScope> | null = null
    function Harness() {
      ctx = useKeyboardScope()
      return <Text>Scopes: {ctx.activeScopes.join(',')}</Text>
    }
    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <Harness />
      </KeyboardScopeProvider>,
    )
    await delay()

    ctx!.pushScope('modal')
    ctx!.pushScope('command')
    await delay()
    expect(lastFrame()).toContain('Scopes: navigation,modal,command')

    // popScope('modal') removes only 'modal', leaving others in place
    ctx!.popScope('modal')
    await delay()
    expect(lastFrame()).toContain('Scopes: navigation,command')
  })
})

// ── Guardrail: Legacy API Compat ───────────────────────────────────

describe('Legacy API Compatibility', () => {
  it('legacy useInputInScope still fires with new scope stack', async () => {
    const calls: string[] = []
    function LegacyHandler() {
      useInputInScope((input) => {
        calls.push(input)
      }, 'navigation')
      return null
    }
    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <LegacyHandler />
      </KeyboardScopeProvider>,
    )
    await delay()
    stdin.write('x')
    await delay()
    expect(calls).toContain('x')
  })

  it('legacy useInputInScope receives (input, key) tuple', async () => {
    const received: Array<{ input: string; key: unknown }> = []
    function LegacyHandler() {
      useInputInScope((input, key) => {
        received.push({ input, key })
      }, 'navigation')
      return null
    }
    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <LegacyHandler />
      </KeyboardScopeProvider>,
    )
    await delay()
    stdin.write('z')
    await delay()
    expect(received).toHaveLength(1)
    expect(received[0].input).toBe('z')
    expect(received[0].key).toBeDefined()
  })
})

// ── Guardrail: FocusScope Compat with useFocusZone ─────────────────

describe('FocusScope + useFocusZone Coexistence', () => {
  it('FocusScope works alongside useFocusZone', async () => {
    function OldItem({ id }: { id: string }) {
      const { focused } = useFocusable({ id })
      return <Text>old-{id}{focused ? '*' : ''}</Text>
    }

    function NewItem({ id, label }: { id: string; label: string }) {
      const { focused } = useFocusableV2({ id })
      return <Text>new-{label}{focused ? '*' : ''}</Text>
    }

    function NewGroup() {
      const { GroupProvider } = useFocusGroup('coexist', { scope: 'navigation' })
      return (
        <GroupProvider>
          <NewItem id="n1" label="A" />
          <NewItem id="n2" label="B" />
        </GroupProvider>
      )
    }

    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <FocusScope scope="navigation" autoFocus>
          <OldItem id="o1" />
          <OldItem id="o2" />
        </FocusScope>
        <NewGroup />
      </KeyboardScopeProvider>,
    )
    await delay()

    // Both old and new items render without error
    expect(lastFrame()).toContain('old-o1')
    expect(lastFrame()).toContain('old-o2')
    expect(lastFrame()).toContain('new-A')
    expect(lastFrame()).toContain('new-B')

    // At least one focus system is active (autoFocus triggers a highlight)
    const frame = lastFrame() ?? ''
    const hasFocus = frame.includes('*')
    expect(hasFocus).toBe(true)
  })

  it('FocusScope onActivate fires with Enter on focused item', async () => {
    const activated: string[] = []

    function OldItem({ id }: { id: string }) {
      const { focused } = useFocusable({ id })
      return <Text>old-{id}{focused ? '*' : ''}</Text>
    }

    function NewItem({ id, label }: { id: string; label: string }) {
      const { focused } = useFocusableV2({ id })
      return <Text>new-{label}{focused ? '*' : ''}</Text>
    }

    function NewGroup() {
      const { GroupProvider } = useFocusGroup('act', { scope: 'navigation' })
      return (
        <GroupProvider>
          <NewItem id="nx1" label="X" />
        </GroupProvider>
      )
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <FocusScope
          scope="navigation"
          autoFocus
          onActivate={(id) => activated.push(id)}
        >
          <OldItem id="oa" />
          <OldItem id="ob" />
        </FocusScope>
        <NewGroup />
      </KeyboardScopeProvider>,
    )
    await delay()

    stdin.write('\r')
    await delay()
    expect(activated).toContain('oa')
  })
})

// ── Guardrail: Shell Suspension ────────────────────────────────────

describe('Shell Suspension', () => {
  it('suspendShell blocks navigation handlers', async () => {
    const navCalls: string[] = []
    const otherCalls: string[] = []
    let nav: ReturnType<typeof useKeyboardScope>

    function Harness() {
      const ctx = useKeyboardScope()
      nav = ctx
      return <Text>active</Text>
    }

    function NavHandler() {
      useInputInScope((input) => {
        navCalls.push(input)
      }, 'navigation')
      return null
    }

    function OtherHandler() {
      useInputInScope((input) => {
        otherCalls.push(input)
      }, 'command')
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <Harness />
        <NavHandler />
        <OtherHandler />
      </KeyboardScopeProvider>,
    )
    await delay()

    // Push command scope so it is active alongside navigation
    nav!.pushScope('command')
    await delay()

    // Before suspension: both fire
    stdin.write('a')
    await delay()
    expect(navCalls).toContain('a')
    expect(otherCalls).toContain('a')

    // Suspend shell
    nav!.suspendShell()
    await delay()

    // Clear arrays
    navCalls.length = 0
    otherCalls.length = 0

    // After suspension: navigation blocked, command still fires
    stdin.write('b')
    await delay()
    expect(navCalls).not.toContain('b')
    expect(otherCalls).toContain('b')
  })

  it('suspendShell sets shellSuspended to true', async () => {
    let ctx: ReturnType<typeof useKeyboardScope> | null = null
    function Harness() {
      ctx = useKeyboardScope()
      return <Text>suspended: {String(ctx.shellSuspended)}</Text>
    }
    const { lastFrame } = renderUI(
      <KeyboardScopeProvider>
        <Harness />
      </KeyboardScopeProvider>,
    )
    await delay()
    expect(lastFrame()).toContain('suspended: false')

    ctx!.suspendShell()
    await delay()
    expect(lastFrame()).toContain('suspended: true')
  })

  it('restoreShell re-enables navigation handlers', async () => {
    const navCalls: string[] = []
    let nav: ReturnType<typeof useKeyboardScope>

    function Harness() {
      const ctx = useKeyboardScope()
      nav = ctx
      return <Text>active</Text>
    }

    function NavHandler() {
      useInputInScope((input) => {
        navCalls.push(input)
      }, 'navigation')
      return null
    }

    const { stdin } = renderUI(
      <KeyboardScopeProvider>
        <Harness />
        <NavHandler />
      </KeyboardScopeProvider>,
    )
    await delay()

    // Suspend then restore
    nav!.suspendShell()
    await delay()
    nav!.restoreShell()
    await delay()

    // After restore: navigation fires again
    stdin.write('r')
    await delay()
    expect(navCalls).toContain('r')
  })
})

// ── Guardrail: Scope Churn Regression ───────────────────────────────
//
// When useInputInScope couples pushScope/popScope and registerHandler in
// a single useEffect, unstable deps (e.g. a recreated array every render
// in Tabs/ListSelect) cause scope stack oscillation: the effect teardown
// pops the scope, the setup pushes it back, the state change triggers a
// re-render that recreates the deps, restarting the cycle indefinitely.

describe('scope churn regression', () => {
  it('does not churn scope stack on unstable deps', async () => {
    const scopeSnapshots: string[][] = []
    let producerRenderCount = 0

    function ChurnConsumer({ items }: { items: string[] }) {
      useInputInScope(
        (_input, _key) => {},
        'list',
        { deps: [items] },
      )
      return null
    }

    function ChurnProducer() {
      const { activeScopes } = useKeyboardScope()
      void activeScopes
      producerRenderCount++
      const items = ['a']
      return <ChurnConsumer items={items} />
    }

    function ScopeObserver() {
      const { activeScopes } = useKeyboardScope()
      scopeSnapshots.push([...activeScopes])
      return null
    }

    function Harness() {
      return (
        <KeyboardScopeProvider>
          <ChurnProducer />
          <ScopeObserver />
        </KeyboardScopeProvider>
      )
    }

    renderUI(<Harness />)
    await delay(100)

    // Buggy code produces 30+ renders (pop→push oscillation).
    // Fixed code caps at ≤2 renders (one initial + one scope push).
    expect(producerRenderCount).toBeLessThanOrEqual(10)
    expect(scopeSnapshots.length).toBeLessThanOrEqual(10)
  })

  it('does not churn when deps are stable (false-positive guard)', async () => {
    const scopeSnapshots: string[][] = []

    function StableConsumer() {
      useInputInScope(
        (_input, _key) => {},
        'list',
        { deps: [] },
      )
      return null
    }

    function ScopeObserver() {
      const { activeScopes } = useKeyboardScope()
      scopeSnapshots.push([...activeScopes])
      return null
    }

    function Harness() {
      return (
        <KeyboardScopeProvider>
          <StableConsumer />
          <ScopeObserver />
        </KeyboardScopeProvider>
      )
    }

    renderUI(<Harness />)
    await delay(100)

    // Stable deps: 1 initial render + 1 pushScope re-render = 2 snapshots max.
    expect(scopeSnapshots.length).toBeLessThanOrEqual(3)
  })
})
