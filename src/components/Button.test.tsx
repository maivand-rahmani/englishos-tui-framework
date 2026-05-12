import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import {
  borderStyles,
  semanticColors,
  spacing,
  typography,
} from '../design-system/tokens.js'
import type { ThemeTokens } from '../types.js'
import { Button, resolveButtonAppearance } from './Button.js'

function renderInTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

const theme: ThemeTokens = {
  colors: {
    text: { ...semanticColors.text },
    status: { ...semanticColors.status },
    focus: { ...semanticColors.focus },
    surface: { ...semanticColors.surface },
    border: { ...semanticColors.border },
  },
  spacing: { ...spacing },
  typography: { ...typography },
  borderStyles: { ...borderStyles },
}

describe('Button', () => {
  it('renders default variant', () => {
    const { lastFrame } = renderInTheme(<Button>Default</Button>)

    expect(lastFrame()).toContain('[Default]')
  })

  it('renders primary, danger, and ghost variants', () => {
    const { lastFrame } = renderInTheme(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
      </>,
    )

    const frame = lastFrame() ?? ''
    expect(frame).toContain('[Primary]')
    expect(frame).toContain('[Danger]')
    expect(frame).toContain('[Ghost]')
  })

  it('renders focused and disabled states', () => {
    const { lastFrame } = renderInTheme(
      <>
        <Button focused>Focused</Button>
        <Button disabled>Disabled</Button>
      </>,
    )

    const frame = lastFrame() ?? ''
    expect(frame).toContain('[Focused]')
    expect(frame).toContain('[Disabled]')
  })

  it('does not crash when optional props are omitted', () => {
    const { lastFrame } = renderInTheme(<Button>Safe Defaults</Button>)

    expect(lastFrame()).toContain('[Safe Defaults]')
  })

  it('resolves variant and state appearance from theme tokens', () => {
    expect(resolveButtonAppearance(theme, 'default', false, false)).toEqual({
      color: theme.colors.text.primary,
    })

    expect(resolveButtonAppearance(theme, 'primary', false, false)).toEqual({
      color: theme.colors.status.info,
    })

    expect(resolveButtonAppearance(theme, 'danger', false, false)).toEqual({
      color: theme.colors.status.error,
    })

    expect(resolveButtonAppearance(theme, 'ghost', false, false)).toEqual({
      color: theme.colors.text.secondary,
      dimColor: true,
    })

    expect(resolveButtonAppearance(theme, 'default', true, false)).toEqual({
      color: theme.colors.focus.ring,
      bold: true,
    })

    expect(resolveButtonAppearance(theme, 'primary', true, true)).toEqual({
      color: theme.colors.text.secondary,
      dimColor: true,
    })
  })
})
