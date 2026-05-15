import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useId,
  type ReactNode,
} from 'react'
import type { FocusScope } from '../types.js'
import { InputConsumptionResult } from '../types.js'
import { useKeyboardScope } from './KeyboardScopeProvider.js'
import { useKeyHandler } from './useInputInScope.js'

// ── Zone Context ──

export interface FocusZoneContextValue {
  zoneId: string
  activeGroupId: string | null
  setActiveGroup: (id: string) => void
  /** Register or update the focused item for a group within this zone. */
  updateGroupFocused: (groupId: string, focusableId: string | null) => void
  /** Helper to get the deepest active focusable ID within this zone. */
  getDeepestActiveFocusable: () => string | null
}

export const FocusZoneContext = createContext<FocusZoneContextValue | null>(null)

// ── Group Context ──

export interface FocusGroupContextValue {
  groupId: string
  focusedId: string | null
  register: (id: string) => () => void
  focus: (id: string) => void
  isActive: boolean
  isFirst: (id: string) => boolean
  isLast: (id: string) => boolean
}

const FocusGroupContext = createContext<FocusGroupContextValue | null>(null)

// ── useFocusZone ──

export interface UseFocusZoneOptions {
  autoFocus?: boolean
  scope?: FocusScope
}

export interface UseFocusZoneResult {
  zoneId: string
  isActive: boolean
  activate: () => void
  /** Wrapper component that provides FocusZoneContext to children. */
  ZoneProvider: (props: { children: ReactNode }) => ReactNode
}

/**
 * Declare a zone (shell container, region, modal overlay).
 * Zones nest naturally through React tree position.
 */
export function useFocusZone(
  id: string,
  options: UseFocusZoneOptions = {},
): UseFocusZoneResult {
  const scope = (options.scope ?? id) as FocusScope
  const { isScopeActive, pushScope } = useKeyboardScope()
  const autoFocus = options.autoFocus ?? false

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const groupFocusedRef = useRef<Map<string, string | null>>(new Map())

  const setActiveGroup = useCallback((gid: string) => {
    setActiveGroupId(gid)
  }, [])

  const updateGroupFocused = useCallback(
    (groupId: string, focusableId: string | null) => {
      groupFocusedRef.current.set(groupId, focusableId)
    },
    [],
  )

  const getDeepestActiveFocusable = useCallback((): string | null => {
    if (!activeGroupId) return null
    return groupFocusedRef.current.get(activeGroupId) ?? null
  }, [activeGroupId])

  const activate = useCallback(() => {
    pushScope(scope)
  }, [scope, pushScope])

  const isActive = isScopeActive(scope)

  const ctxValueRef = useRef<FocusZoneContextValue>({
    zoneId: id,
    activeGroupId,
    setActiveGroup,
    updateGroupFocused,
    getDeepestActiveFocusable,
  })
  ctxValueRef.current = {
    zoneId: id,
    activeGroupId,
    setActiveGroup,
    updateGroupFocused,
    getDeepestActiveFocusable,
  }

  const autoFocusRef = useRef(autoFocus)
  autoFocusRef.current = autoFocus

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ZoneProvider = useCallback(
    function ZoneProviderWrapper({ children }: { children: ReactNode }) {
      useEffect(() => {
        if (autoFocusRef.current) {
          pushScope(scope)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      return (
        <FocusZoneContext.Provider value={ctxValueRef.current}>
          {children}
        </FocusZoneContext.Provider>
      )
    },
    [scope, pushScope],
  )

  return { zoneId: id, isActive, activate, ZoneProvider }
}

// ── useFocusGroup ──

export interface UseFocusGroupOptions {
  autoFocus?: boolean
  scope?: FocusScope
}

export interface UseFocusGroupResult {
  groupId: string
  isActive: boolean
  focusedId: string | null
  focusNext: () => void
  focusPrev: () => void
  activate: () => void
  /** Wrapper component that provides FocusGroupContext to children. */
  GroupProvider: (props: { children: ReactNode }) => ReactNode
}

/**
 * Declare a focus group (list of items, tab strip, choice options).
 * Groups exist within zones and manage roving focus among their items.
 */
export function useFocusGroup(
  id: string,
  options: UseFocusGroupOptions = {},
): UseFocusGroupResult {
  const scope = (options.scope ?? id) as FocusScope
  const { pushScope, isScopeActive: keyboardIsScopeActive } = useKeyboardScope()
  const autoFocus = options.autoFocus ?? false

  const zoneCtx = useContext(FocusZoneContext)

  const [focusedId, setFocusedId] = useState<string | null>(null)
  const itemsRef = useRef<string[]>([])
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!zoneCtx) return
    zoneCtx.setActiveGroup(id)
  }, [id, zoneCtx])

  useEffect(() => {
    if (!zoneCtx) return
    zoneCtx.updateGroupFocused(id, focusedId)
  }, [id, focusedId, zoneCtx])

  const isActive =
    keyboardIsScopeActive(scope) &&
    (zoneCtx ? zoneCtx.activeGroupId === id : true)

  const register = useCallback((itemId: string) => {
    if (!itemsRef.current.includes(itemId)) {
      itemsRef.current = [...itemsRef.current, itemId]
      forceUpdate((n) => n + 1)
    }
    return () => {
      itemsRef.current = itemsRef.current.filter((c) => c !== itemId)
      setFocusedId((prev) => (prev === itemId ? null : prev))
      forceUpdate((n) => n + 1)
    }
  }, [])

  const focus = useCallback((itemId: string) => {
    setFocusedId(itemId)
  }, [])

  const focusNext = useCallback(() => {
    setFocusedId((prev) => {
      const items = itemsRef.current
      if (items.length === 0) return prev
      if (prev === null) return items[0]
      const idx = items.indexOf(prev)
      if (idx === -1) return items[0]
      return items[(idx + 1) % items.length]
    })
  }, [])

  const focusPrev = useCallback(() => {
    setFocusedId((prev) => {
      const items = itemsRef.current
      if (items.length === 0) return prev
      if (prev === null) return items[items.length - 1]
      const idx = items.indexOf(prev)
      if (idx === -1) return items[0]
      return items[(idx - 1 + items.length) % items.length]
    })
  }, [])

  const isFirst = useCallback(
    (itemId: string) => {
      const items = itemsRef.current
      return items.length > 0 && items[0] === itemId
    },
    [],
  )

  const isLast = useCallback(
    (itemId: string) => {
      const items = itemsRef.current
      return items.length > 0 && items[items.length - 1] === itemId
    },
    [],
  )

  const activate = useCallback(() => {
    pushScope(scope)
    if (zoneCtx) {
      zoneCtx.setActiveGroup(id)
    }
  }, [scope, id, pushScope, zoneCtx])

  useEffect(() => {
    if (autoFocus) {
      pushScope(scope)
      if (zoneCtx) {
        zoneCtx.setActiveGroup(id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useKeyHandler(
    (event) => {
      if (!keyboardIsScopeActive(scope)) return InputConsumptionResult.NotConsumed
      if (event.up) {
        focusPrev()
        return InputConsumptionResult.Consumed
      }
      if (event.down) {
        focusNext()
        return InputConsumptionResult.Consumed
      }
      return InputConsumptionResult.NotConsumed
    },
    scope,
    { deps: [focusNext, focusPrev, keyboardIsScopeActive, scope] },
  )

  const ctxValueRef = useRef<FocusGroupContextValue>({
    groupId: id,
    focusedId,
    register,
    focus,
    isActive,
    isFirst,
    isLast,
  })
  ctxValueRef.current = {
    groupId: id,
    focusedId,
    register,
    focus,
    isActive,
    isFirst,
    isLast,
  }

  const autoFocusRef = useRef(autoFocus)
  autoFocusRef.current = autoFocus

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const GroupProvider = useCallback(
    function GroupProviderWrapper({ children }: { children: ReactNode }) {
      return (
        <FocusGroupContext.Provider value={ctxValueRef.current}>
          {children}
        </FocusGroupContext.Provider>
      )
    },
    [id],
  )

  return {
    groupId: id,
    isActive,
    focusedId,
    focusNext,
    focusPrev,
    activate,
    GroupProvider,
  }
}

// ── useFocusable (v2) ──

export interface UseFocusableV2Options {
  id?: string
}

export interface UseFocusableV2Result {
  focused: boolean
  onActivate: () => void
  isFirst: boolean
  isLast: boolean
  id: string
}

/**
 * Declare a focusable leaf item within a group.
 * Replaces the old useFocusable but with explicit group registration.
 */
export function useFocusableV2(
  options: UseFocusableV2Options = {},
): UseFocusableV2Result {
  const internalId = useId()
  const stableIdRef = useRef(options.id ?? `fv2-${internalId}`)
  const id = stableIdRef.current

  const groupCtx = useContext(FocusGroupContext)

  if (!groupCtx) {
    return {
      focused: false,
      onActivate: () => {},
      isFirst: false,
      isLast: false,
      id,
    }
  }

  const { register, focus, focusedId, isFirst, isLast } = groupCtx

  useEffect(() => {
    return register(id)
  }, [id, register])

  const onActivate = useCallback(() => {
    focus(id)
  }, [id, focus])

  const focused = focusedId === id

  return {
    focused,
    onActivate,
    isFirst: isFirst(id),
    isLast: isLast(id),
    id,
  }
}

// ── FocusTreeProvider ──

export interface FocusTreeProviderProps {
  children: ReactNode
  defaultScope?: FocusScope
}

/**
 * Root focus tree provider. Wraps children in a default zone context.
 * Use as a top-level wrapper when multiple zones coexist on screen.
 */
export function FocusTreeProvider({
  children,
  defaultScope = 'navigation',
}: FocusTreeProviderProps) {
  const { ZoneProvider } = useFocusZone('__root', { scope: defaultScope })
  return <ZoneProvider>{children}</ZoneProvider>
}
