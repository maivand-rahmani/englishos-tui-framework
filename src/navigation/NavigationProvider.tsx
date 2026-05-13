import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react'
import { ScreenProvider, useScreen } from '../screens/ScreenProvider.js'
import type { ScreenDefinition } from '../screens/screen.js'
import type { ScreenRegistry } from '../screens/registry.js'

export interface NavigationEntry {
  screenId: string
  params: Record<string, unknown>
}

export interface ModalEntry<TProps extends Record<string, unknown> = Record<string, unknown>> {
  screenId: string
  props: TProps
}

export interface NavigationStateValue {
  currentScreenId: string
  currentScreen: ScreenDefinition
  params: Record<string, unknown>
  registry: ScreenRegistry
  canGoBack: boolean
  breadcrumbs: NavigationEntry[]
}

export interface NavigationActionsValue {
  push: (screenId: string, params?: Record<string, unknown>) => void
  pop: () => void
  popToRoot: () => void
  replace: (screenId: string, params?: Record<string, unknown>) => void
}

export interface ModalStateValue {
  modalStack: ModalEntry[]
  isModalOpen: boolean
  currentModal: ScreenDefinition | null
  currentModalProps: Record<string, unknown>
}

export interface ModalActionsValue {
  pushModal: <TProps extends Record<string, unknown>>(
    screenId: string,
    props?: TProps,
  ) => void
  popModal: () => void
  popAllModals: () => void
}

export interface NavigationContextValue
  extends NavigationStateValue,
    NavigationActionsValue,
    ModalStateValue,
    ModalActionsValue {}

const NavigationStateContext = createContext<NavigationStateValue | null>(null)
const NavigationActionsContext =
  createContext<NavigationActionsValue | null>(null)
const ModalStateContext = createContext<ModalStateValue | null>(null)
const ModalActionsContext = createContext<ModalActionsValue | null>(null)

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
    const snapshot = historyRef.current
    if (snapshot.length === 0) return
    const previous = snapshot[snapshot.length - 1]
    setHistory(snapshot.slice(0, -1))
    navigate(previous.screenId, previous.params)
  }, [navigate])

  const popToRoot = useCallback(() => {
    const snapshot = historyRef.current
    if (snapshot.length === 0) return
    const root = snapshot[0]
    setHistory([])
    navigate(root.screenId, root.params)
  }, [navigate])

  const replace = useCallback(
    (screenId: string, params?: Record<string, unknown>) => {
      navigate(screenId, params)
    },
    [navigate],
  )

  const pushModal = useCallback(
    <TProps extends Record<string, unknown>>(
      screenId: string,
      props?: TProps,
    ) => {
      registry.get(screenId)
      setModalStack((prev) => [
        ...prev,
        {
          screenId,
          props: (props ?? {}) as TProps,
        },
      ])
    },
    [registry],
  )

  const popModal = useCallback(() => {
    setModalStack((prev) => prev.slice(0, -1))
  }, [])

  const popAllModals = useCallback(() => {
    setModalStack([])
  }, [])

  const canGoBack = history.length > 0
  const breadcrumbs: NavigationEntry[] = [
    ...history,
    { screenId: currentScreenId, params: screenParams },
  ]

  const currentModalEntry = modalStack[modalStack.length - 1]
  const currentModal = currentModalEntry
    ? registry.get(currentModalEntry.screenId)
    : null

  const navigationState = useMemo<NavigationStateValue>(
    () => ({
      currentScreenId,
      currentScreen,
      params: screenParams,
      registry,
      canGoBack,
      breadcrumbs,
    }),
    [breadcrumbs, canGoBack, currentScreen, currentScreenId, registry, screenParams],
  )

  const navigationActions = useMemo<NavigationActionsValue>(
    () => ({
      push,
      pop,
      popToRoot,
      replace,
    }),
    [pop, popToRoot, push, replace],
  )

  const modalState = useMemo<ModalStateValue>(
    () => ({
      modalStack,
      isModalOpen: modalStack.length > 0,
      currentModal,
      currentModalProps: currentModalEntry?.props ?? {},
    }),
    [currentModal, currentModalEntry?.props, modalStack],
  )

  const modalActions = useMemo<ModalActionsValue>(
    () => ({
      pushModal,
      popModal,
      popAllModals,
    }),
    [popAllModals, popModal, pushModal],
  )

  return (
    <NavigationStateContext.Provider value={navigationState}>
      <NavigationActionsContext.Provider value={navigationActions}>
        <ModalStateContext.Provider value={modalState}>
          <ModalActionsContext.Provider value={modalActions}>
            {children}
          </ModalActionsContext.Provider>
        </ModalStateContext.Provider>
      </NavigationActionsContext.Provider>
    </NavigationStateContext.Provider>
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

function useRequiredContext<T>(context: React.Context<T | null>, name: string): T {
  const value = useContext(context)
  if (!value) {
    throw new Error(`${name} must be used within a <NavigationProvider>.`)
  }
  return value
}

export function useNavigationState(): NavigationStateValue {
  return useRequiredContext(NavigationStateContext, 'useNavigationState()')
}

export function useNavigationActions(): NavigationActionsValue {
  return useRequiredContext(NavigationActionsContext, 'useNavigationActions()')
}

export function useModalState(): ModalStateValue {
  return useRequiredContext(ModalStateContext, 'useModalState()')
}

export function useModalActions(): ModalActionsValue {
  return useRequiredContext(ModalActionsContext, 'useModalActions()')
}

export function useNavigation(): NavigationContextValue {
  return {
    ...useNavigationState(),
    ...useNavigationActions(),
    ...useModalState(),
    ...useModalActions(),
  }
}
