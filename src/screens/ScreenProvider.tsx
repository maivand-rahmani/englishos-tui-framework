import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { ScreenDefinition } from './screen.js'
import type { ScreenRegistry } from './registry.js'

export interface ScreenContextValue {
  currentScreenId: string
  navigate: (id: string, params?: Record<string, unknown>) => void
  screenParams: Record<string, unknown>
  registry: ScreenRegistry
  currentScreen: ScreenDefinition
}

export interface ScreenProviderProps {
  registry: ScreenRegistry
  defaultScreen: string
  children: ReactNode
}

const ScreenContext = createContext<ScreenContextValue | null>(null)

export function ScreenProvider({
  registry,
  defaultScreen,
  children,
}: ScreenProviderProps) {
  const [currentScreenId, setCurrentScreenId] = useState(defaultScreen)
  const [screenParams, setScreenParams] = useState<Record<string, unknown>>({})

  const navigate = useCallback(
    (id: string, params?: Record<string, unknown>) => {
      registry.get(id)
      setCurrentScreenId(id)
      setScreenParams(params ?? {})
    },
    [registry],
  )

  const currentScreen = registry.get(currentScreenId)

  return (
    <ScreenContext.Provider
      value={{
        currentScreenId,
        navigate,
        screenParams,
        registry,
        currentScreen,
      }}
    >
      {children}
    </ScreenContext.Provider>
  )
}

export function useScreen(): ScreenContextValue {
  const ctx = useContext(ScreenContext)
  if (!ctx) {
    throw new Error(
      'useScreen() must be used within a <ScreenProvider>. ' +
        'Wrap your application in <ScreenProvider> at the root level.',
    )
  }
  return ctx
}

export function ScreenRenderer() {
  const { currentScreen, screenParams } = useScreen()
  return (
    <>
      {currentScreen.component({
        params: screenParams,
        modalProps: {},
      })}
    </>
  )
}
