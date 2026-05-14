import React from 'react'
import { render, Box, Text } from 'ink'
import {
  FrameworkProvider,
  ScreenRegistry,
  AppShell,
  TopBar,
  ScreenRenderer,
  useNavigationState,
  useCommandSession,
  CommandBar,
  ProcessOutputPanel,
  NodeProcessRunner,
} from '../src/index.js'

const registry = new ScreenRegistry()
registry.register({
  id: 'home',
  title: 'Command Console Demo',
  sidebar: true,
  category: 'main',
  component: () => <HomeScreen />,
})

const runner = new NodeProcessRunner()

function HomeScreen() {
  const session = useCommandSession({ runner })

  return (
    <Box flexDirection="column">
      <Text>Press Ctrl+C to exit the demo.</Text>
      <Box marginY={1}>
        <CommandBar
          mode={session.mode}
          value={session.input}
          onChange={session.setInput}
          onSubmit={session.submit}
        />
      </Box>
      <ProcessOutputPanel
        output={session.output}
        status={session.status}
        activeCommand={session.activeCommand}
        exitCode={session.exitCode}
      />
    </Box>
  )
}

function Shell() {
  const { currentScreen } = useNavigationState()
  return (
    <AppShell topBar={<TopBar appName="Console Demo" screenTitle={currentScreen.title} />}>
      <ScreenRenderer />
    </AppShell>
  )
}

function App() {
  return (
    <FrameworkProvider registry={registry} defaultScreen="home">
      <Shell />
    </FrameworkProvider>
  )
}

render(<App />)
