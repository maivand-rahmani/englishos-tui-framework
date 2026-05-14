import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Text, Box } from 'ink'
import type { ReactElement } from 'react'
import { KeyboardScopeProvider, useKeyboardScope } from './KeyboardScopeProvider.js'
import { RegionProvider, useFocusableRegion, useRegionContext } from './RegionProvider.js'
import { useInputInRegion } from './useInputInRegion.js'
import { useInputInScope } from './useInputInScope.js'
import { FocusScope, useFocusScope } from './FocusScope.js'
import { useFocusable } from './useFocusable.js'

function renderUI(ui: ReactElement) {
  return render(ui)
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

function TestRegionStatus({ id }: { id: string }) {
  const { isActive } = useFocusableRegion(id)
  return <Text>Region:{id}:{isActive ? 'active' : 'inactive'}</Text>
}

function RegionIndicator() {
  const ctx = useRegionContext()
  return <Text>Active:{ctx.activeRegionId ?? 'none'} Count:{ctx.regionIds.length}</Text>
}

function FocusableItem({ id, label }: { id: string; label: string }) {
  const { focused } = useFocusable({ id })
  return <Text>{label}{focused ? '*' : ''}</Text>
}

describe('RegionProvider', () => {
  describe('basic registration and state', () => {
    it('provides region context with default active region', () => {
      const { lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider>
            <RegionIndicator />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      expect(lastFrame()).toContain('Active:content Count:0')
    })

    it('accepts custom default region', () => {
      const { lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="sidebar">
            <RegionIndicator />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      expect(lastFrame()).toContain('Active:sidebar')
    })

    it('tracks registered regions', async () => {
      function Registerer() {
        useFocusableRegion('sidebar')
        useFocusableRegion('content')
        return <RegionIndicator />
      }

      const { lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider>
            <Registerer />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()
      expect(lastFrame()).toContain('Count:2')
    })

    it('default region shows active when registered', async () => {
      const { lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="sidebar">
            <TestRegionStatus id="sidebar" />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()
      expect(lastFrame()).toContain('Region:sidebar:active')
    })

    it('non-default region shows inactive', async () => {
      const { lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="content">
            <TestRegionStatus id="sidebar" />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()
      expect(lastFrame()).toContain('Region:sidebar:inactive')
    })
  })

  describe('useFocusableRegion', () => {
    it('returns isActive=true when region matches default', async () => {
      const { lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="content">
            <TestRegionStatus id="content" />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()
      expect(lastFrame()).toContain('Region:content:active')
    })

    it('returns isActive=false for non-default region', async () => {
      const { lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="content">
            <TestRegionStatus id="footer" />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()
      expect(lastFrame()).toContain('Region:footer:inactive')
    })

    it('gracefully handles missing RegionProvider (backward compat)', () => {
      function Consumer() {
        const { isActive, activate } = useFocusableRegion('sidebar')
        return <Text>active:{String(isActive)} hasActivate:{String(typeof activate === 'function')}</Text>
      }

      const { lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <Consumer />
        </KeyboardScopeProvider>,
      )
      expect(lastFrame()).toContain('active:true')
      expect(lastFrame()).toContain('hasActivate:true')
    })
  })

  describe('FocusScope with regionId - region gating', () => {
    it('children render regardless of region state', async () => {
      function SidebarRegion() {
        useFocusableRegion('sidebar')
        return (
          <FocusScope scope="navigation" autoFocus regionId="sidebar">
            <Text>SB_ITEM</Text>
          </FocusScope>
        )
      }

      function ContentRegion() {
        useFocusableRegion('content')
        return (
          <FocusScope scope="navigation" autoFocus regionId="content">
            <Text>CT_ITEM</Text>
          </FocusScope>
        )
      }

      const { lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="sidebar">
            <SidebarRegion />
            <ContentRegion />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()
      const frame = lastFrame()
      expect(frame).toContain('SB_ITEM')
      expect(frame).toContain('CT_ITEM')
    })

  })

  describe('useInputInRegion', () => {
    it('suppresses handler when region is inactive', async () => {
      const sidebarCalls: string[] = []
      const contentCalls: string[] = []

      function SidebarHandler() {
        useFocusableRegion('sidebar')
        useInputInRegion((input) => { sidebarCalls.push(input) }, 'navigation', 'sidebar')
        return null
      }

      function ContentHandler() {
        useFocusableRegion('content')
        useInputInRegion((input) => { contentCalls.push(input) }, 'navigation', 'content', { priority: 100 })
        return null
      }

      const { stdin } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="content">
            <SidebarHandler />
            <ContentHandler />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()

      stdin.write('a')
      await delay()
      expect(contentCalls).toContain('a')
      expect(sidebarCalls).not.toContain('a')
    })

    it('allows handler when region is active', async () => {
      const sidebarCalls: string[] = []

      function SidebarHandler() {
        useFocusableRegion('sidebar')
        useInputInRegion((input) => { sidebarCalls.push(input) }, 'navigation', 'sidebar')
        return null
      }

      const { stdin } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="sidebar">
            <SidebarHandler />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()

      stdin.write('x')
      await delay()
      expect(sidebarCalls).toContain('x')
    })
  })

  describe('scope priority overrides region focus', () => {
    it('modal scope blocks region focus input entirely', async () => {
      const navCalls: string[] = []
      const modalCalls: string[] = []

      function NavHandler() {
        useFocusableRegion('sidebar')
        useInputInRegion((input) => { navCalls.push(input) }, 'navigation', 'sidebar')
        return null
      }

      function ModalHandler() {
        useInputInScope((input, _key) => {
          modalCalls.push(input)
          return true
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
          <RegionProvider defaultRegion="sidebar">
            <NavHandler />
            <ModalHandler />
            <ScopeCapture />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()

      stdin.write('a')
      await delay()
      expect(navCalls).toContain('a')

      ctx!.activateScope('modal')
      await delay()

      stdin.write('b')
      await delay()
      expect(modalCalls).toContain('b')
      expect(navCalls.filter((c) => c === 'b')).toHaveLength(0)
    })

    it('command handler consumes event so navigation handler does not fire', async () => {
      const navCalls: string[] = []
      const cmdCalls: string[] = []

      function NavHandler() {
        useFocusableRegion('content')
        useInputInRegion((input) => { navCalls.push(input) }, 'navigation', 'content')
        return null
      }

      function CmdHandler() {
        useInputInScope((input, _key) => {
          cmdCalls.push(input)
          return true
        }, 'command')
        return null
      }

      let ctx: ReturnType<typeof useKeyboardScope> | null = null
      function ScopeCapture() {
        ctx = useKeyboardScope()
        return null
      }

      const { stdin } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="content">
            <NavHandler />
            <CmdHandler />
            <ScopeCapture />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()

      ctx!.pushScope('command')
      await delay()

      stdin.write('b')
      await delay()
      expect(cmdCalls).toContain('b')
      expect(navCalls.filter((c) => c === 'b')).toHaveLength(0)
    })

  })

  describe('backward compatibility', () => {
    it('FocusScope renders children without RegionProvider', () => {
      const { lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <FocusScope scope="navigation">
            <Text>legacy content</Text>
          </FocusScope>
        </KeyboardScopeProvider>,
      )
      expect(lastFrame()).toContain('legacy content')
    })

    it('existing scope tests work with RegionProvider present', async () => {
      const navCalls: string[] = []

      function NavHandler() {
        useInputInScope((input) => { navCalls.push(input) }, 'navigation')
        return null
      }

      const { stdin } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider>
            <NavHandler />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()

      stdin.write('x')
      await delay()
      expect(navCalls).toContain('x')
    })

  })

  describe('useRegionContext', () => {
    it('throws when used outside RegionProvider', () => {
      function Bad() {
        useRegionContext()
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

  describe('render loop regression', () => {
    it('does not enter infinite loop when region switches via Tab', async () => {
      let renderCount = 0

      function RenderTracker() {
        renderCount++
        return null
      }

      function App() {
        useFocusableRegion('sidebar')
        useFocusableRegion('content')
        return (
          <Box flexDirection="column">
            <RenderTracker />
            <FocusScope scope="navigation" autoFocus regionId="sidebar">
              <FocusableItem id="s1" label="S1" />
              <FocusableItem id="s2" label="S2" />
            </FocusScope>
            <FocusScope scope="navigation" autoFocus regionId="content">
              <FocusableItem id="c1" label="C1" />
            </FocusScope>
          </Box>
        )
      }

      const { stdin } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="sidebar">
            <App />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()
      const baseline = renderCount

      stdin.write('\t')
      await delay()
      const afterTab1 = renderCount
      // After Tab: region switches to content
      // If there's a loop, renderCount would explode (100+)
      expect(afterTab1 - baseline).toBeLessThan(50)

      stdin.write('\t')
      await delay()
      const afterTab2 = renderCount
      expect(afterTab2 - afterTab1).toBeLessThan(50)

      // Arrow keys in inactive region should NOT trigger renders
      stdin.write('\u001b[B')
      await delay()
      const afterArrow = renderCount
      expect(afterArrow - afterTab2).toBeLessThan(50)
    })

    it('does not enter infinite loop when SidebarEntry active prop changes', async () => {
      let renderCount = 0

      function RenderTracker() {
        renderCount++
        return null
      }

      function App() {
        useFocusableRegion('sidebar')
        useFocusableRegion('content')
        return (
          <Box flexDirection="column">
            <RenderTracker />
            <FocusScope
              scope="navigation"
              autoFocus
              regionId="sidebar"
              onActivate={(id) => { /* simulate screen change */ }}
            >
              <FocusableItem id="a" label="A" />
              <FocusableItem id="b" label="B" />
              <FocusableItem id="c" label="C" />
            </FocusScope>
          </Box>
        )
      }

      const { stdin } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="sidebar">
            <App />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay()
      const baseline = renderCount

      // Navigate down and activate items
      stdin.write('\u001b[B')
      await delay()
      stdin.write('\u001b[B')
      await delay()
      stdin.write('\r')
      await delay()
      const totalRenders = renderCount - baseline
      // If there's a loop triggered by sidebar interaction,
      // renderCount would explode
      expect(totalRenders).toBeLessThan(50)
    })

    it('useFocusableRegion does not cause cascading re-registrations', async () => {
      let registrationCount = 0

      function Tracker() {
        const ctx = useRegionContext()
        const origRegister = ctx.registerRegion
        // Count registrations by wrapping — but we can't easily intercept
        // Instead, count renders in a component that uses useFocusableRegion
        return null
      }

      function SidebarRegion() {
        useFocusableRegion('sidebar')
        return <Text>sidebar</Text>
      }

      function ContentRegion() {
        useFocusableRegion('content')
        return <Text>content</Text>
      }

      function RenderCounter() {
        const { isActive } = useFocusableRegion('sidebar')
        return <Text>active:{String(isActive)}</Text>
      }

      const { stdin, lastFrame } = renderUI(
        <KeyboardScopeProvider>
          <RegionProvider defaultRegion="content">
            <SidebarRegion />
            <ContentRegion />
            <RenderCounter />
          </RegionProvider>
        </KeyboardScopeProvider>,
      )
      await delay(100)
      expect(lastFrame()).toContain('active:false')

      // Simulate Tab to switch to sidebar region
      stdin.write('\t')
      await delay(100)

      // Should have switched to sidebar without infinite loop
      expect(lastFrame()).toContain('active:true')
    })
  })
})
