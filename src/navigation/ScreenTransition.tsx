import { useRef, useEffect, useState, type ReactNode } from 'react'
import { Text } from 'ink'
import { useNavigation } from './NavigationProvider.js'

export type TransitionType = 'none' | 'fade' | 'slide'

export interface ScreenTransitionProps {
  children: ReactNode
  type?: TransitionType
  duration?: number
}

export function ScreenTransition({
  children,
  type = 'none',
  duration = 0,
}: ScreenTransitionProps) {
  const { currentScreenId } = useNavigation()
  const [transitioning, setTransitioning] = useState(false)
  const prevIdRef = useRef(currentScreenId)

  useEffect(() => {
    if (prevIdRef.current !== currentScreenId) {
      prevIdRef.current = currentScreenId
      if (type !== 'none' && duration > 0) {
        setTransitioning(true)
        const timer = setTimeout(() => setTransitioning(false), duration)
        return () => clearTimeout(timer)
      }
    }
  }, [currentScreenId, type, duration])

  if (transitioning && type !== 'none') {
    return <Text dimColor />
  }

  return <>{children}</>
}
