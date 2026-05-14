import type { ReactNode } from 'react'
import { ThemeProvider } from './design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from './interaction/KeyboardScopeProvider.js'
import { RegionProvider } from './interaction/RegionProvider.js'
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
  defaultRegion?: string
  withToastProvider?: boolean
  withModalProvider?: boolean
  withRegionProvider?: boolean
  onModalClose?: () => void
}

export function FrameworkProvider({
  children,
  registry,
  defaultScreen,
  themeMode = 'dark',
  defaultScope = 'navigation',
  defaultRegion = 'content',
  withToastProvider = true,
  withModalProvider = true,
  withRegionProvider = false,
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
        {withRegionProvider ? (
          <RegionProvider defaultRegion={defaultRegion}>
            <NavigationProvider registry={registry} defaultScreen={defaultScreen}>
              {body}
            </NavigationProvider>
          </RegionProvider>
        ) : (
          <NavigationProvider registry={registry} defaultScreen={defaultScreen}>
            {body}
          </NavigationProvider>
        )}
      </KeyboardScopeProvider>
    </ThemeProvider>
  )
}
