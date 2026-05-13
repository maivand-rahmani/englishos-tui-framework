import type { ReactNode } from 'react'

export type ScreenCategory = 'main' | 'learning' | 'system'

export interface ScreenRenderContext<
  TParams extends Record<string, unknown> = Record<string, unknown>,
  TModalProps extends Record<string, unknown> = Record<string, unknown>,
> {
  params: TParams
  modalProps: TModalProps
  closeModal?: () => void
}

export interface ScreenDefinition {
  id: string
  title: string
  shortcut?: string
  component: (context: ScreenRenderContext) => ReactNode
  sidebar?: boolean
  category?: ScreenCategory
}
