import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { ScreenRegistry } from '../screens/registry.js'
import { NavigationProvider, useNavigation } from '../navigation/NavigationProvider.js'
import { Breadcrumbs } from './Breadcrumbs.js'

function createTestRegistry() {
  const r = new ScreenRegistry()
  r.register({
    id: 'dashboard',
    title: 'Dashboard',
    component: () => <Text>Dash</Text>,
    category: 'main',
    sidebar: true,
  })
  r.register({
    id: 'lessons',
    title: 'Lessons',
    component: () => <Text>Lessons</Text>,
    category: 'learning',
    sidebar: true,
  })
  r.register({
    id: 'lessonDetail',
    title: 'Present Perfect',
    component: () => <Text>Detail</Text>,
    category: 'learning',
    sidebar: false,
  })
  r.register({
    id: 'speak',
    title: 'Speaking',
    component: () => <Text>Speak</Text>,
    category: 'learning',
    sidebar: true,
  })
  r.register({
    id: 'config',
    title: 'Settings',
    component: () => <Text>Config</Text>,
    category: 'system',
    sidebar: false,
  })
  return r
}

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('Breadcrumbs', () => {
  let registry: ScreenRegistry

  beforeEach(() => {
    registry = createTestRegistry()
  })

  it('renders single breadcrumb at root', () => {
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Breadcrumbs />
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Dashboard')
  })

  it('renders breadcrumbs from navigation history', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return <Breadcrumbs />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Harness />
      </NavigationProvider>,
    )

    expect(lastFrame()).toContain('Dashboard')

    nav!.push('lessons')
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Dashboard')
    expect(lastFrame()).toContain('Lessons')

    nav!.push('lessonDetail')
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Dashboard')
    expect(lastFrame()).toContain('Lessons')
    expect(lastFrame()).toContain('Present Perfect')
  })

  it('shows separator between breadcrumb items', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return <Breadcrumbs />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Harness />
      </NavigationProvider>,
    )

    nav!.push('lessons')
    await new Promise((r) => setTimeout(r, 20))
    const frame = lastFrame()
    expect(frame).toContain('>')
    expect(frame).toMatch(/Dashboard\s*>\s*Lessons/)
  })

  it('highlights current (last) segment as active', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return <Breadcrumbs />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Harness />
      </NavigationProvider>,
    )

    expect(lastFrame()).toContain('Dashboard')

    nav!.push('lessons')
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Dashboard')
    expect(lastFrame()).toContain('Lessons')
  })

  it('fires onSelect with screenId when segment clicked', async () => {
    const selections: string[] = []
    let nav: ReturnType<typeof useNavigation> | null = null

    function Harness() {
      nav = useNavigation()
      return (
        <Breadcrumbs
          onSelect={(id) => {
            selections.push(id)
          }}
        />
      )
    }

    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Harness />
      </NavigationProvider>,
    )

    const { breadcrumbs } = nav!
    expect(breadcrumbs.length).toBe(1)
    expect(breadcrumbs[0].screenId).toBe('dashboard')
  })

  it('renders a specific onSelect is passed as function', () => {
    let capturedOnSelect: string | null = null
    function Harness() {
      return (
        <Breadcrumbs
          onSelect={(id) => {
            capturedOnSelect = id
          }}
        />
      )
    }
    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Harness />
      </NavigationProvider>,
    )
    expect(capturedOnSelect).toBeNull()
  })

  it('uses custom separator', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return <Breadcrumbs separator=" / " />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Harness />
      </NavigationProvider>,
    )

    nav!.push('lessons')
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toMatch(/Dashboard\s*\/\s*Lessons/)
  })

  it('truncates overflow with maxItems', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return <Breadcrumbs maxItems={3} />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Harness />
      </NavigationProvider>,
    )

    nav!.push('lessons')
    await new Promise((r) => setTimeout(r, 20))
    nav!.push('lessonDetail')
    await new Promise((r) => setTimeout(r, 20))
    nav!.push('speak')
    await new Promise((r) => setTimeout(r, 20))

    const frame = lastFrame()
    expect(frame).toContain('Dashboard')
    expect(frame).toContain('Speaking')
    expect(frame).toContain('...')
  })

  it('does not truncate when within maxItems', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return <Breadcrumbs maxItems={5} />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Harness />
      </NavigationProvider>,
    )

    nav!.push('lessons')
    await new Promise((r) => setTimeout(r, 20))
    nav!.push('lessonDetail')
    await new Promise((r) => setTimeout(r, 20))

    const frame = lastFrame()
    expect(frame).toContain('Dashboard')
    expect(frame).toContain('Lessons')
    expect(frame).toContain('Present Perfect')
    expect(frame).not.toContain('...')
  })

  it('updates when navigation stack changes', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return <Breadcrumbs />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Harness />
      </NavigationProvider>,
    )

    expect(lastFrame()).toContain('Dashboard')

    nav!.push('lessons')
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Lessons')

    nav!.pop()
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Dashboard')
    expect(lastFrame()).not.toContain('Lessons')
  })
})
