import type { ReactNode } from 'react'

export type ScreenCategory = 'main' | 'learning' | 'system'

export interface ScreenDefinition {
  id: string
  title: string
  shortcut?: string
  component: () => ReactNode
  sidebar?: boolean
  category?: ScreenCategory
}
