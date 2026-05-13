import { useEffect, useId, useCallback, useRef } from 'react'
import { useFocusScope } from './FocusScope.js'

export interface UseFocusableOptions {
  id?: string
}

export interface UseFocusableResult {
  focused: boolean
  onActivate: () => void
  isFirst: boolean
  isLast: boolean
}

export function useFocusable(
  options: UseFocusableOptions = {},
): UseFocusableResult {
  const internalId = useId()
  const stableIdRef = useRef(options.id ?? `f-${internalId}`)
  const id = stableIdRef.current
  const { register, focus, focusedId, isFirst, isLast } = useFocusScope()

  useEffect(() => {
    return register(id)
  }, [id, register])

  const onActivate = useCallback(() => {
    focus(id)
  }, [id, focus])

  return {
    focused: focusedId === id,
    onActivate,
    isFirst: isFirst(id),
    isLast: isLast(id),
  }
}
