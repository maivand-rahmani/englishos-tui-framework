import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { useInput } from 'ink'
import type { FocusScope } from '../types.js'

type InputHandler = (input: string, key: Record<string, boolean>) => void

export interface KeyboardScopeContextValue {
  activeScope: FocusScope
  activateScope: (scope: FocusScope) => void
  registerHandler: (scope: FocusScope, handler: InputHandler) => () => void
}

const KeyboardScopeContext =
  createContext<KeyboardScopeContextValue | null>(null)

export interface KeyboardScopeProviderProps {
  children: ReactNode
  defaultScope?: FocusScope
}

export function KeyboardScopeProvider({
  children,
  defaultScope = 'navigation',
}: KeyboardScopeProviderProps) {
  const [activeScope, setActiveScope] = useState<FocusScope>(defaultScope)
  const handlersRef =
    useRef<Map<FocusScope, Set<InputHandler>>>(new Map())

  useInput((input, key) => {
    const handlers = handlersRef.current.get(activeScope)
    if (handlers) {
      for (const handler of handlers) {
        handler(input, key)
      }
    }
  })

  const registerHandler = useCallback(
    (scope: FocusScope, handler: InputHandler) => {
      if (!handlersRef.current.has(scope)) {
        handlersRef.current.set(scope, new Set())
      }
      handlersRef.current.get(scope)!.add(handler)
      return () => {
        handlersRef.current.get(scope)?.delete(handler)
      }
    },
    [],
  )

  const activateScope = useCallback((scope: FocusScope) => {
    setActiveScope(scope)
  }, [])

  return (
    <KeyboardScopeContext.Provider
      value={{ activeScope, activateScope, registerHandler }}
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
