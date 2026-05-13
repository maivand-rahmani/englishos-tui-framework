import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { useInput, type Key } from 'ink'
import type { FocusScope } from '../types.js'
import { getScopePriority } from '../constants.js'

export interface ScopedInputEvent {
  input: string
  key: Key
  scope: FocusScope
  stopPropagation: () => void
  isPropagationStopped: boolean
}

export type InputHandler = (event: ScopedInputEvent) => void | boolean

interface RegisteredHandler {
  id: number
  priority: number
  handler: InputHandler
}

export interface RegisterHandlerOptions {
  priority?: number
}

export interface KeyboardScopeContextValue {
  activeScope: FocusScope
  activeScopes: FocusScope[]
  activateScope: (scope: FocusScope) => void
  pushScope: (scope: FocusScope) => void
  popScope: (scope?: FocusScope) => void
  isScopeActive: (scope: FocusScope) => boolean
  registerHandler: (
    scope: FocusScope,
    handler: InputHandler,
    options?: RegisterHandlerOptions,
  ) => () => void
}

const KeyboardScopeContext =
  createContext<KeyboardScopeContextValue | null>(null)

export interface KeyboardScopeProviderProps {
  children: ReactNode
  defaultScope?: FocusScope
}

function sortActiveScopes(scopes: FocusScope[]): FocusScope[] {
  return [...scopes].sort((left, right) => {
    const priorityDiff = getScopePriority(left) - getScopePriority(right)
    if (priorityDiff !== 0) return priorityDiff
    return left.localeCompare(right)
  })
}

export function KeyboardScopeProvider({
  children,
  defaultScope = 'navigation',
}: KeyboardScopeProviderProps) {
  const [activeScopes, setActiveScopes] = useState<FocusScope[]>([defaultScope])
  const handlersRef =
    useRef<Map<FocusScope, RegisteredHandler[]>>(new Map())
  const activeScopesRef = useRef<FocusScope[]>(activeScopes)
  activeScopesRef.current = activeScopes
  const registrationCounterRef = useRef(0)

  useInput((input, key) => {
    const scopes = sortActiveScopes(activeScopesRef.current)

    for (const scope of scopes) {
      const handlers = handlersRef.current.get(scope)
      if (!handlers || handlers.length === 0) continue

      const orderedHandlers = [...handlers].sort((left, right) => {
        const priorityDiff = right.priority - left.priority
        if (priorityDiff !== 0) return priorityDiff
        return left.id - right.id
      })

      for (const registered of orderedHandlers) {
        let stopped = false
        const event: ScopedInputEvent = {
          input,
          key,
          scope,
          stopPropagation: () => {
            stopped = true
          },
          get isPropagationStopped() {
            return stopped
          },
        }

        const consumed = registered.handler(event)
        if (consumed === true || stopped) {
          return
        }
      }
    }
  })

  const registerHandler = useCallback(
    (
      scope: FocusScope,
      handler: InputHandler,
      options: RegisterHandlerOptions = {},
    ) => {
      const handlers = handlersRef.current.get(scope) ?? []
      const id = registrationCounterRef.current++
      handlersRef.current.set(scope, [
        ...handlers,
        {
          id,
          handler,
          priority: options.priority ?? 0,
        },
      ])

      return () => {
        const currentHandlers = handlersRef.current.get(scope)
        if (!currentHandlers) return
        handlersRef.current.set(
          scope,
          currentHandlers.filter((candidate) => candidate.id !== id),
        )
      }
    },
    [],
  )

  const activateScope = useCallback((scope: FocusScope) => {
    setActiveScopes([scope])
  }, [])

  const pushScope = useCallback((scope: FocusScope) => {
    setActiveScopes((prev) => {
      if (prev.includes(scope)) return prev
      return [scope, ...prev]
    })
  }, [])

  const popScope = useCallback((scope?: FocusScope) => {
    setActiveScopes((prev) => {
      if (prev.length <= 1) return prev
      if (scope == null) return prev.slice(1)
      const next = prev.filter((candidate) => candidate !== scope)
      return next.length === 0 ? prev : next
    })
  }, [])

  const isScopeActive = useCallback(
    (scope: FocusScope) => activeScopesRef.current.includes(scope),
    [],
  )

  const activeScope = sortActiveScopes(activeScopes)[0] ?? defaultScope

  return (
    <KeyboardScopeContext.Provider
      value={{
        activeScope,
        activeScopes,
        activateScope,
        pushScope,
        popScope,
        isScopeActive,
        registerHandler,
      }}
    >
      {children}
    </KeyboardScopeContext.Provider>
  )
}

export function useKeyboardScope(): KeyboardScopeContextValue {
  const ctx = useContext(KeyboardScopeContext)
  if (!ctx) {
    throw new Error(
      'useKeyboardScope() must be used within a <KeyboardScopeProvider>',
    )
  }
  return ctx
}
