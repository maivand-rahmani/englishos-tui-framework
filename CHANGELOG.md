# englishos-tui-framework

## 0.4.1

### Fix infinite render loop in useRegisterActions
- **Fixed** `useRegisterActions` infinite render loop with inline action arrays. Empty dep array breaks the `register → bump → re-render → new inline array → re-register → loop` cycle.
- Action definitions that change should re-mount via `key` prop.

### Fix keyboard dispatch scoping — auto-push/pop scopes on handler registration
- **Fixed** widgets (ChoicePrompt, ListSelect, OptionGrid, RadioList, NumberInput) not receiving keyboard input. Widgets register handlers for `'list'`/`'textinput'` scopes but these scopes were never pushed onto the scope stack, so the dispatch loop never checked them.
- **Root cause**: `KeyboardScopeProvider` dispatch only iterates scopes in the stack (scopeEntries). `useInputRegistration` only called `registerHandler()` but never `pushScope()`. With shell suspension (`suspendShell()`) silencing `'navigation'`, no handlers fired.
- **Fix**: `useInputRegistration` now calls `pushScope(scope)` on mount and `popScope(scope)` on cleanup. `KeyboardScopeProvider` pushScope/popScope now use reference counting (`scopeCountRef`) so nested components registering for the same scope don't collide — popScope only removes from the stack when the count reaches zero.
- All 593 tests pass.

## 0.4.0

### Major framework refactor — input architecture, action system, widget primitives, diagnostics

- **Input Architecture**: Normalized key event model (`NormalizedKeyEvent`, `InputConsumptionResult`). Refactored `KeyboardScopeProvider` with deepest-first scope dispatch, trap/bubble semantics, and shell suspension. Added `useKeyHandler` and `useKeyBinding` hooks alongside legacy APIs.

- **Focus Model**: Added hierarchical `FocusTreeProvider` with `useFocusZone` (containers), `useFocusGroup` (list navigation), and `useFocusableV2` (leaf items). `RegionProvider` preserved as compatibility shell over the new focus model.

- **Action System**: Extended `ActionRegistry` with scope/category/visibility/enabled metadata. Added `ScopedActionRegistryProvider` with `useRegisterActions`, `useActiveActions`, and `useScopedActionRegistry` hooks. `KeyboardRegistry` bridged via `keyboardRegistryToActions()`.

- **Shell Integration**: Added `useShellSuspension()` hook for component-level hotkey gating. Added `HotkeyHintBar` for auto-generated footer hints from registered actions. `StatusBar` extended with optional registry integration.

- **Widget Primitives (10 new)**:
  - `ChoicePrompt` — letter-key shortcuts (`a/b/c/d`) + arrow navigation, auto shell suspension
  - `ListSelect` — vertical selectable list with wrapping focus
  - `OptionGrid` — horizontal grid selector with 4-way arrow navigation
  - `RadioList` — radio-button-style selector
  - `TextInput` — controlled/uncontrolled text entry with validation
  - `NumberInput` — digit buffer with arrow increment, min/max clamping
  - `CommandInput` — mode-aware command-line input
  - `ModalDialog` — focus-trapped modal overlay
  - `ConfirmCancel` — declarative confirm/cancel dialog
  - `StepFlow` — multi-step wizard with shared state and lifecycle

- **Async Sessions**: Added `AsyncSessionRunner` class with 6-state lifecycle (idle/starting/running/waiting/error/complete) and bounded ring-buffer output. Added `useAsyncSession` hook with auto-cleanup on unmount.

- **Diagnostics**: Added `CollisionDetector` for hotkey conflict detection, `EventTracer` for keyboard event tracing, and `KeyboardDebugInspector` live debug overlay.

- **Migration**: Comprehensive `MIGRATION-v2.md` guide covering old→new API mapping for input hooks, focus model, action registry, widgets, and sessions. Example practice-style flow demonstrating StepFlow + ChoicePrompt + TextInput + NumberInput.

- **Testing**: 593 tests across 53 files. Tests cover hotkey precedence, nested scopes, modal trapping, text input ownership, choice selection, step flow transitions, and async session lifecycle.

## 0.1.2

### Patch Changes

- [#10](https://github.com/maivand-rahmani/englishos-tui-framework/pull/10) [`f5e7693`](https://github.com/maivand-rahmani/englishos-tui-framework/commit/f5e769366d8209438d8eb67c3fcc8f604af27087) Thanks [@maivand-rahmani](https://github.com/maivand-rahmani)! - Publish the framework under the maintainer-owned npm user scope to unblock first-time public release publishing from CI.

## 0.1.1

### Patch Changes

- [#8](https://github.com/maivand-rahmani/englishos-tui-framework/pull/8) [`3575cc5`](https://github.com/maivand-rahmani/englishos-tui-framework/commit/3575cc5199f68b43aec6c87b4ae57006ce30e406) Thanks [@maivand-rahmani](https://github.com/maivand-rahmani)! - Switch release publishing from beta-tag-only flow to stable latest releases by default, while preserving optional beta publish support.

## 0.1.0

### Minor Changes

- [`d7bf612`](https://github.com/maivand-rahmani/englishos-tui-framework/commit/d7bf6129bef09ddb7dd46a34e45d8c1d813ef6a8) Thanks [@maivand-rahmani](https://github.com/maivand-rahmani)! - Introduce framework hardening for public beta release:

  - add `FrameworkProvider` as canonical provider composition entrypoint
  - add scoped input arbitration with event consumption support
  - make modal props flow available to rendered modal screens
  - move unstable exports under `experimental` namespace
  - prepare dual ESM/CJS packaging metadata for npm publish
