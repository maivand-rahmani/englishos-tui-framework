import { useEffect, useRef } from 'react'
import type { Key } from 'ink'
import type { FocusScope } from '../types.js'
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
