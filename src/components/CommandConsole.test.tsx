import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Box, Text } from 'ink'
import React, { type ReactElement } from 'react'
import { ThemeProvider } from '../design-system/ThemeProvider.js'
import { KeyboardScopeProvider } from '../interaction/KeyboardScopeProvider.js'
import { CommandBar } from './CommandBar.js'
import { ProcessOutputPanel } from './ProcessOutputPanel.js'
import { useCommandSession } from '../commands/useCommandSession.js'
import type {
  CommandSessionAPI,
  OutputLine,
} from '../commands/useCommandSession.js'
import type { ProcessRunner, RunningProcess } from '../commands/ProcessRunner.js'

// ── Mock Process Runner ──

class MockRunningProcess implements RunningProcess {
  private stdoutListeners = new Set<(data: string) => void>()
  private stderrListeners = new Set<(data: string) => void>()
  private exitListeners = new Set<(code: number | null) => void>()

  stdinData: string[] = []
  wasKilled = false

  sendStdin(data: string): void {
    this.stdinData.push(data)
  }

  kill(): void {
    this.wasKilled = true
  }

  onStdout(cb: (data: string) => void): () => void {
    this.stdoutListeners.add(cb)
    return () => this.stdoutListeners.delete(cb)
  }

  onStderr(cb: (data: string) => void): () => void {
    this.stderrListeners.add(cb)
    return () => this.stderrListeners.delete(cb)
  }

  onExit(cb: (code: number | null) => void): () => void {
    this.exitListeners.add(cb)
    return () => this.exitListeners.delete(cb)
  }

  emitStdout(data: string): void {
    for (const cb of this.stdoutListeners) cb(data)
  }

  emitStderr(data: string): void {
    for (const cb of this.stderrListeners) cb(data)
  }

  emitExit(code: number | null): void {
    for (const cb of this.exitListeners) cb(code)
  }
}

let lastMockProcess: MockRunningProcess | null = null

function createMockRunner(): ProcessRunner {
  return {
    spawn(_command: string): RunningProcess {
      const proc = new MockRunningProcess()
      lastMockProcess = proc
      return proc
    },
  }
}

// ── Helpers ──

function delay(ms = 50) {
  return new Promise((r) => setTimeout(r, ms))
}

function renderConsole(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <KeyboardScopeProvider>{ui}</KeyboardScopeProvider>
    </ThemeProvider>,
  )
}

/// Helper: activate command mode and type text, then wait for render
async function activateAndType(api: CommandSessionAPI, text: string) {
  api.activate()
  api.setInput(text)
  await delay()
}

/// Helper: spawn a command via the API (activate + type + submit)
async function spawnCommand(api: CommandSessionAPI, cmd: string) {
  api.activate()
  api.setInput(cmd)
  await delay()
  api.submit()
  await delay()
}

// ── Test Setup Component ──

interface ConsoleHarnessProps {
  onSession?: (api: CommandSessionAPI) => void
  showBar?: boolean
  showPanel?: boolean
}

function ConsoleHarness({
  onSession,
  showBar = true,
  showPanel = true,
}: ConsoleHarnessProps) {
  const [runner] = React.useState(createMockRunner)
  const session = useCommandSession({ runner })
  onSession?.(session)

  return (
    <Box flexDirection="column">
      {showBar && (
        <CommandBar
          mode={session.mode}
          value={session.input}
          onChange={session.setInput}
          onSubmit={session.submit}
        />
      )}
      {showPanel && (
        <ProcessOutputPanel
          output={session.output}
          status={session.status}
          activeCommand={session.activeCommand}
          exitCode={session.exitCode}
        />
      )}
      <Text>Mode:{session.mode}</Text>
      <Text>Status:{session.status}</Text>
    </Box>
  )
}

// ── CommandBar Tests ──

describe('CommandBar', () => {
  it('renders nothing in navigation mode', () => {
    const { lastFrame } = renderConsole(
      <CommandBar mode="navigation" value="" onChange={() => {}} onSubmit={() => {}} />,
    )
    expect(lastFrame()).toBe('')
  })

  it('shows prompt and cursor in command mode', () => {
    const { lastFrame } = renderConsole(
      <CommandBar mode="command" value="" onChange={() => {}} onSubmit={() => {}} />,
    )
    const frame = lastFrame()
    expect(frame).toContain('>')
    expect(frame).toContain('|')
  })

  it('shows placeholder when value is empty in command mode', () => {
    const { lastFrame } = renderConsole(
      <CommandBar
        mode="command"
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        placeholder="Enter command..."
      />,
    )
    expect(lastFrame()).toContain('Enter command...')
  })

  it('shows typed input value', () => {
    const { lastFrame } = renderConsole(
      <CommandBar mode="command" value="echo hello" onChange={() => {}} onSubmit={() => {}} />,
    )
    expect(lastFrame()).toContain('echo hello')
  })

  it('shows (stdin) indicator in process mode', () => {
    const { lastFrame } = renderConsole(
      <CommandBar mode="process" value="" onChange={() => {}} onSubmit={() => {}} />,
    )
    expect(lastFrame()).toContain('stdin')
  })
})

// ── ProcessOutputPanel Tests ──

describe('ProcessOutputPanel', () => {
  it('shows idle status by default', () => {
    const { lastFrame } = renderConsole(
      <ProcessOutputPanel
        output={[]}
        status="idle"
        activeCommand={null}
        exitCode={null}
      />,
    )
    expect(lastFrame()).toContain('Idle')
  })

  it('shows running status', () => {
    const { lastFrame } = renderConsole(
      <ProcessOutputPanel
        output={[]}
        status="running"
        activeCommand="echo test"
        exitCode={null}
      />,
    )
    expect(lastFrame()).toContain('Running')
    expect(lastFrame()).toContain('echo test')
  })

  it('shows exited status with exit code', () => {
    const { lastFrame } = renderConsole(
      <ProcessOutputPanel
        output={[]}
        status="exited"
        activeCommand="ls"
        exitCode={0}
      />,
    )
    expect(lastFrame()).toContain('Exited')
    expect(lastFrame()).toContain('exit 0')
  })

  it('shows non-zero exit code as error', () => {
    const { lastFrame } = renderConsole(
      <ProcessOutputPanel
        output={[]}
        status="exited"
        activeCommand="bad-command"
        exitCode={1}
      />,
    )
    expect(lastFrame()).toContain('exit 1')
  })

  it('renders stdout output lines', () => {
    const output: OutputLine[] = [
      { text: 'line one', stream: 'stdout' },
      { text: 'line two', stream: 'stdout' },
    ]
    const { lastFrame } = renderConsole(
      <ProcessOutputPanel
        output={output}
        status="running"
        activeCommand="echo"
        exitCode={null}
      />,
    )
    const frame = lastFrame()
    expect(frame).toContain('line one')
    expect(frame).toContain('line two')
  })

  it('renders stderr output lines', () => {
    const output: OutputLine[] = [
      { text: 'error message', stream: 'stderr' },
    ]
    const { lastFrame } = renderConsole(
      <ProcessOutputPanel
        output={output}
        status="running"
        activeCommand="cmd"
        exitCode={null}
      />,
    )
    expect(lastFrame()).toContain('error message')
  })

  it('shows waiting message while running with no output', () => {
    const { lastFrame } = renderConsole(
      <ProcessOutputPanel
        output={[]}
        status="running"
        activeCommand="sleep"
        exitCode={null}
      />,
    )
    expect(lastFrame()).toContain('Waiting for output')
  })
})

// ── useCommandSession Integration Tests ──

describe('useCommandSession', () => {
  beforeEach(() => {
    lastMockProcess = null
  })

  it('starts in navigation mode', async () => {
    const { lastFrame } = renderConsole(<ConsoleHarness />)
    expect(lastFrame()).toContain('Mode:navigation')
    expect(lastFrame()).toContain('Status:idle')
  })

  it('activate switches to command mode', async () => {
    let api!: CommandSessionAPI
    const { lastFrame } = renderConsole(
      <ConsoleHarness onSession={(s) => { api = s }} />,
    )
    await delay()

    api.activate()
    await delay()

    expect(lastFrame()).toContain('Mode:command')
  })

  it('enter text via setInput in command mode', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await activateAndType(api, 'echo hello')
    expect(api.input).toBe('echo hello')
  })

  it('submit spawns process and switches to process mode', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await spawnCommand(api, 'echo hello')

    expect(api.mode).toBe('process')
    expect(api.status).toBe('running')
    expect(api.activeCommand).toBe('echo hello')
  })

  it('submitting empty input in command mode does nothing', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    api.activate()
    await delay()
    api.submit()
    await delay()

    expect(api.mode).toBe('command')
  })

  it('accumulates stdout output from process', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await spawnCommand(api, 'echo hello')

    expect(lastMockProcess).not.toBeNull()
    lastMockProcess!.emitStdout('hello\n')
    await delay()

    expect(api.output.length).toBe(1)
    expect(api.output[0].text).toBe('hello\n')
    expect(api.output[0].stream).toBe('stdout')
  })

  it('accumulates stderr output from process', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await spawnCommand(api, 'cmd')

    lastMockProcess!.emitStderr('error\n')
    await delay()

    expect(api.output.length).toBe(1)
    expect(api.output[0].stream).toBe('stderr')
  })

  it('send stdin via submit in process mode', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await spawnCommand(api, 'cat')

    api.setInput('some input')
    await delay()
    api.submit()
    await delay()

    expect(lastMockProcess!.stdinData).toContain('some input\n')
  })

  it('empty submit sends newline in process mode', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await spawnCommand(api, 'cat')

    api.submit()
    await delay()

    expect(lastMockProcess!.stdinData).toContain('\n')
  })

  it('kill terminates the process', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await spawnCommand(api, 'sleep 10')

    expect(api.mode).toBe('process')
    expect(api.status).toBe('running')

    api.kill()
    await delay()

    expect(lastMockProcess!.wasKilled).toBe(true)
    expect(api.mode).toBe('navigation')
    expect(api.status).toBe('idle')
  })

  it('deactivate returns to navigation mode', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    api.activate()
    await delay()
    expect(api.mode).toBe('command')

    api.deactivate()
    await delay()
    expect(api.mode).toBe('navigation')
  })

  it('clearOutput empties the output array', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await spawnCommand(api, 'cmd')

    lastMockProcess!.emitStdout('data\n')
    await delay()
    expect(api.output.length).toBeGreaterThan(0)

    api.clearOutput()
    await delay()
    expect(api.output.length).toBe(0)
  })

  it('process exit transitions status to exited', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await spawnCommand(api, 'echo')

    expect(api.status).toBe('running')

    lastMockProcess!.emitExit(0)
    await delay()

    expect(api.status).toBe('exited')
    expect(api.exitCode).toBe(0)
    expect(api.mode).toBe('process')
  })

  it('adds (stdin) forwarding keyboard in process mode via escape to kill', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await spawnCommand(api, 'less')

    expect(api.mode).toBe('process')

    api.kill()
    await delay()

    expect(api.mode).toBe('navigation')
    expect(lastMockProcess!.wasKilled).toBe(true)
  })

  it('handles multiple spawns sequentially', async () => {
    let api!: CommandSessionAPI
    renderConsole(<ConsoleHarness onSession={(s) => { api = s }} />)
    await delay()

    await spawnCommand(api, 'echo first')
    lastMockProcess!.emitExit(0)
    await delay()
    expect(api.activeCommand).toBe('echo first')

    api.activate()
    api.setInput('echo second')
    await delay()
    api.submit()
    await delay()
    expect(api.activeCommand).toBe('echo second')
    expect(api.status).toBe('running')
  })
})

// ── Output Line Rendering Tests ──

describe('OutputLine rendering', () => {
  it('renders multiple output lines in order', () => {
    const output: OutputLine[] = [
      { text: 'first', stream: 'stdout' },
      { text: 'second', stream: 'stdout' },
      { text: 'third', stream: 'stdout' },
    ]

    const { lastFrame } = renderConsole(
      <ProcessOutputPanel
        output={output}
        status="exited"
        activeCommand="test"
        exitCode={0}
      />,
    )

    const frame = lastFrame() ?? ''
    const firstIdx = frame.indexOf('first')
    const secondIdx = frame.indexOf('second')
    const thirdIdx = frame.indexOf('third')

    expect(firstIdx).toBeGreaterThanOrEqual(0)
    expect(secondIdx).toBeGreaterThan(firstIdx)
    expect(thirdIdx).toBeGreaterThan(secondIdx)
  })
})
