import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { ScreenRegistry } from '../screens/registry.js'
import { NavigationProvider, useNavigation } from './NavigationProvider.js'
import { ScreenTransition } from './ScreenTransition.js'

function createTestRegistry() {
  const r = new ScreenRegistry()
  r.register({
    id: 'a',
    title: 'Screen A',
    component: () => <Text>Content A</Text>,
    category: 'main',
    sidebar: true,
  })
  r.register({
    id: 'b',
    title: 'Screen B',
    component: () => <Text>Content B</Text>,
    category: 'learning',
    sidebar: true,
  })
  return r
}

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

describe('ScreenTransition', () => {
  let registry: ScreenRegistry

  beforeEach(() => {
    registry = createTestRegistry()
  })

  it('renders children with type=none', () => {
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="a">
        <ScreenTransition type="none">
          <Text>Content A</Text>
        </ScreenTransition>
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Content A')
  })

  it('updates when screen changes (type=none)', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return (
        <ScreenTransition type="none">
          <Text>Content: {nav!.currentScreen.title}</Text>
        </ScreenTransition>
      )
    }

    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="a">
        <Harness />
      </NavigationProvider>,
    )

    expect(lastFrame()).toContain('Screen A')

    nav!.push('b')
    await delay()
    expect(lastFrame()).toContain('Screen B')
  })

  it('accepts custom transition type', () => {
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="a">
        <ScreenTransition type="fade">
          <Text>Content A</Text>
        </ScreenTransition>
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Content A')
  })

  it('accepts slide type', () => {
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="a">
        <ScreenTransition type="slide">
          <Text>Content A</Text>
        </ScreenTransition>
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Content A')
  })
})
