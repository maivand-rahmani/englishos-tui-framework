import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import { useScopedInputInScope } from './useInputInScope.js'

export interface RegionDefinition {
  id: string
}

export interface RegionFocusContextValue {
  activeRegionId: string | null
  regionIds: string[]
  registerRegion: (id: string) => () => void
  setActiveRegion: (id: string) => void
  cycleToNextRegion: () => void
  cycleToPrevRegion: () => void
  isRegionActive: (id: string) => boolean
}

export interface RegionProviderProps {
  children: ReactNode
  defaultRegion?: string
}

const RegionFocusContext = createContext<RegionFocusContextValue | null>(null)

export function useRegionContext(): RegionFocusContextValue {
  const ctx = useContext(RegionFocusContext)
  if (!ctx) {
    throw new Error(
      'useRegionContext() must be used within a <RegionProvider>. ' +
        'Wrap your application in <RegionProvider> at the appropriate level.',
    )
  }
  return ctx
}

export interface UseFocusableRegionResult {
  isActive: boolean
  activate: () => void
}

/**
 * Register a component as a focusable region.
 *
 * Call this at the top of any component that represents an interactive region
 * (e.g. sidebar, content, footer). When the region is active it receives
 * keyboard events; when inactive its handlers are suppressed.
 *
 * If no `<RegionProvider>` is present in the tree, the region behaves as
 * always-active (backward compatible passthrough).
 *
 * @param id - Unique identifier for this region (e.g. 'sidebar', 'content').
 */
export function useFocusableRegion(
  id: string,
): UseFocusableRegionResult {
  const ctx = useContext(RegionFocusContext)

  useEffect(() => {
    if (ctx == null) return
    return ctx.registerRegion(id)
  }, [id, ctx])

  const activate = useCallback(() => {
    ctx?.setActiveRegion(id)
  }, [id, ctx])

  return {
    isActive: ctx?.isRegionActive(id) ?? true,
    activate,
  }
}

/**
 * Provider that manages interactive focus regions.
 *
 * Place inside a `<KeyboardScopeProvider>` (it uses `useScopedInputInScope`
 * to intercept Tab/Shift+Tab for region cycling).
 */
export function RegionProvider({
  children,
  defaultRegion = 'content',
}: RegionProviderProps) {
  const [regionSet, setRegionSet] = useState<Set<string>>(new Set())
  const [activeRegionId, setActiveRegionId] = useState<string | null>(
    defaultRegion,
  )

  const regionSetRef = useRef<Set<string>>(regionSet)
  regionSetRef.current = regionSet
  const activeRegionIdRef = useRef<string | null>(activeRegionId)
  activeRegionIdRef.current = activeRegionId

  const registerRegion = useCallback((id: string) => {
    setRegionSet((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setActiveRegionId((prev) => {
      if (prev === null && id === defaultRegion) {
        return id
      }
      if (prev === null) {
        return id
      }
      return prev
    })
    return () => {
      setRegionSet((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setActiveRegionId((prev) => (prev === id ? null : prev))
    }
  }, [defaultRegion])

  const setActiveRegion = useCallback((id: string) => {
    setActiveRegionId(id)
  }, [])

  const isRegionActive = useCallback(
    (id: string) => activeRegionIdRef.current === id,
    [],
  )

  const cycleToNextRegion = useCallback(() => {
    const ids = Array.from(regionSetRef.current)
    if (ids.length === 0) return
    const current = activeRegionIdRef.current
    if (current === null || !ids.includes(current)) {
      setActiveRegionId(ids[0])
      return
    }
    const currentIdx = ids.indexOf(current)
    const nextIdx = (currentIdx + 1) % ids.length
    setActiveRegionId(ids[nextIdx])
  }, [])

  const cycleToPrevRegion = useCallback(() => {
    const ids = Array.from(regionSetRef.current)
    if (ids.length === 0) return
    const current = activeRegionIdRef.current
    if (current === null || !ids.includes(current)) {
      setActiveRegionId(ids[ids.length - 1])
      return
    }
    const currentIdx = ids.indexOf(current)
    const prevIdx = (currentIdx - 1 + ids.length) % ids.length
    setActiveRegionId(ids[prevIdx])
  }, [])

  useScopedInputInScope(
    (event) => {
      if (regionSetRef.current.size < 2) return

      if (event.key.tab) {
        event.key.shift ? cycleToPrevRegion() : cycleToNextRegion()
        event.stopPropagation()
        return true
      }
    },
    'navigation',
    { priority: 100 },
  )

  const value: RegionFocusContextValue = {
    activeRegionId,
    regionIds: Array.from(regionSet),
    registerRegion,
    setActiveRegion: setActiveRegion,
    cycleToNextRegion,
    cycleToPrevRegion,
    isRegionActive,
  }

  return (
    <RegionFocusContext.Provider value={value}>
      {children}
    </RegionFocusContext.Provider>
  )
}

export { RegionFocusContext }
