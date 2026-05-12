import { useEffect, useId, useCallback } from 'react'
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

let counter = 0

export function useFocusable(
  options: UseFocusableOptions = {},
): UseFocusableResult {
  const internalId = useId()
  const id = options.id ?? `f-${internalId}-${++counter}`
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
