# @maivandrahmani/englishos-tui-framework

Reusable Ink/React framework for building terminal applications.

This package is currently in **public beta** (`0.x`).

## Install

```bash
npm install @maivandrahmani/englishos-tui-framework@beta
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
} from '@maivandrahmani/englishos-tui-framework'

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
3. `RegionProvider` (optional, opt-in via `withRegionProvider`)
4. `NavigationProvider`
5. `ToastProvider` (optional)
6. `ModalProvider` (optional)

This order ensures scope-aware keyboard dispatch, navigation state, and modal isolation behave consistently.

## Keyboard and Focus Model

- Keyboard input is routed by scope priority.
- Handlers can consume events (`return true`) to stop propagation.
- `useInputInScope` is the legacy `(input, key)` API.
- `useScopedInputInScope` is the modern event API with `stopPropagation()`.

### Focus Regions (v0.3.0)

When multiple interactive areas (sidebar, content, command bar) coexist on screen,
keyboard events can reach the wrong handler. Focus regions solve this by providing
a model where only one named region receives keyboard input at a time.

**Core concepts:**

- **Region** — a named interactive zone (e.g. `'sidebar'`, `'content'`, `'footer'`)
- **Active region** — the single region currently receiving keyboard events
- **Tab switching** — Tab cycles through registered regions

**Setup:**

Enable regions via `FrameworkProvider`:

```tsx
<FrameworkProvider
  registry={registry}
  defaultScreen="home"
  withRegionProvider  // opt in
  defaultRegion="content"
>
  <Shell />
</FrameworkProvider>
```

Or compose manually:

```tsx
<KeyboardScopeProvider>
  <RegionProvider defaultRegion="content">
    <NavigationProvider ...>
      ...
    </NavigationProvider>
  </RegionProvider>
</KeyboardScopeProvider>
```

**Registering regions with `useFocusableRegion`:**

Components call this hook to declare themselves as a focusable region:

```tsx
function SidebarRegion() {
  const { isActive } = useFocusableRegion('sidebar')
  // isActive = true when sidebar is the focused region
  return (
    <FocusScope scope="navigation" autoFocus regionId="sidebar">
      ...
    </FocusScope>
  )
}
```

**Keyboard routing with `FocusScope regionId`:**

When a `FocusScope` is given a `regionId`, its arrow/Enter handlers only fire when
that region is active. Inactive regions remain visible but ignore keyboard input.

```tsx
<FocusScope scope="navigation" regionId="sidebar" onActivate={...}>
  {/* keyboard only active when sidebar region is focused */}
</FocusScope>
```

**Region-gated input hooks:**

Low-level hooks that suppress handler execution when the region is inactive:

```ts
useInputInRegion(handler, scope, regionId, options?)
useScopedInputInRegion(handler, scope, regionId, options?)
```

These behave like `useInputInScope` / `useScopedInputInScope` but only fire
when `regionId` matches the active region.

**Visual state:**

Check region state anywhere in the tree:

```tsx
const ctx = useRegionContext()
// ctx.activeRegionId — the currently active region
// ctx.isRegionActive(id) — check a specific region
// ctx.setActiveRegion(id) — programmatically switch
```

**Sidebar integration:**

The `Sidebar` component now registers itself as a `'sidebar'` region. When it is
not the active region, it renders passively (items shown without interactive styling).
When focused via Tab, arrow keys and Enter navigate sidebar items normally.

**Scope override (modal/command/process):**

Higher-priority scopes (modal, command, process) still take precedence over
region focus. This is handled by the existing `KeyboardScopeProvider` priority
system — no region-specific changes needed for these modes.

## Public API Boundary

- Root exports are considered stable for beta consumers.
- Experimental APIs are exposed under:

```ts
import { experimental } from '@maivandrahmani/englishos-tui-framework'
```

## Migration Notes (from internal `@tui/framework`)

1. Rename imports to `@maivandrahmani/englishos-tui-framework`.
2. Replace manual provider composition with `FrameworkProvider`.
3. For advanced keyboard arbitration, migrate from `useInputInScope` to `useScopedInputInScope`.
4. `ScreenTransition` moved to the `experimental` namespace.

## Migration to v0.3.0 (Focus Regions)

v0.3.0 introduces the focus region system. The changes are additive — existing
apps continue to work without modification.

**If you do nothing:** All existing keyboard behavior is preserved. The new APIs
(`RegionProvider`, `useFocusableRegion`, `useInputInRegion`) are available but
not required.

**If you opt in:**

1. Set `withRegionProvider` on `<FrameworkProvider>` to enable the region layer.
2. (Optional) Add `useFocusableRegion('sidebar')` to any `Sidebar` instances —
   this is already done inside the `Sidebar` component.
3. For custom interactive panels, call `useFocusableRegion(id)` and pass
   `regionId={id}` to their `<FocusScope>`.
4. For ad‑hoc keyboard handlers, replace `useInputInScope` with
   `useInputInRegion(handler, scope, regionId)` to gate by region.
