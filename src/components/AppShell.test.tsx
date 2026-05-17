import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { AppShell } from './AppShell.js'

function renderInShell(ui: ReactElement) {
  return render(
    <KeyboardScopeProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </KeyboardScopeProvider>,
  )
}

describe('AppShell', () => {
  it('renders children in content area', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={100}>
        <Text>Screen Content</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('Screen Content')
  })

  it('renders TopBar when provided', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={100} topBar={<Text>App Title</Text>}>
        <Text>Content</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('App Title')
  })

  it('renders Sidebar when provided and wide', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={100} sidebar={<Text>Navigation</Text>}>
        <Text>Content</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('Navigation')
    expect(lastFrame()).toContain('Content')
  })

  it('renders StatusBar when provided', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={100} statusBar={<Text>Ctrl+C Quit</Text>}>
        <Text>Content</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('Ctrl+C Quit')
  })

  it('renders all four regions together', () => {
    const { lastFrame } = renderInShell(
      <AppShell
        columns={120}
        topBar={<Text>Top</Text>}
        sidebar={<Text>Side</Text>}
        statusBar={<Text>Status</Text>}
      >
        <Text>Main</Text>
      </AppShell>,
    )
    const frame = lastFrame()
    expect(frame).toContain('Top')
    expect(frame).toContain('Side')
    expect(frame).toContain('Main')
    expect(frame).toContain('Status')
  })

  it('renders without TopBar', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={100}>
        <Text>Content Only</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('Content Only')
  })

  it('renders without Sidebar', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={100}>
        <Text>No Sidebar</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('No Sidebar')
  })

  it('renders without StatusBar', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={100}>
        <Text>No Status</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('No Status')
  })

  it('hides sidebar on narrow terminal (< 80 cols)', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={70} sidebar={<Text>Nav</Text>}>
        <Text>Content</Text>
      </AppShell>,
    )
    expect(lastFrame()).not.toContain('Nav')
    expect(lastFrame()).toContain('Content')
  })

  it('shows sidebar at medium width (80-99 cols)', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={90} sidebar={<Text>Nav</Text>}>
        <Text>Main</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('Nav')
    expect(lastFrame()).toContain('Main')
  })

  it('shows sidebar at wide width (>= 100 cols)', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={120} sidebar={<Text>Side</Text>}>
        <Text>Main Content Area</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('Side')
    expect(lastFrame()).toContain('Main Content Area')
  })

  it('treats exactly 80 as medium (sidebar visible)', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={80} sidebar={<Text>Side</Text>}>
        <Text>Main</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('Side')
  })

  it('treats exactly 100 as wide (sidebar visible)', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={100} sidebar={<Text>Side</Text>}>
        <Text>Main</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('Side')
    expect(lastFrame()).toContain('Main')
  })

  it('treats 79 as narrow (sidebar hidden)', () => {
    const { lastFrame } = renderInShell(
      <AppShell columns={79} sidebar={<Text>Side</Text>}>
        <Text>Main</Text>
      </AppShell>,
    )
    expect(lastFrame()).not.toContain('Side')
  })

  it('handles undefined window size gracefully', () => {
    const { lastFrame } = renderInShell(
      <AppShell sidebar={<Text>Side</Text>}>
        <Text>Main</Text>
      </AppShell>,
    )
    expect(lastFrame()).toContain('Main')
  })
})
