# englishos-tui-framework

Reusable Ink/React framework for building terminal applications.

This package is currently in **public beta** (`0.x`).

## Install

```bash
npm install englishos-tui-framework@beta
```

## Quickstart

```tsx
import { render } from 'ink'
import React from 'react'
import {
  FrameworkProvider,
  AppShell,
  TopBar,
  ScreenRegistry,
  ScreenRenderer,
  useNavigationState,
} from 'englishos-tui-framework'

const registry = new ScreenRegistry()
registry.register({
  id: 'home',
  title: 'Home',
  component: () => 'Hello from Home',
  sidebar: true,
  category: 'main',
})

function Shell() {
  const { currentScreen } = useNavigationState()
  return (
    <AppShell topBar={<TopBar appName="Demo" screenTitle={currentScreen.title} />}>
      <ScreenRenderer />
    </AppShell>
  )
}

function App() {
  return (
    <FrameworkProvider registry={registry} defaultScreen="home">
      <Shell />
    </FrameworkProvider>
  )
}

render(<App />)
```

## Provider Architecture

`FrameworkProvider` composes providers in this order:

1. `ThemeProvider`
2. `KeyboardScopeProvider`
3. `NavigationProvider`
4. `ToastProvider` (optional)
5. `ModalProvider` (optional)

This order ensures scope-aware keyboard dispatch, navigation state, and modal isolation behave consistently.

## Keyboard and Focus Model

- Keyboard input is routed by scope priority.
- Handlers can consume events (`return true`) to stop propagation.
- `useInputInScope` is the legacy `(input, key)` API.
- `useScopedInputInScope` is the modern event API with `stopPropagation()`.

## Public API Boundary

- Root exports are considered stable for beta consumers.
- Experimental APIs are exposed under:

```ts
import { experimental } from 'englishos-tui-framework'
```

## Migration Notes (from internal `@tui/framework`)

1. Rename imports to `englishos-tui-framework`.
2. Replace manual provider composition with `FrameworkProvider`.
3. For advanced keyboard arbitration, migrate from `useInputInScope` to `useScopedInputInScope`.
4. `ScreenTransition` moved to the `experimental` namespace.
