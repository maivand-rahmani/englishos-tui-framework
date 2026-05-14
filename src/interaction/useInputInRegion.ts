import { useRef } from 'react'
import type { Key } from 'ink'
import type { FocusScope as FocusScopeType } from '../types.js'
import {
  useInputInScope,
  useScopedInputInScope,
  type UseInputInScopeOptions,
} from './useInputInScope.js'
import { useRegionContext } from './RegionProvider.js'

export type LegacyInputHandler = (input: string, key: Key) => void | boolean
export type ScopedInputHandler = (event: {
  input: string
  key: Key
  scope: FocusScopeType
  stopPropagation: () => void
  isPropagationStopped: boolean
}) => void | boolean

function normalizeOptions(
  optionsOrDeps: UseInputInScopeOptions | unknown[] = {},
): UseInputInScopeOptions {
  if (Array.isArray(optionsOrDeps)) {
    return { deps: optionsOrDeps }
  }
  return optionsOrDeps
}

export function useInputInRegion(
  handler: LegacyInputHandler,
  scope: FocusScopeType,
  regionId: string,
  deps: unknown[],
): void
export function useInputInRegion(
  handler: LegacyInputHandler,
  scope: FocusScopeType,
  regionId: string,
  options?: UseInputInScopeOptions,
): void
export function useInputInRegion(
  handler: LegacyInputHandler,
  scope: FocusScopeType,
  regionId: string,
  optionsOrDeps: UseInputInScopeOptions | unknown[] = {},
) {
  const { isRegionActive } = useRegionContext()
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const regionIdRef = useRef(regionId)
  regionIdRef.current = regionId
  const regionGateRef = useRef(isRegionActive)
  regionGateRef.current = isRegionActive
  const opts = normalizeOptions(optionsOrDeps)

  useInputInScope(
    (input: string, key: Key) => {
      if (!regionGateRef.current(regionIdRef.current)) return
      return handlerRef.current(input, key)
    },
    scope,
    opts,
  )
}

export function useScopedInputInRegion(
  handler: ScopedInputHandler,
  scope: FocusScopeType,
  regionId: string,
  deps: unknown[],
): void
export function useScopedInputInRegion(
  handler: ScopedInputHandler,
  scope: FocusScopeType,
  regionId: string,
  options?: UseInputInScopeOptions,
): void
export function useScopedInputInRegion(
  handler: ScopedInputHandler,
  scope: FocusScopeType,
  regionId: string,
  optionsOrDeps: UseInputInScopeOptions | unknown[] = {},
) {
  const { isRegionActive } = useRegionContext()
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const regionIdRef = useRef(regionId)
  regionIdRef.current = regionId
  const regionGateRef = useRef(isRegionActive)
  regionGateRef.current = isRegionActive
  const opts = normalizeOptions(optionsOrDeps)

  useScopedInputInScope(
    (event) => {
      if (!regionGateRef.current(regionIdRef.current)) return
      return handlerRef.current(event)
    },
    scope,
    opts,
  )
}
