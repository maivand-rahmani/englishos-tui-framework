# Migration Guide: v0.2.x to v2.x

This guide covers all API changes introduced in the v2 framework
update. Each section includes the old API, the new API, and a
migration example.

---

## 1. New Provider Architecture

### FocusTreeProvider (replaces manual focus wiring)

Old: Apps composed `FocusScope` and `useFocusable` manually, with
no central focus tree.

New: `FocusTreeProvider` manages a tree of focus zones and groups.
Wrap it near the top of your component tree (it is included in
`FrameworkProvider` by default).

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

### ScopedActionRegistryProvider (replaces global ActionRegistry)

Old: A singleton `ActionRegistry` class that accumulated actions
globally, making it hard to scope actions to screens or
components.

New: `ScopedActionRegistryProvider` provides a context-based
registry that automatically cleans up when components unmount.

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

## 2. Input Hooks Migration

### `useInputInScope(input, key)` to `useKeyHandler(event)`

The legacy `useInputInScope` callback receives `(input, key)` tuples
from Ink's `useInput`. The new `useKeyHandler` receives a
`NormalizedKeyEvent` with named boolean fields.

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
- Return `InputConsumptionResult.Consumed` to stop propagation
  (old: return `true`)
- Event uses named booleans (`event.up`, `event.down`, `event.enter`,
  `event.escape`) instead of Ink key objects
- `useKeyHandler` is imported from `interaction/useInputInScope.js`

### `useInputInScope(handler, scope)` to `useKeyBinding(key, handler, scope)`

For simple single-key bindings where you only care about one key,
use `useRegisterActions` instead.

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

## 3. Focus Model Migration

### `FocusScope` + `useFocusable` to `useFocusZone` + `useFocusGroup` + `useFocusableV2`

The v2 focus model separates concerns into three layers:

- **`useFocusZone`** — declares a focus zone (like a sidebar,
  content area, or footer). Zones have independent arrow key
  navigation.
- **`useFocusGroup`** — a group of focusable items within a zone.
  Manages which item is active.
- **`useFocusableV2`** — marks an individual element as focusable
  within a group.

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

### `RegionProvider` (compat shell)

`RegionProvider` and `useFocusableRegion` still work as a
compatibility layer. For new code, use the focus tree
(`FocusTreeProvider` + `useFocusZone`).

| Old | New |
|-----|-----|
| `RegionProvider` | `FocusTreeProvider` |
| `useFocusableRegion` | `useFocusZone` |
| `useInputInRegion` | `useKeyHandler` (scoped) |
| `FocusScope regionId` | `useFocusGroup` |

---

## 4. Action Registry

### `ActionRegistry` to `ScopedActionRegistryProvider` + `useRegisterActions`

Old: Actions were registered on a global singleton.

```tsx
// Old
const registry = new ActionRegistry()
registry.register([
  { id: 'save', label: 'Save', keys: ['ctrl+s'], handler: save },
])
registry.unregister(['save'])
```

New: Actions are scoped to the component tree and clean up
automatically.

```tsx
// New
function MyComponent() {
  useRegisterActions([
    { id: 'save', label: 'Save', keys: ['ctrl+s'], handler: save, scope: 'command' },
  ])
  return <Text>My Component</Text>
}
```

### `StatusBar` shortcuts prop to `HotkeyHintBar`

Old: `StatusBar` accepted a `shortcuts` prop to display key
hints.

```tsx
// Old
<StatusBar shortcuts={[
  { key: 'q', label: 'Quit' },
  { key: '/', label: 'Search' },
]} />
```

New: `HotkeyHintBar` reads registered actions from
`ScopedActionRegistryProvider` and displays them automatically.

```tsx
// New
<HotkeyHintBar scope="list" maxHints={6} />
```

Or pass a `registry` prop to `StatusBar` to use the new system:

```tsx
<StatusBar registry={myRegistry} />
```

---

## 5. Widget Migration

### Selection widgets

Replace raw `useInputInScope`-based selection with the new
purpose-built widgets:

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

### Text input widgets

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
// Number input
<NumberInput
  label="Count"
  defaultValue={5}
  min={1}
  max={100}
  onSubmit={(value) => handleCount(value)}
/>
```

```tsx
// Command input
<CommandInput
  mode="command"
  value={input}
  onChange={setInput}
  onSubmit={handleSubmit}
  placeholder="Type a command..."
/>
```

### Modal widgets

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

### Multi-step flows

| Old | New |
|-----|-----|
| Manual step state + navigation | `StepFlow` |

```tsx
// New: StepFlow
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

## 6. Async Sessions

### `useCommandSession` to `useAsyncSession` + `AsyncSessionRunner`

The old `useCommandSession` hook combined command input, process
running, and output display into a single API. The new
`useAsyncSession` hook separates concerns:

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

`AsyncSessionRunner` is the underlying class that manages process
lifecycle. Use it directly when you need fine-grained control:

```tsx
const runner = new AsyncSessionRunner({ runner: processRunner })
runner.start('npm test', undefined, lifecycle)
runner.sendInput('y')
runner.cancel()
runner.cleanup()
```

---

## 7. New APIs

### `useShellSuspension`

Temporarily disables shell-level hotkeys (like Ctrl+C detection)
while a widget is active. Used internally by `ChoicePrompt`,
`TextInput`, `NumberInput`, `ListSelect`, `OptionGrid`, `RadioList`,
and `ModalDialog`.

```tsx
const { suspend, restore } = useShellSuspension()
useEffect(() => {
  suspend()
  return () => restore()
}, [suspend, restore])
```

### `CollisionDetector` (`detectCollisions`)

Detects conflicting hotkey registrations across actions. Returns
an array of `CollisionWarning` objects with severity `'error'`
(same scope, same key) or `'warning'` (custom scope overlap).

```tsx
import { detectCollisions } from '@maivandrahmani/englishos-tui-framework'

const warnings = detectCollisions(registeredActions)
warnings.forEach((w) => console.warn(w.message))
```

### `EventTracer`

Captures keyboard event dispatch traces for debugging. Records
each event, the handler chain evaluated, and which scope consumed
it (if any).

```tsx
const tracer = new EventTracer(200)
tracer.enable()
// ... later ...
const trace = tracer.getTrace()
tracer.disable()
tracer.clear()
```

### `KeyboardDebugInspector`

A React component that displays live keyboard dispatch state.
Shows the active scope stack, focus path, and recent event trace.

```tsx
<KeyboardDebugInspector
  tracer={myTracer}
  getActiveScopeStack={getScopeStack}
  getActiveFocusPath={getFocusPath}
/>
```

---

## Quick Reference

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
