# runeframe

Reusable Ink/React framework for building terminal applications.
Version 0.4.4

## Install

```bash
npm install runeframe
```

Peer dependencies: `ink ^7.0.2`, `react ^19.2.5`.

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
} from 'runeframe'

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

`FrameworkProvider` composes providers in this order (outermost to innermost):

1. **`ThemeProvider`** — provides design tokens (colors, spacing, typography). Accepts a `themeMode` prop (`'dark'` | `'light'`, default `'dark'`).
2. **`KeyboardScopeProvider`** — manages the scope stack for keyboard event dispatch. Accepts `defaultScope` (default `'navigation'`).
3. **`RegionProvider`** (optional, opt-in via `withRegionProvider`) — adds focus region switching (Tab cycles between regions).
4. **`NavigationProvider`** — screen registry and navigation state management.
5. **`ToastProvider`** (optional, opt-in via `withToastProvider`, default `true`) — toast notification system.
6. **`ModalProvider`** (optional, opt-in via `withModalProvider`, default `true`) — modal dialog management.

```tsx
<FrameworkProvider
  registry={registry}
  defaultScreen="home"
  themeMode="dark"
  defaultScope="navigation"
  withRegionProvider={false}
  withToastProvider={true}
  withModalProvider={true}
>
  <App />
</FrameworkProvider>
```

This order ensures scope-aware keyboard dispatch, navigation state, and modal isolation behave consistently. Modals sit innermost so they can trap keyboard input without interference.

### Manual Composition

For advanced use cases, compose providers directly:

```tsx
<ThemeProvider mode="dark">
  <KeyboardScopeProvider defaultScope="navigation">
    <RegionProvider defaultRegion="content">
      <NavigationProvider registry={registry} defaultScreen="home">
        <ToastProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </ToastProvider>
      </NavigationProvider>
    </RegionProvider>
  </KeyboardScopeProvider>
</ThemeProvider>
```

## Input Architecture

The framework's input system normalizes Ink's raw `(input, key)` tuples into a predictable event model with scope-based routing.

### KeyEventNormalizer

`KeyEventNormalizer` (internal utility in `interaction/KeyEventNormalizer.ts`) converts Ink's `Key` object into a `NormalizedKeyEvent` with consistent boolean fields.

The `normalizeKey(input, key)` function maps:
- `key.upArrow` → `event.up`
- `key.downArrow` → `event.down`
- `key.return` → `event.enter`
- `key.escape` → `event.escape`
- `key.tab` → `event.tab`
- `key.backspace` → `event.backspace`
- `key.delete` → `event.delete`
- `a-z` letters → `event.key` as the lowercase letter
- `input === ' '` → `event.space`

### NormalizedKeyEvent

Exported from types. Fields:

| Field | Type | Description |
|-------|------|-------------|
| `text` | `string` | Printable character (empty for non-printable) |
| `key` | `string` | Lowercase letter or key name (`'enter'`, `'escape'`, `'up'`, etc.) |
| `code` | `string` | Physical key code (same as `event.key`) |
| `isPrintable` | `boolean` | True if this key produces visible text |
| `backspace` | `boolean` | |
| `enter` | `boolean` | |
| `escape` | `boolean` | |
| `tab` | `boolean` | |
| `space` | `boolean` | |
| `up` | `boolean` | |
| `down` | `boolean` | |
| `left` | `boolean` | |
| `right` | `boolean` | |
| `ctrl` | `boolean` | |
| `shift` | `boolean` | |
| `alt` | `boolean` | |
| `meta` | `boolean` | |
| `rawInput` | `string` | Original Ink input string |

### Scope Stack and KeyboardScopeProvider

`KeyboardScopeProvider` manages a stack of scope entries. Each entry is a `ScopeEntry` (aliased as `ScopeStackEntry`):

```typescript
interface ScopeEntry {
  id: FocusScope
  priority: number
  trapsInput: boolean
  allowsBubbling: boolean
  globalShortcutsEnabled: boolean
}
```

**Dispatch algorithm** (deepest-active scope first):
1. Iterate scope entries from deepest (last pushed) to shallowest (first).
2. Within each scope, run registered handlers in priority order (highest first).
3. If a handler returns `true` or calls `stopPropagation()`, dispatch stops.
4. If a scope has `trapsInput: true`, events stop after that scope (no bubbling).
5. Navigation scope is skipped when shell is suspended.

The provider exposes:
- `activateScope(scope)` — set a single scope, replacing the stack
- `pushScope(scope)` — add a scope to the stack (no-ops if already present)
- `popScope(scope?)` — remove a scope (removes last if no argument)
- `isScopeActive(scope)` — check if scope is in the stack
- `registerHandler(scope, handler, options?)` — register a keyboard handler

### ConsumptionResult

`InputConsumptionResult` is an enum exported from types:

| Member | Value | Meaning |
|--------|-------|---------|
| `NotConsumed` | `0` | Event not handled; continue to next handler |
| `Consumed` | `1` | Event handled; stop propagation to siblings |
| `ConsumedAndTrapped` | `2` | Event handled and trapped; no further propagation to any scope |

### Input Hooks

```tsx
// Legacy: (input, key) callback
useInputInScope((input, key) => {
  if (key.upArrow) handleUp()
}, 'list')

// Modern: ScopedInputEvent with stopPropagation()
useScopedInputInScope((event) => {
  if (event.key.upArrow) handleUp()
  event.stopPropagation()
}, 'list')

// KeyHandler: NormalizedKeyEvent + ConsumptionResult return
// (imported from interaction/useInputInScope.ts)
useKeyHandler((event) => {
  if (event.up) handleUp()
  if (event.down) handleDown()
  return InputConsumptionResult.Consumed
}, 'list')

// KeyBinding: match a single normalized key
// (imported from interaction/useInputInScope.ts)
useKeyBinding('enter', handleSubmit, 'navigation', {
  modifiers: { ctrl: true }
})
```

Note: `useKeyHandler` and `useKeyBinding` are available as internal utilities in `interaction/useInputInScope.ts` but are not part of the stable barrel export.

### useShellSuspension

Temporarily disables shell-level hotkeys (navigation scope) while a widget is active.

```tsx
const { suspend, restore, isSuspended } = useShellSuspension()
useEffect(() => {
  suspend()
  return () => restore()
}, [suspend, restore])
```

Used internally by `ChoicePrompt`, `TextInput`, `NumberInput`, `ListSelect`, `OptionGrid`, `RadioList`, and `ModalDialog`.

## Focus Model

The framework has two focus systems. The v2 focus tree is the modern system. `RegionProvider` is the legacy compat layer.

### FocusTreeProvider (v2)

`FocusTreeProvider` manages a tree of focus zones, groups, and focusable items. It is included in `FrameworkProvider` by default (no opt-in needed).

Three hooks form the focus tree:

#### useFocusZone

Declares a focus zone (a region with independent arrow navigation, like a sidebar, content area, or footer).

```tsx
const zone = useFocusZone('sidebar')
// { id: string, isActive: boolean, setActive: () => void }
```

#### useFocusGroup

Manages a group of focusable items within a zone. Handles which item is active.

```tsx
const group = useFocusGroup({
  items: myItems,
  zone: zone.id,
  orientation: 'vertical', // or 'horizontal'
  loop: true,
})
// { activeIndex: number, getItemRef: (i) => RefObject, setActiveIndex: (i) => void }
```

#### useFocusableV2

Marks an individual element as focusable within a group.

```tsx
const focusable = useFocusableV2({
  id: item.id,
  groupId: group.id,
  zoneId: zone.id,
})
// { ref: RefObject, isFocused: boolean, tabIndex: number }
```

#### Full Example

```tsx
function MyList() {
  const zone = useFocusZone('sidebar')
  const group = useFocusGroup({ items: myItems, zone: zone.id })

  return myItems.map((item, i) => (
    <Item
      key={i}
      isFocused={group.activeIndex === i}
      ref={group.getItemRef(i)}
    />
  ))
}
```

### RegionProvider (Legacy Compat)

`RegionProvider` and `useFocusableRegion` still work as a compatibility layer. Enable with `withRegionProvider` on `FrameworkProvider`.

**Core concepts:**

- **Region** — a named interactive zone (`'sidebar'`, `'content'`, `'footer'`)
- **Active region** — the single region receiving keyboard events
- **Tab switching** — Tab cycles through registered regions

```tsx
function SidebarRegion() {
  const { isActive } = useFocusableRegion('sidebar')
  return (
    <FocusScope scope="navigation" autoFocus regionId="sidebar">
      ...
    </FocusScope>
  )
}
```

Region-gated input hooks:

```ts
useInputInRegion(handler, scope, regionId, options?)
useScopedInputInRegion(handler, scope, regionId, options?)
```

Check region state anywhere in the tree:

```tsx
const ctx = useRegionContext()
// ctx.activeRegionId
// ctx.isRegionActive(id)
// ctx.setActiveRegion(id)
```

## Action System

Two action systems exist. The modern scoped system is recommended for new code.

### ScopedActionRegistryProvider (Modern)

Context-based action registry that automatically cleans up when components unmount.

```tsx
<ScopedActionRegistryProvider>
  <MyApp />
</ScopedActionRegistryProvider>
```

```tsx
function MyComponent() {
  useRegisterActions([
    {
      id: 'save',
      label: 'Save',
      keys: ['ctrl+s'],
      handler: handleSave,
      scope: 'command',
      enabled: () => hasUnsavedChanges,
      visible: true,
      category: 'system',
    },
  ])
  return <Text>My Component</Text>
}
```

**Hooks:**

| Hook | Returns | Description |
|------|---------|-------------|
| `useRegisterActions(actions)` | `void` | Register actions with automatic cleanup |
| `useActiveActions()` | `Action[]` | Get visible + enabled actions |
| `useScopedActionRegistry()` | context value | Full access to registry API |

**Context value methods:**

| Method | Description |
|--------|-------------|
| `getVisibleActions()` | Actions where `visible` resolves to true |
| `getActionsByScope(scope)` | Actions filtered by scope |
| `registerActions(actions)` | Register actions, returns cleanup function |
| `isActionAvailable(id)` | Check if action exists and is enabled |

### ActionRegistry (Legacy)

```tsx
const registry = new ActionRegistry()
registry.register({
  id: 'save',
  label: 'Save',
  keys: ['ctrl+s'],
  handler: save,
  category: 'system',
})
registry.search('sav')  // fuzzy search
registry.getVisibleActions()
registry.unregister('save')
```

### Action Interface

```typescript
interface Action {
  id: string
  label: string
  description?: string
  category: string
  handler: () => void
  shortcut?: string            // original shortcut (backward compat)
  keys?: string[]              // trigger keys, e.g. ['b'], ['ctrl+p']
  scope?: FocusScope           // keyboard routing scope
  enabled?: boolean | (() => boolean)
  visible?: boolean | (() => boolean)
  group?: string               // display group for footer hints
}
```

### HotkeyHintBar

Auto-generates footer hints from the scoped action registry.

```tsx
<HotkeyHintBar scope="list" maxHints={6} />
```

Renders registered actions for the given scope as a formatted key-hint bar.

## Widget Primitives

### Selection Widgets

| Component | Description |
|-----------|-------------|
| **`ChoicePrompt`** | Letter-key shortcuts + arrow navigation. Items have a `key` letter for quick selection. |
| **`ListSelect`** | Vertical selectable list with arrow-only selection. |
| **`OptionGrid`** | Horizontal grid selector with 2D arrow navigation. |
| **`RadioList`** | Radio-button-style selection list. |

```tsx
<ChoicePrompt
  items={[
    { key: 'a', label: 'Apple', value: 'apple' },
    { key: 'b', label: 'Banana', value: 'banana' },
  ]}
  onSelect={(item) => handleSelect(item)}
  onCancel={handleCancel}
  label="Pick a fruit:"
/>
```

```tsx
<ListSelect
  items={items}
  onSelect={(item) => handleSelect(item)}
  onCancel={handleCancel}
  label="Choose:"
/>

<OptionGrid
  options={gridOptions}
  columns={3}
  onSelect={(opt) => handleSelect(opt)}
/>

<RadioList
  options={radioOptions}
  selected={currentValue}
  onChange={setValue}
  label="Select one:"
/>
```

### Input Widgets

| Component | Description |
|-----------|-------------|
| **`TextInput`** | Controlled/uncontrolled text input with validation and max length. |
| **`NumberInput`** | Digit buffer, arrow increment/decrement, min/max clamp. |
| **`CommandInput`** | Mode-aware command line input. |
| **`SearchInput`** | Search/filter input with live results. |

```tsx
<TextInput
  placeholder="Type something"
  defaultValue=""
  onSubmit={(value) => handleSubmit(value)}
  maxLength={50}
  validate={(v) => v.length > 0 ? undefined : 'Required'}
/>

<NumberInput
  label="Count"
  defaultValue={5}
  min={1}
  max={100}
  onSubmit={(value) => handleCount(value)}
/>

<CommandInput
  mode="command"
  value={input}
  onChange={setInput}
  onSubmit={handleSubmit}
  placeholder="Type a command..."
/>

<SearchInput
  placeholder="Search..."
  onSearch={(query) => filterResults(query)}
/>
```

### Modal Widgets

| Component | Description |
|-----------|-------------|
| **`ModalDialog`** | Focus-trapped modal wrapper with title and close handler. |
| **`ConfirmCancel`** | Confirm/cancel dialog with optional danger styling. |
| **`ConfirmModal`** | Simple confirm modal. |
| **`ConfirmDialog`** | Programmatic confirm dialog with `useConfirmDialog` hook. |
| **`InfoModal`** | Information display modal. |

```tsx
<ModalDialog title="Confirm" onClose={handleClose}>
  <Text>Are you sure?</Text>
</ModalDialog>

<ConfirmCancel
  title="Delete File"
  message="This action cannot be undone."
  onConfirm={handleDelete}
  onCancel={handleCancel}
  danger
/>

const { confirm, confirmed } = useConfirmDialog()
// <ConfirmDialog ... />
```

### ModalProvider

Provides modal stacking and management:

```tsx
const modal = useModal()
modal.open(<MyModal onClose={() => modal.close()} />)
modal.close()
```

### Multi-Step Flows

**`StepFlow`** — wizard-style multi-step flow with data collection across steps.

```tsx
<StepFlow
  steps={[
    {
      id: 'step1',
      title: 'First Step',
      component: (ctx) => (
        <ChoicePrompt
          items={options}
          onSelect={(item) => {
            ctx.setData('choice', item.value)
            ctx.goNext()
          }}
        />
      ),
    },
    {
      id: 'step2',
      title: 'Second Step',
      component: (ctx) => <Text>Data: {String(ctx.data.choice)}</Text>,
    },
  ]}
  onComplete={(data) => console.log('Done', data)}
  onCancel={() => console.log('Cancelled')}
/>
```

Step context (`StepContext`) provides:
- `data` — accumulated data object across steps
- `setData(key, value)` — store data for the current step
- `goNext()` — advance to next step
- `goBack()` — return to previous step
- `currentStep` — current step index

### Additional Widgets

| Component | Description |
|-----------|-------------|
| **`SelectableList`** | Generic selectable list with keyboard navigation. |
| **`List`** | Simple list display. |

## Async Session Support

### AsyncSessionRunner

Class that manages process lifecycle with states: `idle`, `starting`, `running`, `waiting`, `error`, `complete`.

```tsx
const runner = new AsyncSessionRunner({ runner: processRunner })
runner.start('npm test', undefined, lifecycleCallbacks)
runner.sendInput('y')
runner.cancel()
runner.cleanup()
```

### useAsyncSession

React hook wrapping `AsyncSessionRunner` with auto-cleanup on unmount.

```tsx
const {
  status,       // SessionStatus
  output,       // OutputLine[]
  start,        // (command) => void
  sendInput,    // (input) => void
  cancel,       // () => void
  isRunning,    // boolean
  cleanup,      // () => void
} = useAsyncSession({ runner })
```

### Legacy: useCommandSession

The old combined command session hook is still available:

```tsx
const session = useCommandSession({ runner })
```

## Navigation and Screens

### ScreenRegistry

Register and manage screens:

```tsx
const registry = new ScreenRegistry()
registry.register({
  id: 'home',
  title: 'Home',
  component: HomeScreen,
  sidebar: true,
  category: 'main',
})
```

Screen definition (`ScreenDefinition`): `id`, `title`, `component`, `sidebar?`, `category?` (`ScreenCategory`).

### NavigationProvider

Provides navigation state and actions:

```tsx
const { navigate, goBack, currentScreen } = useNavigation()
const { canGoBack, currentScreen, screenStack } = useNavigationState()
const { navigate, goBack, navigateTo } = useNavigationActions()
```

### ScreenProvider / ScreenRenderer

```tsx
<ScreenProvider>
  <ScreenRenderer />
</ScreenProvider>
```

### Modal Navigation

```tsx
const { isModalOpen, modalStack } = useModalState()
const { openModal, closeModal } = useModalActions()
```

## Layout Components

| Component | Props | Description |
|-----------|-------|-------------|
| **`AppShell`** | `topBar`, `sidebar?`, `children` | Top-level app layout with optional sidebar. |
| **`TopBar`** | `appName`, `screenTitle`, `children?` | Application header bar. |
| **`StatusBar`** | `shortcuts?`, `registry?` | Bottom status bar (legacy shortcuts prop supported, or use registry). |
| **`Panel`** | `title`, `children`, `footer?` | Content panel with optional header/footer. |
| **`Section`** | `title`, `children` | Grouped content section. |
| **`Sidebar`** | `items`, `sectionTitles?`, `...` | Navigation sidebar with auto-registration as focus region. |
| **`Breadcrumbs`** | `crumbs` | Breadcrumb navigation trail. |
| **`Tabs`** | `tabs`, `activeTab`, `onChange` | Tab navigation. |
| **`Divider`** | — | Horizontal divider line. |
| **`Spacer`** | — | Vertical spacing filler. |
| **`Button`** | `children`, `variant?`, `onPress?`, `disabled?` | Action button. Variants: `ButtonVariant`. |
| **`Badge`** | `children`, `variant?` | Status badge. Variants: `BadgeVariant`. |
| **`Table`** | `columns`, `data`, `...` | Data table with column definitions. |
| **`Card`** | `title`, `children`, `footer?` | Bordered content card. |
| **`EmptyState`** | `message`, `icon?` | Empty state placeholder. |
| **`LoadingState`** | `message?` | Loading spinner with message. |
| **`CommandBar`** | `children`, `...` | Command input bar. |
| **`ProcessOutputPanel`** | `output`, `...` | Process output display panel. |
| **`CommandPalette`** | — | Command palette overlay. |

## Diagnostics and Developer Tools

### EventTracer

Captures keyboard event dispatch traces for debugging.

```tsx
const tracer = new EventTracer(200)  // max 200 entries
tracer.enable()
// ... later ...
const trace = tracer.getTrace()  // TraceEntry[]
tracer.disable()
tracer.clear()
```

### KeyboardDebugInspector

React component that displays live keyboard dispatch state.

```tsx
<KeyboardDebugInspector
  tracer={myTracer}
  getActiveScopeStack={getScopeStack}
  getActiveFocusPath={getFocusPath}
/>
```

Shows the active scope stack, focus path, and recent event trace.

### CollisionDetector

Detects conflicting hotkey registrations across actions.

```tsx
import { detectCollisions } from '@maivandrahmani/englishos-tui-framework'

const warnings = detectCollisions(registeredActions)
warnings.forEach((w) => console.warn(w.message))
```

Returns `CollisionWarning[]` with:
- `key` — the conflicting key string
- `severity` — `'error'` (same scope, same key) or `'warning'` (custom scope overlap)
- `action1Id`, `action2Id` — the conflicting action IDs
- `message` — human-readable description

Detection algorithm:
- Same key + same scope → **error** (unreliable dispatch)
- Same key + different builtin scopes → OK (scope stack handles priority)
- Same key + one builtin / one custom scope → **warning** (ambiguous priority)
- Same key + two custom scopes → **warning** (can't determine priority)

## Process Management

| Component/Function | Description |
|--------------------|-------------|
| **`NodeProcessRunner`** | Runs Node.js processes with stdout/stderr capture. |
| **`ProcessRunner`** | Interface for process runners. |
| **`RunningProcess`** | Represents a running process instance. |
| **`useCommandSession`** | Legacy combined command session hook. |

## Toast Notifications

```tsx
<ToastProvider>
  <App />
</ToastProvider>

// Inside app:
const toast = useToast()
toast.show('Operation completed', { variant: 'success', duration: 3000 })
toast.success('Saved!')
toast.error('Failed!')
toast.warning('Almost there...')
toast.info('New update available')
```

Supports close callbacks and result values via `toast.showWithResult()`.

## Theme System

```tsx
const tokens = useTheme()
// tokens.colors.text.primary
// tokens.colors.status.success
// tokens.colors.focus.ring
// tokens.spacing
// tokens.typography
```

Theme tokens are provided by `ThemeProvider` automatically via `FrameworkProvider`.

## Legacy APIs (Still Supported)

The following legacy APIs remain available. New code should use their v2 replacements.

| Legacy API | v2 Replacement |
|------------|----------------|
| `useInputInScope(input, key)` | `useKeyHandler(event)` |
| `useScopedInputInScope(event)` | (still current for ScopedInputEvent) |
| `FocusScope` component | `useFocusZone` + `useFocusGroup` |
| `useFocusable` | `useFocusableV2` |
| `RegionProvider` | `FocusTreeProvider` |
| `useFocusableRegion` | `useFocusZone` |
| `useInputInRegion` | scoped `useKeyHandler` |
| `ActionRegistry` class | `ScopedActionRegistryProvider` |
| `CommandPalette` | (still supported) |
| `useCommandSession` | `useAsyncSession` + `AsyncSessionRunner` |
| `StatusBar shortcuts` prop | `HotkeyHintBar` |
| `ScreenTransition` | Moved to `experimental` namespace |

### RegionProvider / useFocusableRegion

These APIs still work as a compat layer. See the Focus Model section for details on opt-in with `withRegionProvider`.

### ActionRegistry

The global singleton `ActionRegistry` class is still exported. Use `ScopedActionRegistryProvider` for scoped, auto-cleaning action management.

## Migration Guide: v0.3.1 to v0.4.0

This guide covers all API changes introduced in the v3 framework update. Each section includes the old API, the new API, and a migration example.

---

### 1. New Provider Architecture

#### FocusTreeProvider (replaces manual focus wiring)

Old: Apps composed `FocusScope` and `useFocusable` manually, with no central focus tree.

New: `FocusTreeProvider` manages a tree of focus zones and groups. It is included in `FrameworkProvider` by default.

```tsx
// Old
<FocusScope scope="navigation" autoFocus>
  <MyComponent />
</FocusScope>

// New
<FocusTreeProvider>
  <MyApp />
</FocusTreeProvider>
```

#### ScopedActionRegistryProvider (replaces global ActionRegistry)

Old: A singleton `ActionRegistry` class that accumulated actions globally.

New: `ScopedActionRegistryProvider` provides a context-based registry that automatically cleans up when components unmount.

```tsx
// Old
const registry = new ActionRegistry()
registry.register(actions)
registry.unregister(actionIds)

// New
<ScopedActionRegistryProvider>
  <MyComponent />
</ScopedActionRegistryProvider>
```

---

### 2. Input Hooks Migration

#### useInputInScope(input, key) to useKeyHandler(event)

The legacy `useInputInScope` callback receives `(input, key)` tuples from Ink's `useInput`. The new `useKeyHandler` receives a `NormalizedKeyEvent` with named boolean fields.

```tsx
// Old
useInputInScope(
  (input, key) => {
    if (key.upArrow) handleUp()
    if (key.downArrow) handleDown()
    if (key.return) handleSelect()
  },
  'list',
)

// New
useKeyHandler(
  (event) => {
    if (event.up) handleUp()
    if (event.down) handleDown()
    if (event.enter) handleSelect()
    return InputConsumptionResult.Consumed
  },
  'list',
)
```

Key differences:
- Return `InputConsumptionResult.Consumed` to stop propagation (old: `return true`)
- Event uses named booleans (`event.up`, `event.down`, `event.enter`, `event.escape`) instead of Ink key objects
- `useKeyHandler` is imported from `interaction/useInputInScope.js`

#### useInputInScope(handler, scope) to useRegisterActions

For simple single-key bindings, use `useRegisterActions`.

```tsx
// Old
useInputInScope(
  (input, key) => {
    if (key.return) handleSubmit()
  },
  'navigation',
)

// New
useRegisterActions([
  {
    id: 'submit',
    label: 'Submit',
    handler: handleSubmit,
    keys: ['enter'],
    scope: 'navigation',
  },
])
```

---

### 3. Focus Model Migration

#### FocusScope + useFocusable to useFocusZone + useFocusGroup + useFocusableV2

The v2 focus model separates concerns into three layers:

- **`useFocusZone`** — declares a focus zone (like a sidebar, content area, or footer). Zones have independent arrow key navigation.
- **`useFocusGroup`** — a group of focusable items within a zone. Manages which item is active.
- **`useFocusableV2`** — marks an individual element as focusable within a group.

```tsx
// Old
function MyList() {
  const { isFocused } = useFocusable()
  return (
    <FocusScope scope="list">
      <Item isFocused={isFocused} />
    </FocusScope>
  )
}

// New
function MyList() {
  const zone = useFocusZone('sidebar')
  const group = useFocusGroup({ items: myItems, zone: zone.id })

  return myItems.map((item, i) => (
    <Item
      key={i}
      isFocused={group.activeIndex === i}
      ref={group.getItemRef(i)}
    />
  ))
}
```

#### RegionProvider (compat shell)

`RegionProvider` and `useFocusableRegion` still work as a compatibility layer. For new code, use the focus tree (`FocusTreeProvider` + `useFocusZone`).

| Old | New |
|-----|-----|
| `RegionProvider` | `FocusTreeProvider` |
| `useFocusableRegion` | `useFocusZone` |
| `useInputInRegion` | `useKeyHandler` (scoped) |
| `FocusScope regionId` | `useFocusGroup` |

---

### 4. Action Registry

#### ActionRegistry to ScopedActionRegistryProvider + useRegisterActions

```tsx
// Old
const registry = new ActionRegistry()
registry.register([
  { id: 'save', label: 'Save', keys: ['ctrl+s'], handler: save },
])
registry.unregister(['save'])

// New
function MyComponent() {
  useRegisterActions([
    { id: 'save', label: 'Save', keys: ['ctrl+s'], handler: save, scope: 'command' },
  ])
  return <Text>My Component</Text>
}
```

#### StatusBar shortcuts prop to HotkeyHintBar

```tsx
// Old
<StatusBar shortcuts={[
  { key: 'q', label: 'Quit' },
  { key: '/', label: 'Search' },
]} />

// New: HotkeyHintBar reads from ScopedActionRegistryProvider
<HotkeyHintBar scope="list" maxHints={6} />

// Or pass registry to StatusBar
<StatusBar registry={myRegistry} />
```

---

### 5. Widget Migration

#### Selection Widgets

Replace raw `useInputInScope`-based selection with purpose-built widgets:

| Old | New |
|-----|-----|
| `useInputInScope` + manual list | `ChoicePrompt` — letter-key shortcuts + arrow nav |
| `useInputInScope` + manual list | `ListSelect` — arrow-only selection |
| `useInputInScope` + manual grid | `OptionGrid` — 2D grid navigation |
| `useInputInScope` + radio logic | `RadioList` — radio-button style selection |

```tsx
// Old: manual selection with useInputInScope
const [activeIndex, setActiveIndex] = useState(0)
useInputInScope((input, key) => {
  if (key.upArrow) setActiveIndex((i) => Math.max(0, i - 1))
  if (key.downArrow) setActiveIndex((i) => Math.min(items.length - 1, i + 1))
  if (key.return) onSelect(items[activeIndex])
}, 'list')

// New: ChoicePrompt
<ChoicePrompt
  items={items}
  onSelect={(item) => handleSelect(item)}
  onCancel={handleCancel}
  label="Pick one:"
/>
```

#### Text Input Widgets

| Old | New |
|-----|-----|
| Raw `useInput` / `useInputInScope` | `TextInput` |
| Raw digit parsing | `NumberInput` |
| Raw command-style input | `CommandInput` |

```tsx
// Old: manual text input
const [value, setValue] = useState('')
useInputInScope((input, key) => {
  if (key.return) onSubmit(value)
  else if (key.backspace) setValue((v) => v.slice(0, -1))
  else if (input >= ' ' && input <= '~') setValue((v) => v + input)
}, 'textinput')

// New
<TextInput
  placeholder="Type something"
  onSubmit={(value) => handleSubmit(value)}
  maxLength={50}
/>
```

```tsx
<NumberInput
  label="Count"
  defaultValue={5}
  min={1}
  max={100}
  onSubmit={(value) => handleCount(value)}
/>

<CommandInput
  mode="command"
  value={input}
  onChange={setInput}
  onSubmit={handleSubmit}
  placeholder="Type a command..."
/>
```

#### Modal Widgets

| Old | New |
|-----|-----|
| Manual `Box` + `useInput` | `ModalDialog` |
| Manual confirm/cancel | `ConfirmCancel` |

```tsx
// Old: manual modal
<Box borderStyle="round">
  <Text>Are you sure?</Text>
</Box>

// New: ModalDialog
<ModalDialog title="Confirm" onClose={handleClose}>
  <Text>Are you sure?</Text>
</ModalDialog>

// Or: ConfirmCancel
<ConfirmCancel
  title="Delete File"
  message="This action cannot be undone."
  onConfirm={handleDelete}
  onCancel={handleCancel}
  danger
/>
```

#### Multi-Step Flows

| Old | New |
|-----|-----|
| Manual step state + navigation | `StepFlow` |

```tsx
<StepFlow
  steps={[
    {
      id: 'step1',
      title: 'First Step',
      component: (ctx) => (
        <ChoicePrompt
          items={options}
          onSelect={(item) => {
            ctx.setData('choice', item.value)
            ctx.goNext()
          }}
        />
      ),
    },
    {
      id: 'step2',
      title: 'Second Step',
      component: (ctx) => <Text>Data: {String(ctx.data.choice)}</Text>,
    },
  ]}
  onComplete={(data) => console.log('Done', data)}
  onCancel={() => console.log('Cancelled')}
/>
```

---

### 6. Async Sessions

#### useCommandSession to useAsyncSession + AsyncSessionRunner

```tsx
// Old
const session = useCommandSession({ runner })

// New
const {
  status,
  output,
  start,
  sendInput,
  cancel,
  isRunning,
} = useAsyncSession({ runner })
```

`AsyncSessionRunner` is the underlying class that manages process lifecycle:

```tsx
const runner = new AsyncSessionRunner({ runner: processRunner })
runner.start('npm test', undefined, lifecycle)
runner.sendInput('y')
runner.cancel()
runner.cleanup()
```

---

### 7. New APIs

#### useShellSuspension

Temporarily disables shell-level hotkeys (like navigation scope) while a widget is active. Used internally by all input widgets.

```tsx
const { suspend, restore } = useShellSuspension()
useEffect(() => {
  suspend()
  return () => restore()
}, [suspend, restore])
```

#### CollisionDetector (detectCollisions)

Detects conflicting hotkey registrations across actions.

```tsx
import { detectCollisions } from '@maivandrahmani/englishos-tui-framework'

const warnings = detectCollisions(registeredActions)
warnings.forEach((w) => console.warn(w.message))
```

#### EventTracer

Captures keyboard event dispatch traces for debugging.

```tsx
const tracer = new EventTracer(200)
tracer.enable()
// ... later ...
const trace = tracer.getTrace()
tracer.disable()
tracer.clear()
```

#### KeyboardDebugInspector

A React component that displays live keyboard dispatch state.

```tsx
<KeyboardDebugInspector
  tracer={myTracer}
  getActiveScopeStack={getScopeStack}
  getActiveFocusPath={getFocusPath}
/>
```

---

### Quick Reference

| Old | New | Location |
|-----|-----|----------|
| `useInputInScope(input, key)` | `useKeyHandler(event)` | `interaction/useInputInScope` |
| `useInputInScope(handler, scope)` | `useRegisterActions` | `commands/ScopedActionRegistryProvider` |
| `FocusScope` + `useFocusable` | `useFocusZone` + `useFocusGroup` + `useFocusableV2` | `interaction/FocusTreeProvider` |
| `RegionProvider` | `FocusTreeProvider` | `interaction/FocusTreeProvider` |
| `ActionRegistry` | `ScopedActionRegistryProvider` | `commands/ScopedActionRegistryProvider` |
| `StatusBar shortcuts` | `HotkeyHintBar` | `components/HotkeyHintBar` |
| `useCommandSession` | `useAsyncSession` | `commands/useAsyncSession` |
| Manual selection | `ChoicePrompt`, `ListSelect`, `RadioList`, `OptionGrid` | `components/*` |
| Manual text input | `TextInput`, `NumberInput`, `CommandInput` | `components/*` |
| Manual modal | `ModalDialog`, `ConfirmCancel` | `components/*` |
| Manual step flow | `StepFlow` | `components/StepFlow` |
| — | `CollisionDetector` | `commands/CollisionDetector` |
| — | `EventTracer` | `interaction/EventTracer` |
| — | `KeyboardDebugInspector` | `interaction/KeyboardDebugInspector` |

## API Reference

Complete list of all exports grouped by category.

### Types (from `types.ts`)

```
NormalizedKeyEvent
InputConsumptionResult  (enum: NotConsumed, Consumed, ConsumedAndTrapped)
ScopeEntry / ScopeStackEntry
FocusNodeInfo
FocusNodeType  ('zone' | 'group' | 'focusable')
ActionCategory  ('system' | 'navigation' | 'context' | 'input')
ThemeTokens
KeyboardShortcut
BuiltinFocusScope
FocusScope
```

### Constants (from `constants.ts`)

```
getScopePriority, KEY_ENTER, KEY_ESCAPE, KEY_TAB, KEY_BACKSPACE,
KEY_DELETE, KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_SPACE,
and all exports from design-system/tokens.js
```

### Framework Core

| Export | Type |
|--------|------|
| `FrameworkProvider` | Component |
| `FrameworkProviderProps` | Interface |
| `AppShell` | Component |
| `AppShellProps` | Interface |
| `ScreenRegistry` | Class |
| `ScreenProvider` | Component |
| `ScreenRenderer` | Component |
| `useScreen` | Hook |
| `ScreenDefinition` | Type |
| `ScreenCategory` | Type |

### Navigation

| Export | Type |
|--------|------|
| `NavigationProvider` | Component |
| `NavigationProviderProps` | Interface |
| `useNavigation` | Hook |
| `useNavigationState` | Hook |
| `useNavigationActions` | Hook |
| `useModalState` | Hook |
| `useModalActions` | Hook |
| `NavigationEntry` | Type |
| `ModalEntry` | Type |
| `NavigationContextValue` | Type |
| `NavigationStateValue` | Type |
| `NavigationActionsValue` | Type |
| `ModalStateValue` | Type |
| `ModalActionsValue` | Type |

### Layout Components

| Export | Type | Description |
|--------|------|-------------|
| `Panel` | Component | Content panel |
| `Table` | Component | Data table |
| `Column` | Type | Table column definition |
| `Card` | Component | Bordered card |
| `Button` | Component | Action button |
| `ButtonVariant` | Type | Button style variant |
| `Badge` | Component | Status badge |
| `BadgeVariant` | Type | Badge style variant |
| `Section` | Component | Content section |
| `Divider` | Component | Horizontal rule |
| `Spacer` | Component | Vertical spacer |
| `EmptyState` | Component | Empty state placeholder |
| `LoadingState` | Component | Loading spinner |
| `TopBar` | Component | App header bar |
| `Breadcrumbs` | Component | Breadcrumb trail |
| `Tabs` | Component | Tab navigation |
| `Tab` | Type | Tab definition |
| `Sidebar` | Component | Navigation sidebar |
| `SidebarItem` | Type | Sidebar item definition |
| `SidebarSectionTitles` | Type | Sidebar section headers |
| `StatusBar` | Component | Bottom status bar |

### Keyboard / Input

| Export | Type |
|--------|------|
| `KeyboardScopeProvider` | Component |
| `KeyboardScopeProviderProps` | (not exported) |
| `useKeyboardScope` | Hook |
| `useShellSuspension` | Hook |
| `ScopeStackEntry` | Type (alias for `ScopeEntry`) |
| `useInputInScope` | Hook (legacy) |
| `useScopedInputInScope` | Hook (modern) |
| `LegacyInputHandler` | Type |
| `ScopedInputHandler` | Type |
| `UseInputInScopeOptions` | Interface |

### Focus System (v2)

| Export | Type |
|--------|------|
| `FocusTreeProvider` | Component |
| `FocusTreeProviderProps` | Type |
| `FocusZoneContext` | Context |
| `FocusZoneContextValue` | Type |
| `FocusGroupContextValue` | Type |
| `useFocusZone` | Hook |
| `useFocusGroup` | Hook |
| `useFocusableV2` | Hook |
| `UseFocusZoneOptions` | Type |
| `UseFocusZoneResult` | Type |
| `UseFocusGroupOptions` | Type |
| `UseFocusGroupResult` | Type |
| `UseFocusableV2Options` | Type |
| `UseFocusableV2Result` | Type |

### Focus System (Legacy)

| Export | Type |
|--------|------|
| `FocusScope` | Component |
| `useFocusScope` | Hook |
| `FocusScopeProps` | Type |
| `FocusScopeContextValue` | Type |
| `useFocusable` | Hook |
| `UseFocusableOptions` | Type |
| `UseFocusableResult` | Type |
| `RegionProvider` | Component |
| `RegionProviderProps` | Type |
| `useRegionContext` | Hook |
| `useFocusableRegion` | Hook |
| `RegionFocusContextValue` | Type |
| `UseFocusableRegionResult` | Type |
| `useInputInRegion` | Hook |
| `useScopedInputInRegion` | Hook |

### Action System (Modern)

| Export | Type |
|--------|------|
| `ScopedActionRegistryProvider` | Component |
| `ScopedActionRegistryProviderProps` | Type |
| `ScopedActionRegistryContextValue` | Type |
| `useScopedActionRegistry` | Hook |
| `useRegisterActions` | Hook |
| `useActiveActions` | Hook |

### Action System (Legacy)

| Export | Type |
|--------|------|
| `ActionRegistry` | Class |
| `Action` | Interface |
| `ActionMatch` | Interface |
| `CommandPalette` | Component |
| `CommandPaletteProps` | Type |

### Process / Async Sessions

| Export | Type |
|--------|------|
| `NodeProcessRunner` | Class |
| `ProcessRunner` | Interface |
| `RunningProcess` | Type |
| `useCommandSession` | Hook (legacy) |
| `CommandSessionMode` | Type |
| `SessionStatus` | Type (legacy) |
| `UseCommandSessionOptions` | Type |
| `CommandSessionAPI` | Type |
| `OutputLine` | Type |
| `AsyncSessionRunner` | Class |
| `AsyncSessionStatus` | Type |
| `AsyncSessionOptions` | Type |
| `SessionEvent` | Type |
| `SessionLifecycle` | Type |
| `useAsyncSession` | Hook |
| `UseAsyncSessionOptions` | Type |

### Command UI

| Export | Type |
|--------|------|
| `CommandBar` | Component |
| `CommandBarProps` | Type |
| `ProcessOutputPanel` | Component |
| `ProcessOutputPanelProps` | Type |

### Modal System

| Export | Type |
|--------|------|
| `ModalProvider` | Component |
| `ModalProviderProps` | Type |
| `useModal` | Hook |
| `ModalDialog` | Component |
| `ModalDialogProps` | Type |
| `ConfirmCancel` | Component |
| `ConfirmCancelProps` | Type |
| `ConfirmModal` | Component |
| `ConfirmModalProps` | Type |
| `ConfirmDialog` | Component |
| `useConfirmDialog` | Hook |
| `ConfirmDialogProps` | Type |
| `UseConfirmDialogOptions` | Type |
| `UseConfirmDialogResult` | Type |
| `InfoModal` | Component |
| `InfoModalProps` | Type |

### Toast System

| Export | Type |
|--------|------|
| `ToastProvider` | Component |
| `ToastProviderProps` | Type |
| `useToast` | Hook |
| `ToastVariant` | Type |
| `Toast` | Type |
| `ToastResult` | Type |
| `ToastContextValue` | Type |

### Widgets

| Export | Type | Description |
|--------|------|-------------|
| `List` | Component | Generic list |
| `ListItem` | Type | List item definition |
| `SearchInput` | Component | Search/filter input |
| `TextInput` | Component | Text input field |
| `NumberInput` | Component | Number input with increment/decrement |
| `CommandInput` | Component | Command line input |
| `SelectableList` | Component | Keyboard-navigable list |
| `ChoicePrompt` | Component | Letter-key + arrow selection |
| `ChoiceItem` | Type | Choice option definition |
| `ListSelect` | Component | Vertical arrow-only selection |
| `ListSelectItem` | Type | ListSelect option |
| `OptionGrid` | Component | 2D grid selection |
| `OptionGridOption` | Type | Grid option |
| `RadioList` | Component | Radio-button selection |
| `RadioListOption` | Type | Radio option |
| `StepFlow` | Component | Multi-step wizard |
| `Step` | Type | Step definition |
| `StepContext` | Type | Step execution context |

### Diagnostics

| Export | Type |
|--------|------|
| `detectCollisions` | Function |
| `CollisionWarning` | Type |
| `EventTracer` | Class |
| `TraceEntry` | Type |
| `KeyboardDebugInspector` | Component |
| `KeyboardDebugInspectorProps` | Type |

### Experimental

Accessible via `import { experimental } from '@maivandrahmani/englishos-tui-framework'`:

| Export | Type |
|--------|------|
| `experimental.KeyboardRegistry` | Class |
| `experimental.Keybinding` | Type |
| `experimental.ScreenTransition` | Component |
| `experimental.ScreenTransitionProps` | Type |
| `experimental.TransitionType` | Type |
