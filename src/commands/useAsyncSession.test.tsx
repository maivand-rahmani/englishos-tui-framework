import { describe, it, expect, vi } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import React, { act } from 'react'
import { useAsyncSession } from './useAsyncSession.js'
import type { ProcessRunner, RunningProcess } from './ProcessRunner.js'

// ── Mock Helpers ──

function createMockRunner() {
  let stdoutCb: ((data: string) => void) | null = null
  let stderrCb: ((data: string) => void) | null = null
  let exitCb: ((code: number | null) => void) | null = null

  const process: RunningProcess = {
    sendStdin: vi.fn(),
    kill: vi.fn(() => {
      exitCb?.(null)
    }),
    onStdout: vi.fn((cb: (data: string) => void) => {
      stdoutCb = cb
      return () => {
        stdoutCb = null
      }
    }),
    onStderr: vi.fn((cb: (data: string) => void) => {
      stderrCb = cb
      return () => {
        stderrCb = null
      }
    }),
    onExit: vi.fn((cb: (code: number | null) => void) => {
      exitCb = cb
      return () => {
        exitCb = null
      }
    }),
  }

  const runner: ProcessRunner = {
    spawn: vi.fn(() => process),
  }

  return {
    runner,
    process,
    emitStdout(data: string) {
      stdoutCb?.(data)
    },
    emitStderr(data: string) {
      stderrCb?.(data)
    },
    emitExit(code: number | null) {
      exitCb?.(code)
    },
  }
}

// ── Test Component ──

interface HookCaptured {
  status: string
  isRunning: boolean
  isComplete: boolean
  isError: boolean
  outputLen: number
  eventsLen: number
  lastEventType: string | null
  start: (command: string) => void
  sendInput: (data: string) => void
  cancel: () => void
}

function TestHarness({
  runner,
  autoCleanup,
  onCapture,
}: {
  runner: ProcessRunner
  autoCleanup?: boolean
  onCapture: (captured: HookCaptured) => void
}) {
  const session = useAsyncSession({ runner, autoCleanup })

  const captured: HookCaptured = {
    status: session.status,
    isRunning: session.isRunning,
    isComplete: session.isComplete,
    isError: session.isError,
    outputLen: session.output.length,
    eventsLen: session.events.length,
    lastEventType: session.lastEvent?.type ?? null,
    start: session.start,
    sendInput: session.sendInput,
    cancel: session.cancel,
  }

  React.useEffect(() => {
    onCapture(captured)
  })

  return (
    <Text>
      {`${captured.status}|${captured.isRunning}|${captured.isComplete}|${captured.isError}|${captured.outputLen}`}
    </Text>
  )
}

// ── Tests ──

describe('useAsyncSession', () => {
  it('provides initial idle state', () => {
    const { runner } = createMockRunner()
    let captured: HookCaptured | null = null

    const { lastFrame } = render(
      <TestHarness
        runner={runner}
        onCapture={(c) => {
          captured = c
        }}
      />,
    )

    expect(lastFrame()).toContain('idle|false|false|false|0')
    expect(captured!.status).toBe('idle')
    expect(captured!.isRunning).toBe(false)
    expect(captured!.isComplete).toBe(false)
    expect(captured!.isError).toBe(false)
    expect(captured!.lastEventType).toBeNull()
  })

  it('start transitions to running', () => {
    const { runner } = createMockRunner()
    let captured: HookCaptured | null = null

    const { lastFrame } = render(
      <TestHarness
        runner={runner}
        onCapture={(c) => {
          captured = c
        }}
      />,
    )

    act(() => {
      captured!.start('echo hello')
    })

    expect(lastFrame()).toContain('running|true|false|false|0')
  })

  it('cancel transitions back to idle', () => {
    const { runner } = createMockRunner()
    let captured: HookCaptured | null = null

    const { lastFrame } = render(
      <TestHarness
        runner={runner}
        onCapture={(c) => {
          captured = c
        }}
      />,
    )

    act(() => {
      captured!.start('sleep 999')
    })

    expect(lastFrame()).toContain('running|true|false|false|0')

    act(() => {
      captured!.cancel()
    })

    expect(lastFrame()).toContain('idle|false|false|false|0')
  })

  it('tracks stdout output in the output array', () => {
    const { runner, emitStdout } = createMockRunner()
    let captured: HookCaptured | null = null

    const { lastFrame } = render(
      <TestHarness
        runner={runner}
        onCapture={(c) => {
          captured = c
        }}
      />,
    )

    act(() => {
      captured!.start('echo hello')
    })

    act(() => {
      emitStdout('hello\n')
    })

    expect(lastFrame()).toContain('running|true|false|false|1')
    expect(captured!.outputLen).toBe(1)
    expect(captured!.eventsLen).toBe(3)
  })

  it('derived booleans match status when process completes', () => {
    const { runner, emitExit } = createMockRunner()
    let captured: HookCaptured | null = null

    const { lastFrame } = render(
      <TestHarness
        runner={runner}
        onCapture={(c) => {
          captured = c
        }}
      />,
    )

    act(() => {
      captured!.start('echo hello')
    })

    act(() => {
      emitExit(0)
    })

    expect(lastFrame()).toContain('complete|false|true|false|0')
    expect(captured!.isComplete).toBe(true)
    expect(captured!.isRunning).toBe(false)
  })

  it('derived booleans match status when process errors', () => {
    const { runner, emitExit } = createMockRunner()
    let captured: HookCaptured | null = null

    const { lastFrame } = render(
      <TestHarness
        runner={runner}
        onCapture={(c) => {
          captured = c
        }}
      />,
    )

    act(() => {
      captured!.start('exit 1')
    })

    act(() => {
      emitExit(1)
    })

    expect(lastFrame()).toContain('error|false|false|true|0')
    expect(captured!.isError).toBe(true)
  })

  it('sendInput delegates to the runner', () => {
    const { runner, process } = createMockRunner()
    let captured: HookCaptured | null = null

    render(
      <TestHarness
        runner={runner}
        onCapture={(c) => {
          captured = c
        }}
      />,
    )

    act(() => {
      captured!.start('cat')
    })

    act(() => {
      captured!.sendInput('typed text')
    })

    expect(process.sendStdin).toHaveBeenCalledWith('typed text')
  })

  it('lastEvent tracks the most recent event', () => {
    const { runner, emitStdout } = createMockRunner()
    let captured: HookCaptured | null = null

    render(
      <TestHarness
        runner={runner}
        onCapture={(c) => {
          captured = c
        }}
      />,
    )

    act(() => {
      captured!.start('echo hello')
    })

    act(() => {
      emitStdout('last output line\n')
    })

    expect(captured!.lastEventType).toBe('stdout')
  })
})
