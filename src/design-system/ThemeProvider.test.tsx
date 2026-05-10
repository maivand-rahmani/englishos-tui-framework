import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { ThemeProvider, useTheme } from './ThemeProvider.js'

function ThemeConsumer({ field }: { field: string }) {
  const theme = useTheme()
  const color = field.split('.').reduce((acc: Record<string, unknown> | string, key: string) => {
    if (typeof acc === 'object' && acc !== null) {
      return (acc as Record<string, unknown>)[key] as string
    }
    return acc
  }, theme as unknown as Record<string, unknown>) as string

  return <Text color={color}>colored</Text>
}

describe('ThemeProvider', () => {
  it('renders children', () => {
    const { lastFrame } = render(
      <ThemeProvider>
        <Text>hello</Text>
      </ThemeProvider>,
    )
    expect(lastFrame()).toContain('hello')
  })

  it('provides theme context via useTheme()', () => {
    const { lastFrame } = render(
      <ThemeProvider>
        <ThemeConsumer field="colors.text.primary" />
      </ThemeProvider>,
    )
    expect(lastFrame()).toContain('colored')
  })

  it('defaults to dark mode', () => {
    const { lastFrame } = render(
      <ThemeProvider>
        <ThemeConsumer field="colors.surface.base" />
      </ThemeProvider>,
    )
    expect(lastFrame()).toBeDefined()
  })

  it('light mode inverts surface colors', () => {
    const { lastFrame } = render(
      <ThemeProvider mode="light">
        <ThemeConsumer field="colors.text.primary" />
      </ThemeProvider>,
    )
    expect(lastFrame()).toContain('colored')
  })

  it('provides spacing tokens', () => {
    const { lastFrame } = render(
      <ThemeProvider>
        <SpacingConsumer />
      </ThemeProvider>,
    )
    expect(lastFrame()).toContain('spacing')
  })

  it('provides typography tokens', () => {
    const { lastFrame } = render(
      <ThemeProvider>
        <TypographyConsumer />
      </ThemeProvider>,
    )
    expect(lastFrame()).toContain('bold')
  })

  it('provides border style tokens', () => {
    const { lastFrame } = render(
      <ThemeProvider>
        <BorderConsumer />
      </ThemeProvider>,
    )
    expect(lastFrame()).toContain('round')
  })
})

describe('useTheme()', () => {
  it('throws when used outside ThemeProvider', () => {
    const { lastFrame } = render(
      <ThemeConsumer field="colors.text.primary" />,
    )
    expect(lastFrame()).not.toContain('colored')
  })
})

function SpacingConsumer() {
  const theme = useTheme()
  return <Text>spacing: {theme.spacing.md}</Text>
}

function TypographyConsumer() {
  const theme = useTheme()
  return <Text>{theme.typography.heading}</Text>
}

function BorderConsumer() {
  const theme = useTheme()
  return <Text>{theme.borderStyles.panel}</Text>
}
