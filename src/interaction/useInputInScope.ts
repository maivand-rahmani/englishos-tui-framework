import { useEffect } from 'react'
import type { FocusScope } from '../types.js'
import { useKeyboardScope } from './KeyboardScopeProvider.js'

type InputHandler = (input: string, key: Record<string, boolean>) => void

export function useInputInScope(
  handler: InputHandler,
  scope: FocusScope,
  deps: unknown[] = [],
) {
  const { registerHandler } = useKeyboardScope()

  useEffect(() => {
    const unregister = registerHandler(scope, handler)
    return unregister
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, registerHandler, ...deps])
}
