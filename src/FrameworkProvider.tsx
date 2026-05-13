import type { ReactNode } from 'react'
import { ThemeProvider } from './design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from './interaction/KeyboardScopeProvider.js'
import type { FocusScope } from './types.js'
import {
  NavigationProvider,
  type NavigationProviderProps,
} from './navigation/NavigationProvider.js'
import { ModalProvider } from './components/ModalProvider.js'
import { ToastProvider } from './components/ToastProvider.js'

export interface FrameworkProviderProps
  extends Pick<NavigationProviderProps, 'registry' | 'defaultScreen'> {
  children: ReactNode
  themeMode?: 'dark' | 'light'
  defaultScope?: FocusScope
  withToastProvider?: boolean
  withModalProvider?: boolean
  onModalClose?: () => void
}

export function FrameworkProvider({
  children,
  registry,
  defaultScreen,
  themeMode = 'dark',
  defaultScope = 'navigation',
  withToastProvider = true,
  withModalProvider = true,
  onModalClose,
}: FrameworkProviderProps) {
  let body: ReactNode = children

  if (withModalProvider) {
    body = <ModalProvider onClose={onModalClose}>{body}</ModalProvider>
  }

  if (withToastProvider) {
    body = <ToastProvider>{body}</ToastProvider>
  }

  return (
    <ThemeProvider mode={themeMode}>
      <KeyboardScopeProvider defaultScope={defaultScope}>
        <NavigationProvider registry={registry} defaultScreen={defaultScreen}>
          {body}
        </NavigationProvider>
      </KeyboardScopeProvider>
    </ThemeProvider>
  )
}
