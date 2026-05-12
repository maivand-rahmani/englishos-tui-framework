import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { ScreenProvider, useScreen } from '../screens/ScreenProvider.js'
import type { ScreenDefinition } from '../screens/screen.js'
import type { ScreenRegistry } from '../screens/registry.js'

export interface NavigationEntry {
  screenId: string
  params: Record<string, unknown>
}

export interface ModalEntry {
  screenId: string
  props: Record<string, unknown>
}

export interface NavigationContextValue {
  currentScreenId: string
  currentScreen: ScreenDefinition
  params: Record<string, unknown>
  registry: ScreenRegistry
  push: (screenId: string, params?: Record<string, unknown>) => void
  pop: () => void
  popToRoot: () => void
  replace: (screenId: string, params?: Record<string, unknown>) => void
  canGoBack: boolean
  breadcrumbs: NavigationEntry[]
  pushModal: (screenId: string, props?: Record<string, unknown>) => void
  popModal: () => void
  modalStack: ModalEntry[]
  isModalOpen: boolean
  currentModal: ScreenDefinition | null
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export interface NavigationProviderProps {
  registry: ScreenRegistry
  defaultScreen: string
  children: ReactNode
}

function NavigationProviderInner({ children }: { children: ReactNode }) {
  const { currentScreenId, navigate, screenParams, registry, currentScreen } =
    useScreen()

  const [history, setHistory] = useState<NavigationEntry[]>([])
  const [modalStack, setModalStack] = useState<ModalEntry[]>([])

  const historyRef = useRef(history)
  historyRef.current = history

  const push = useCallback(
    (screenId: string, params?: Record<string, unknown>) => {
      setHistory((prev) => [
        ...prev,
        { screenId: currentScreenId, params: screenParams },
      ])
      navigate(screenId, params)
    },
    [currentScreenId, navigate, screenParams],
  )

  const pop = useCallback(() => {
    const h = historyRef.current
    if (h.length === 0) return
    const entry = h[h.length - 1]
    setHistory(h.slice(0, -1))
    navigate(entry.screenId, entry.params)
  }, [navigate])

  const popToRoot = useCallback(() => {
    const h = historyRef.current
    if (h.length === 0) return
    const entry = h[0]
    setHistory([])
    navigate(entry.screenId, entry.params)
  }, [navigate])

  const replace = useCallback(
    (screenId: string, params?: Record<string, unknown>) => {
      navigate(screenId, params)
    },
    [navigate],
  )

  const canGoBack = history.length > 0

  const breadcrumbs: NavigationEntry[] = [
    ...history,
    { screenId: currentScreenId, params: screenParams },
  ]

  const pushModal = useCallback(
    (screenId: string, props?: Record<string, unknown>) => {
      registry.get(screenId)
      setModalStack((prev) => [...prev, { screenId, props: props ?? {} }])
    },
    [registry],
  )

  const popModal = useCallback(() => {
    setModalStack((prev) => prev.slice(0, -1))
  }, [])

  const isModalOpen = modalStack.length > 0
  const currentModal: ScreenDefinition | null =
    modalStack.length > 0
      ? registry.get(modalStack[modalStack.length - 1].screenId)
      : null

  const value: NavigationContextValue = {
    currentScreenId,
    currentScreen,
    params: screenParams,
    registry,
    push,
    pop,
    popToRoot,
    replace,
    canGoBack,
    breadcrumbs,
    pushModal,
    popModal,
    modalStack,
    isModalOpen,
    currentModal,
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function NavigationProvider({
  registry,
  defaultScreen,
  children,
}: NavigationProviderProps) {
  return (
    <ScreenProvider registry={registry} defaultScreen={defaultScreen}>
      <NavigationProviderInner>{children}</NavigationProviderInner>
    </ScreenProvider>
  )
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext)
  if (!ctx) {
    throw new Error(
      'useNavigation() must be used within a <NavigationProvider>.',
    )
  }
  return ctx
}
