import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { FrameworkProvider } from './FrameworkProvider.js'
import { ScreenRegistry } from './screens/registry.js'

const registry = new ScreenRegistry()
registry.register({
  id: 'home',
  title: 'Home',
  component: () => React.createElement('text', null, 'HomeScreen'),
  sidebar: true,
  category: 'main',
})

function TestChild() {
  return React.createElement('text', null, 'child renders')
}

describe('FrameworkProvider', () => {
  it('renders children with default options', () => {
    const { lastFrame } = render(
      React.createElement(
        FrameworkProvider,
        { registry, defaultScreen: 'home', children: React.createElement(TestChild) },
      ),
    )
    expect(lastFrame()).toBeTruthy()
  })

  it('renders with withRegionProvider=true', () => {
    const { lastFrame } = render(
      React.createElement(
        FrameworkProvider,
        { registry, defaultScreen: 'home', withRegionProvider: true, children: React.createElement(TestChild) },
      ),
    )
    expect(lastFrame()).toBeTruthy()
  })

  it('renders with withToastProvider=false', () => {
    const { lastFrame } = render(
      React.createElement(
        FrameworkProvider,
        { registry, defaultScreen: 'home', withToastProvider: false, children: React.createElement(TestChild) },
      ),
    )
    expect(lastFrame()).toBeTruthy()
  })

  it('renders with withModalProvider=false', () => {
    const { lastFrame } = render(
      React.createElement(
        FrameworkProvider,
        { registry, defaultScreen: 'home', withModalProvider: false, children: React.createElement(TestChild) },
      ),
    )
    expect(lastFrame()).toBeTruthy()
  })

  it('renders with all flags off', () => {
    const { lastFrame } = render(
      React.createElement(
        FrameworkProvider,
        {
          registry,
          defaultScreen: 'home',
          withRegionProvider: false,
          withToastProvider: false,
          withModalProvider: false,
          children: React.createElement(TestChild),
        },
      ),
    )
    expect(lastFrame()).toBeTruthy()
  })
})
