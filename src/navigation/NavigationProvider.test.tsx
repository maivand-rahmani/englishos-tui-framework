import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { ScreenRegistry } from '../screens/registry.js'
import {
  NavigationProvider,
  useNavigation,
} from './NavigationProvider.js'

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
  r.register({
    id: 'modal-demo',
    title: 'Modal Demo',
    component: () => <Text>Modal Content</Text>,
    category: 'system',
    sidebar: false,
  })
  return r
}

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

function NavStateReader() {
  const {
    currentScreenId,
    canGoBack,
    breadcrumbs,
    isModalOpen,
    modalStack,
  } = useNavigation()
  return (
    <>
      <Text>Screen:{currentScreenId}</Text>
      <Text>Back:{canGoBack ? 'Y' : 'N'}</Text>
      <Text>Crumbs:{breadcrumbs.length}</Text>
      <Text>Modal:{isModalOpen ? 'Y' : 'N'}</Text>
      <Text>MStack:{modalStack.length}</Text>
    </>
  )
}

describe('NavigationProvider', () => {
  let registry: ScreenRegistry

  beforeEach(() => {
    registry = createTestRegistry()
  })

  it('renders the default screen', () => {
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <NavStateReader />
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Screen:dashboard')
  })

  it('starts with no back history', () => {
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <NavStateReader />
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Back:N')
  })

  it('starts with single breadcrumb', () => {
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <NavStateReader />
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Crumbs:1')
  })

  it('starts with no modals', () => {
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <NavStateReader />
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Modal:N')
    expect(lastFrame()).toContain('MStack:0')
  })

  it('renders a different default screen', () => {
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="lessons">
        <NavStateReader />
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Screen:lessons')
  })

  it('renders children', () => {
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Text>child content</Text>
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('child content')
  })

  it('exposes push function via context', () => {
    let capturedPush: ((id: string) => void) | null = null
    function Capture() {
      const { push } = useNavigation()
      capturedPush = push
      return <NavStateReader />
    }
    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )
    expect(capturedPush).toBeInstanceOf(Function)
  })

  it('exposes pop function via context', () => {
    let capturedPop: (() => void) | null = null
    function Capture() {
      const { pop } = useNavigation()
      capturedPop = pop
      return <NavStateReader />
    }
    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )
    expect(capturedPop).toBeInstanceOf(Function)
  })

  it('exposes popToRoot function via context', () => {
    let captured: (() => void) | null = null
    function Capture() {
      const { popToRoot } = useNavigation()
      captured = popToRoot
      return <NavStateReader />
    }
    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )
    expect(captured).toBeInstanceOf(Function)
  })

  it('exposes replace function via context', () => {
    let captured: ((id: string) => void) | null = null
    function Capture() {
      const { replace } = useNavigation()
      captured = replace
      return <NavStateReader />
    }
    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )
    expect(captured).toBeInstanceOf(Function)
  })

  it('exposes pushModal function via context', () => {
    let captured: ((id: string) => void) | null = null
    function Capture() {
      const { pushModal } = useNavigation()
      captured = pushModal
      return <NavStateReader />
    }
    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )
    expect(captured).toBeInstanceOf(Function)
  })

  it('exposes popModal function via context', () => {
    let captured: (() => void) | null = null
    function Capture() {
      const { popModal } = useNavigation()
      captured = popModal
      return <NavStateReader />
    }
    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )
    expect(captured).toBeInstanceOf(Function)
  })

  it('exposes registry via context', () => {
    function RegistryReader() {
      const { registry: reg } = useNavigation()
      return <Text>Registered: {reg.getAll().length}</Text>
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <RegistryReader />
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Registered: 4')
  })

  it('exposes currentScreen via context', () => {
    function ScreenReader() {
      const { currentScreen } = useNavigation()
      return <Text>Title: {currentScreen.title}</Text>
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <ScreenReader />
      </NavigationProvider>,
    )
    expect(lastFrame()).toContain('Title: Dashboard')
  })

  it('canGoBack becomes true after push and false after pop', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Capture() {
      nav = useNavigation()
      return <NavStateReader />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )

    expect(lastFrame()).toContain('Back:N')

    nav!.push('lessons')
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Back:Y')
    expect(lastFrame()).toContain('Screen:lessons')
    expect(lastFrame()).toContain('Crumbs:2')

    nav!.pop()
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Back:N')
    expect(lastFrame()).toContain('Screen:dashboard')
    expect(lastFrame()).toContain('Crumbs:1')
  })

  it('push adds to breadcrumbs and pop restores', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Capture() {
      nav = useNavigation()
      return <NavStateReader />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )

    expect(lastFrame()).toContain('Crumbs:1')

    nav!.push('lessons')
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Crumbs:2')

    nav!.push('config')
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Crumbs:3')

    nav!.popToRoot()
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Crumbs:1')
    expect(lastFrame()).toContain('Screen:dashboard')
  })

  it('replace does not add to history', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Capture() {
      nav = useNavigation()
      return <NavStateReader />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )

    nav!.replace('lessons')
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Screen:lessons')
    expect(lastFrame()).toContain('Back:N')
    expect(lastFrame()).toContain('Crumbs:1')
  })

  it('pop is no-op when history is empty', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Capture() {
      nav = useNavigation()
      return <NavStateReader />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )

    nav!.pop()
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Screen:dashboard')
    expect(lastFrame()).toContain('Back:N')
  })

  it('popToRoot is no-op when history is empty', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Capture() {
      nav = useNavigation()
      return <NavStateReader />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )

    nav!.popToRoot()
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Screen:dashboard')
  })

  it('pushModal adds to modal stack and popModal removes', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Capture() {
      nav = useNavigation()
      return <NavStateReader />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )

    expect(lastFrame()).toContain('Modal:N')
    expect(lastFrame()).toContain('MStack:0')

    nav!.pushModal('modal-demo')
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Modal:Y')
    expect(lastFrame()).toContain('MStack:1')

    nav!.popModal()
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Modal:N')
    expect(lastFrame()).toContain('MStack:0')
  })

  it('popModal is no-op when modal stack is empty', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    let popModal: (() => void) | null = null
    function Capture() {
      nav = useNavigation()
      popModal = nav.popModal
      return <NavStateReader />
    }
    const { lastFrame } = renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )

    nav!.popModal()
    await new Promise((r) => setTimeout(r, 20))
    expect(lastFrame()).toContain('Modal:N')
    expect(lastFrame()).toContain('MStack:0')
  })

  it('pushModal validates screen exists', () => {
    let capturedPushModal: ((id: string) => void) | null = null
    function Capture() {
      const { pushModal } = useNavigation()
      capturedPushModal = pushModal
      return <NavStateReader />
    }
    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )

    expect(() => capturedPushModal!('nonexistent')).toThrow(
      'Screen "nonexistent" not found in registry',
    )
  })

  it('currentModal returns the topmost modal', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Capture() {
      nav = useNavigation()
      return <NavStateReader />
    }
    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )

    expect(nav!.currentModal).toBeNull()

    nav!.pushModal('modal-demo')
    await new Promise((r) => setTimeout(r, 20))
    expect(nav!.currentModal).not.toBeNull()
    expect(nav!.currentModal!.id).toBe('modal-demo')
    expect(nav!.currentModal!.title).toBe('Modal Demo')
  })

  it('currentModal is null when no modals open', () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Capture() {
      nav = useNavigation()
      return <NavStateReader />
    }
    renderInTheme(
      <NavigationProvider registry={registry} defaultScreen="dashboard">
        <Capture />
      </NavigationProvider>,
    )

    expect(nav!.currentModal).toBeNull()
  })
})

describe('useNavigation()', () => {
  it('does not crash render when used outside NavigationProvider', () => {
    function Consumer() {
      useNavigation()
      return <Text>should not render</Text>
    }
    expect(() =>
      render(
        <ThemeProvider>
          <Consumer />
        </ThemeProvider>,
      ),
    ).not.toThrow()
  })
})
