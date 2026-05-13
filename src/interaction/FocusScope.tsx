import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import type { FocusScope as FocusScopeType } from '../types.js'
import { useScopedInputInScope } from './useInputInScope.js'
import { useKeyboardScope } from './KeyboardScopeProvider.js'

export interface FocusScopeContextValue {
  focusedId: string | null
  register: (id: string) => () => void
  focus: (id: string) => void
  focused: boolean
  isFirst: (id: string) => boolean
  isLast: (id: string) => boolean
}

const FocusScopeContext = createContext<FocusScopeContextValue | null>(null)

export interface FocusScopeProps {
  scope: FocusScopeType
  children: ReactNode
  autoFocus?: boolean
  onActivate?: (id: string) => void
}

export function FocusScope({
  scope,
  children,
  autoFocus = false,
  onActivate,
}: FocusScopeProps) {
  const { isScopeActive } = useKeyboardScope()
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [items, setItems] = useState<string[]>([])
  const onActivateRef = useRef(onActivate)
  onActivateRef.current = onActivate
  const focusedIdRef = useRef(focusedId)
  focusedIdRef.current = focusedId

  const register = useCallback(
    (id: string) => {
      setItems((prev) => {
        if (prev.includes(id)) return prev
        return [...prev, id]
      })
      return () => {
        setItems((prev) => prev.filter((candidate) => candidate !== id))
        setFocusedId((prev) => (prev === id ? null : prev))
      }
    },
    [],
  )

  const focus = useCallback((id: string) => {
    setFocusedId(id)
  }, [])

  const focusNext = useCallback(() => {
    setFocusedId((prev) => {
      if (items.length === 0) return prev
      if (prev === null) return items[0]
      const idx = items.indexOf(prev)
      if (idx === -1) return items[0]
      return items[(idx + 1) % items.length]
    })
  }, [items])

  const focusPrev = useCallback(() => {
    setFocusedId((prev) => {
      if (items.length === 0) return prev
      if (prev === null) return items[items.length - 1]
      const idx = items.indexOf(prev)
      if (idx === -1) return items[0]
      return items[(idx - 1 + items.length) % items.length]
    })
  }, [items])

  const isFirst = useCallback(
    (id: string) => {
      return items.length > 0 && items[0] === id
    },
    [items],
  )

  const isLast = useCallback(
    (id: string) => {
      return items.length > 0 && items[items.length - 1] === id
    },
    [items],
  )

  useEffect(() => {
    if (autoFocus && focusedId === null && items.length > 0) {
      setFocusedId(items[0])
    }
  }, [autoFocus, focusedId, items])

  useScopedInputInScope(
    (event) => {
      const { key } = event
      if (key.upArrow) {
        focusPrev()
        event.stopPropagation()
        return true
      } else if (key.downArrow) {
        focusNext()
        event.stopPropagation()
        return true
      } else if (
        key.return &&
        onActivateRef.current
      ) {
        const targetId = focusedIdRef.current ?? items[0]
        if (!targetId) return
        onActivateRef.current(targetId)
        event.stopPropagation()
        return true
      }
    },
    scope,
    [focusNext, focusPrev],
  )

  const value: FocusScopeContextValue = {
    focusedId,
    register,
    focus,
    focused: isScopeActive(scope),
    isFirst,
    isLast,
  }

  return (
    <FocusScopeContext.Provider value={value}>
      {children}
    </FocusScopeContext.Provider>
  )
}

export function useFocusScope(): FocusScopeContextValue {
  const ctx = useContext(FocusScopeContext)
  if (!ctx) {
    throw new Error(
      'useFocusScope() must be used within a <FocusScope> component',
    )
  }
  return ctx
}
