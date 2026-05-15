import { useEffect, useRef } from 'react'
import type { Key } from 'ink'
import { InputConsumptionResult, type FocusScope, type NormalizedKeyEvent } from '../types.js'
import { normalizeKey } from './KeyEventNormalizer.js'
import {
  useKeyboardScope,
  type RegisterHandlerOptions,
  type ScopedInputEvent,
  type InputHandler,
} from './KeyboardScopeProvider.js'

export type LegacyInputHandler = (
  input: string,
  key: Key,
) => void | boolean

export type ScopedInputHandler = (event: ScopedInputEvent) => void | boolean

export interface UseInputInScopeOptions extends RegisterHandlerOptions {
  deps?: unknown[]
  enabled?: boolean
}

export type KeyHandler = (event: NormalizedKeyEvent) => InputConsumptionResult | boolean | void

export interface KeyBindingOptions extends UseInputInScopeOptions {
  modifiers?: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
  }
}

function normalizeOptions(
  optionsOrDeps: UseInputInScopeOptions | unknown[] = {},
): UseInputInScopeOptions {
  if (Array.isArray(optionsOrDeps)) {
    return { deps: optionsOrDeps }
  }
  return optionsOrDeps
}

function useInputRegistration(
  scope: FocusScope,
  handler: InputHandler,
  optionsOrDeps: UseInputInScopeOptions | unknown[],
) {
  const { registerHandler } = useKeyboardScope()
  const options = normalizeOptions(optionsOrDeps)
  const deps = options.deps ?? []
  const enabled = options.enabled ?? true

  useEffect(() => {
    if (!enabled) return
    const unregister = registerHandler(scope, handler, {
      priority: options.priority,
    })
    return unregister
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, registerHandler, enabled, options.priority, ...deps])
}

export function useInputInScope(
  handler: LegacyInputHandler,
  scope: FocusScope,
  deps: unknown[],
): void
export function useInputInScope(
  handler: LegacyInputHandler,
  scope: FocusScope,
  options?: UseInputInScopeOptions,
): void
export function useInputInScope(
  handler: LegacyInputHandler,
  scope: FocusScope,
  optionsOrDeps: UseInputInScopeOptions | unknown[] = {},
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useInputRegistration(
    scope,
    (event) => handlerRef.current(event.input, event.key),
    optionsOrDeps,
  )
}

export function useScopedInputInScope(
  handler: ScopedInputHandler,
  scope: FocusScope,
  deps: unknown[],
): void
export function useScopedInputInScope(
  handler: ScopedInputHandler,
  scope: FocusScope,
  options?: UseInputInScopeOptions,
): void
export function useScopedInputInScope(
  handler: ScopedInputHandler,
  scope: FocusScope,
  optionsOrDeps: UseInputInScopeOptions | unknown[] = {},
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useInputRegistration(
    scope,
    (event) => handlerRef.current(event),
    optionsOrDeps,
  )
}

export function useKeyHandler(
  handler: KeyHandler,
  scope: FocusScope,
  options?: UseInputInScopeOptions,
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useInputRegistration(
    scope,
    (event) => {
      const normalized = normalizeKey(event.input, event.key)
      const result = handlerRef.current(normalized)
      if (
        result === true ||
        result === InputConsumptionResult.Consumed ||
        result === InputConsumptionResult.ConsumedAndTrapped
      ) {
        return true
      }
    },
    options ?? {},
  )
}

export function useKeyBinding(
  key: string,
  handler: () => void,
  scope: FocusScope,
  options?: KeyBindingOptions,
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useInputRegistration(
    scope,
    (event) => {
      const normalized = normalizeKey(event.input, event.key)

      if (normalized.key !== key) return

      const mods = options?.modifiers
      if (mods) {
        if (mods.ctrl !== undefined && normalized.ctrl !== mods.ctrl) return
        if (mods.alt !== undefined && normalized.alt !== mods.alt) return
        if (mods.shift !== undefined && normalized.shift !== mods.shift) return
        if (mods.meta !== undefined && normalized.meta !== mods.meta) return
      } else if (normalized.ctrl || normalized.alt || normalized.meta) {
        return
      }

      handlerRef.current()
      return true
    },
    options ?? {},
  )
}
