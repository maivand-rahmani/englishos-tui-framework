import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { ScreenRegistry } from '../screens/registry.js'
import {
  NavigationProvider,
  useNavigation,
} from '../navigation/NavigationProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { ModalProvider } from './ModalProvider.js'
import { ConfirmModal } from './ConfirmModal.js'
import { InfoModal } from './InfoModal.js'

function createTestRegistry() {
  const r = new ScreenRegistry()
  r.register({
    id: 'dashboard',
    title: 'Dashboard',
    component: () => <Text>Dashboard Content</Text>,
    category: 'main',
    sidebar: true,
  })
  r.register({
    id: 'confirm-dialog',
    title: 'Confirm',
    component: () => (
      <ConfirmModal
        message="Are you sure?"
        danger
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    ),
    category: 'system',
    sidebar: false,
  })
  r.register({
    id: 'info-dialog',
    title: 'Info',
    component: () => (
      <InfoModal
        message="Operation complete"
        details="All tasks finished successfully"
        onDismiss={() => {}}
      />
    ),
    category: 'system',
    sidebar: false,
  })
  return r
}

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

describe('ModalProvider', () => {
  let registry: ScreenRegistry

  beforeEach(() => {
    registry = createTestRegistry()
  })

  it('renders children when no modal is open', () => {
    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <NavigationProvider registry={registry} defaultScreen="dashboard">
          <ModalProvider>
            <Text>main content</Text>
          </ModalProvider>
        </NavigationProvider>
      </KeyboardScopeProvider>,
    )
    expect(lastFrame()).toContain('main content')
    expect(lastFrame()).not.toContain('Are you sure?')
  })

  it('renders modal content when modal is pushed', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return (
        <ModalProvider>
          <Text>main content</Text>
        </ModalProvider>
      )
    }

    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <NavigationProvider registry={registry} defaultScreen="dashboard">
          <Harness />
        </NavigationProvider>
      </KeyboardScopeProvider>,
    )

    expect(lastFrame()).toContain('main content')

    nav!.pushModal('confirm-dialog')
    await delay()
    const frame = lastFrame()
    expect(frame).toContain('Are you sure?')
    expect(frame).not.toContain('main content')
    expect(frame).toContain('Confirm')
  })

  it('closes modal on Escape', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return (
        <ModalProvider>
          <Text>main content</Text>
        </ModalProvider>
      )
    }

    const { lastFrame, stdin } = renderInTheme(
      <KeyboardScopeProvider defaultScope="modal">
        <NavigationProvider registry={registry} defaultScreen="dashboard">
          <Harness />
        </NavigationProvider>
      </KeyboardScopeProvider>,
    )

    nav!.pushModal('confirm-dialog')
    await delay()
    expect(lastFrame()).toContain('Are you sure?')

    stdin.write('\u001b')
    await delay()
    expect(lastFrame()).toContain('main content')
    expect(lastFrame()).not.toContain('Are you sure?')
  })

  it('shows stacked modal count', async () => {
    let nav: ReturnType<typeof useNavigation> | null = null
    function Harness() {
      nav = useNavigation()
      return (
        <ModalProvider>
          <Text>main content</Text>
        </ModalProvider>
      )
    }

    const { lastFrame } = renderInTheme(
      <KeyboardScopeProvider>
        <NavigationProvider registry={registry} defaultScreen="dashboard">
          <Harness />
        </NavigationProvider>
      </KeyboardScopeProvider>,
    )

    nav!.pushModal('confirm-dialog')
    await delay()
    expect(lastFrame()).not.toContain('more modal')

    nav!.pushModal('info-dialog')
    await delay()
    expect(lastFrame()).toContain('1 more modal')
  })
})

describe('ConfirmModal', () => {
  it('renders title and message', () => {
    const { lastFrame } = renderInTheme(
      <ConfirmModal
        title="Delete?"
        message="This cannot be undone"
        onConfirm={() => {}}
        onCancel={() => {}}
        danger
      />,
    )
    const frame = lastFrame()
    expect(frame).toContain('Delete?')
    expect(frame).toContain('This cannot be undone')
  })

  it('shows confirm and cancel labels', () => {
    const { lastFrame } = renderInTheme(
      <ConfirmModal
        message="Proceed?"
        confirmLabel="OK"
        cancelLabel="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    const frame = lastFrame()
    expect(frame).toContain('[OK]')
    expect(frame).toContain('[Cancel]')
  })

  it('renders with default labels', () => {
    const { lastFrame } = renderInTheme(
      <ConfirmModal
        message="Default labels"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    const frame = lastFrame()
    expect(frame).toContain('[Yes]')
    expect(frame).toContain('[No]')
  })
})

describe('InfoModal', () => {
  it('renders title and message', () => {
    const { lastFrame } = renderInTheme(
      <InfoModal
        title="Success"
        message="Operation completed"
        onDismiss={() => {}}
      />,
    )
    const frame = lastFrame()
    expect(frame).toContain('Success')
    expect(frame).toContain('Operation completed')
  })

  it('renders details when provided', () => {
    const { lastFrame } = renderInTheme(
      <InfoModal
        message="Done"
        details="3 items updated"
        onDismiss={() => {}}
      />,
    )
    expect(lastFrame()).toContain('3 items updated')
  })

  it('renders dismiss label', () => {
    const { lastFrame } = renderInTheme(
      <InfoModal
        message="Done"
        dismissLabel="Got it"
        onDismiss={() => {}}
      />,
    )
    expect(lastFrame()).toContain('[Got it]')
  })

  it('renders with default dismiss label', () => {
    const { lastFrame } = renderInTheme(
      <InfoModal
        message="Done"
        onDismiss={() => {}}
      />,
    )
    expect(lastFrame()).toContain('[OK]')
  })
})
