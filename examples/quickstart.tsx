import React from 'react'
import { render, Text } from 'ink'
import {
  FrameworkProvider,
  ScreenRegistry,
  AppShell,
  TopBar,
  ScreenRenderer,
  useNavigationState,
} from '../src/index.js'

const registry = new ScreenRegistry()
registry.register({
  id: 'home',
  title: 'Home',
  sidebar: true,
  category: 'main',
  component: () => <Text>Hello from @maivandrahmani/englishos-tui-framework</Text>,
})

function Shell() {
  const { currentScreen } = useNavigationState()
  return (
    <AppShell topBar={<TopBar appName="Framework Demo" screenTitle={currentScreen.title} />}>
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
