import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { ScreenRegistry } from './registry.js'
import { ScreenProvider, useScreen, ScreenRenderer } from './ScreenProvider.js'
import type { ScreenDefinition } from './screen.js'

function createTestRegistry() {
  const r = new ScreenRegistry()
  r.register({
    id: 'dashboard',
    title: 'Dashboard',
    component: () => <Text>Dashboard Screen</Text>,
    category: 'main',
    sidebar: true,
  })
  r.register({
    id: 'lessons',
    title: 'Lessons',
    component: () => <Text>Lessons Screen</Text>,
    category: 'learning',
    sidebar: true,
  })
  r.register({
    id: 'config',
    title: 'Config',
    component: () => <Text>Config Screen</Text>,
    category: 'system',
    sidebar: false,
  })
  return r
}

function Consumer() {
  const screen = useScreen()
  return <Text>Active: {screen.currentScreenId}</Text>
}

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ScreenProvider', () => {
  let registry: ScreenRegistry

  beforeEach(() => {
    registry = createTestRegistry()
  })

  it('provides screen context', () => {
    const { lastFrame } = renderInTheme(
      <ScreenProvider registry={registry} defaultScreen="dashboard">
        <Consumer />
      </ScreenProvider>,
    )
    expect(lastFrame()).toContain('Active: dashboard')
  })

  it('renders children', () => {
    const { lastFrame } = renderInTheme(
      <ScreenProvider registry={registry} defaultScreen="dashboard">
        <Text>child content</Text>
      </ScreenProvider>,
    )
    expect(lastFrame()).toContain('child content')
  })

  it('starts with defaultScreen', () => {
    const { lastFrame } = renderInTheme(
      <ScreenProvider registry={registry} defaultScreen="lessons">
        <Consumer />
      </ScreenProvider>,
    )
    expect(lastFrame()).toContain('Active: lessons')
  })

  it('exposes navigate function via context', () => {
    let capturedNavigate: ((id: string) => void) | null = null
    function CaptureNavigate() {
      const { navigate } = useScreen()
      capturedNavigate = navigate
      return <Consumer />
    }
    const { lastFrame } = renderInTheme(
      <ScreenProvider registry={registry} defaultScreen="dashboard">
        <CaptureNavigate />
      </ScreenProvider>,
    )
    expect(lastFrame()).toContain('Active: dashboard')
    expect(capturedNavigate).toBeInstanceOf(Function)
  })

  it('exposes registry via context', () => {
    function RegistryReader() {
      const { registry: reg } = useScreen()
      return <Text>Registered: {reg.getAll().length}</Text>
    }
    const { lastFrame } = renderInTheme(
      <ScreenProvider registry={registry} defaultScreen="dashboard">
        <RegistryReader />
      </ScreenProvider>,
    )
    expect(lastFrame()).toContain('Registered: 3')
  })

  it('ScreenRenderer renders the current screen component', () => {
    const { lastFrame } = renderInTheme(
      <ScreenProvider registry={registry} defaultScreen="dashboard">
        <ScreenRenderer />
      </ScreenProvider>,
    )
    expect(lastFrame()).toContain('Dashboard Screen')
  })

  it('ScreenRenderer renders a different screen after default', () => {
    const { lastFrame } = renderInTheme(
      <ScreenProvider registry={registry} defaultScreen="config">
        <ScreenRenderer />
      </ScreenProvider>,
    )
    expect(lastFrame()).toContain('Config Screen')
  })
})

describe('useScreen()', () => {
  it('throws when used outside ScreenProvider', () => {
    expect(() => renderInTheme(<Consumer />)).not.toThrow()
  })
})
