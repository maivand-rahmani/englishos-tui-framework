import { describe, it, expect, vi } from 'vitest'
import { AsyncSessionRunner } from './AsyncSessionRunner.js'
import type { ProcessRunner, RunningProcess } from './ProcessRunner.js'
import type { SessionLifecycle } from './AsyncSessionRunner.js'

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

function noopLifecycle(): SessionLifecycle {
  return {
    onStatusChange: vi.fn(),
    onEvent: vi.fn(),
    onError: vi.fn(),
    onExit: vi.fn(),
  }
}

// ── Tests ──

describe('AsyncSessionRunner', () => {
  describe('start', () => {
    it('sets status to running after spawn', () => {
      const { runner } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('echo hello')

      expect(session.status).toBe('running')
      expect(runner.spawn).toHaveBeenCalledWith('echo hello')
    })

    it('calls runner.spawn with joined args', () => {
      const { runner } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('git', ['log', '--oneline'])

      expect(runner.spawn).toHaveBeenCalledWith('git log --oneline')
    })

    it('fires lifecycle onStatusChange for starting and running', () => {
      const { runner } = createMockRunner()
      const lifecycle = noopLifecycle()
      const session = new AsyncSessionRunner({ runner })

      session.start('echo hello', undefined, lifecycle)

      expect(lifecycle.onStatusChange).toHaveBeenCalledWith('starting')
      expect(lifecycle.onStatusChange).toHaveBeenCalledWith('running')
    })

    it('pushes status events into the events array', () => {
      const { runner } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('echo hello')

      const statusEvents = session.events.filter((e) => e.type === 'status')
      expect(statusEvents).toHaveLength(2)
      expect(statusEvents[0]!.data).toBe('starting')
      expect(statusEvents[1]!.data).toBe('running')
    })

    it('captures stdout events', () => {
      const { runner, emitStdout } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('echo hello')
      emitStdout('hello world\n')

      expect(session.output).toHaveLength(1)
      expect(session.output[0]!.data).toBe('hello world\n')
      expect(session.output[0]!.type).toBe('stdout')
    })

    it('captures stderr events', () => {
      const { runner, emitStderr } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('invalid-cmd')
      emitStderr('command not found\n')

      expect(session.events).toHaveLength(3)
      expect(session.output).toHaveLength(1)
      expect(session.output[0]!.type).toBe('stderr')
    })

    it('transitions to complete on exit code 0', () => {
      const { runner, emitExit } = createMockRunner()
      const lifecycle = noopLifecycle()
      const session = new AsyncSessionRunner({ runner })

      session.start('echo hello', undefined, lifecycle)
      emitExit(0)

      expect(session.status).toBe('complete')
      expect(lifecycle.onExit).toHaveBeenCalledWith(0)
    })

    it('transitions to error on non-zero exit code', () => {
      const { runner, emitExit } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('exit 1')
      emitExit(1)

      expect(session.status).toBe('error')
    })

    it('kills previous process when start is called again', () => {
      const { runner, process } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('first')
      expect(process.kill).not.toHaveBeenCalled()

      session.start('second')
      expect(process.kill).toHaveBeenCalledTimes(1)
    })
  })

  describe('sendInput', () => {
    it('writes to process stdin', () => {
      const { runner, process } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('cat')
      session.sendInput('hello stdin')

      expect(process.sendStdin).toHaveBeenCalledWith('hello stdin')
    })

    it('is a no-op when no process is running', () => {
      const session = new AsyncSessionRunner({
        runner: { spawn: vi.fn() },
      })

      expect(() => session.sendInput('data')).not.toThrow()
    })
  })

  describe('cancel', () => {
    it('kills the process and sets status to idle', () => {
      const { runner, process } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('sleep 999')
      expect(session.status).toBe('running')

      session.cancel()

      expect(process.kill).toHaveBeenCalled()
      expect(session.status).toBe('idle')
    })

    it('is a no-op when nothing is running', () => {
      const session = new AsyncSessionRunner({
        runner: { spawn: vi.fn() },
      })

      expect(() => session.cancel()).not.toThrow()
      expect(session.status).toBe('idle')
    })
  })

  describe('isRunning', () => {
    it('returns true while starting or running', () => {
      const { runner } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      expect(session.isRunning()).toBe(false)

      session.start('echo hi')
      expect(session.isRunning()).toBe(true)
    })

    it('returns false after exit', () => {
      const { runner, emitExit } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('echo hi')
      emitExit(0)

      expect(session.isRunning()).toBe(false)
    })

    it('returns false after cancel', () => {
      const { runner } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('sleep 999')
      session.cancel()

      expect(session.isRunning()).toBe(false)
    })
  })

  describe('output bounding', () => {
    it('drops oldest events when exceeding maxOutputLines', () => {
      const { runner, emitStdout } = createMockRunner()
      const session = new AsyncSessionRunner({ runner, maxOutputLines: 3 })

      session.start('long-command')
      emitStdout('line 1\n')
      emitStdout('line 2\n')
      emitStdout('line 3\n')
      emitStdout('line 4\n')

      expect(session.events).toHaveLength(3)
      const output = session.output.map((e) => e.data)
      expect(output).toEqual(['line 2\n', 'line 3\n', 'line 4\n'])
    })

    it('defaults to 500 when maxOutputLines is not provided', () => {
      const { runner, emitStdout } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('fill')
      for (let i = 0; i < 30; i++) {
        emitStdout(`line ${i}\n`)
      }

      expect(session.events.length).toBeLessThan(500)
      expect(session.events.length).toBeGreaterThan(0)
    })
  })

  describe('cleanup', () => {
    it('kills the process and clears state', () => {
      const { runner, process, emitStdout } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('sleep 999')
      emitStdout('some output\n')

      expect(session.events.length).toBeGreaterThan(0)

      session.cleanup()

      expect(process.kill).toHaveBeenCalled()
      expect(session.events).toHaveLength(0)
      expect(session.status).toBe('idle')
    })

    it('is safe to call on an idle session', () => {
      const session = new AsyncSessionRunner({
        runner: { spawn: vi.fn() },
      })

      expect(() => session.cleanup()).not.toThrow()
      expect(session.status).toBe('idle')
    })
  })

  describe('multiple start/stop cycles', () => {
    it('handles multiple start-cancel cycles correctly', () => {
      const { runner } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('cmd1')
      expect(session.status).toBe('running')

      session.cancel()
      expect(session.status).toBe('idle')

      session.start('cmd2')
      expect(session.status).toBe('running')
      expect(runner.spawn).toHaveBeenCalledTimes(2)
    })
  })

  describe('output getter', () => {
    it('filters out status events and returns only stdout/stderr', () => {
      const { runner, emitStdout, emitStderr } = createMockRunner()
      const session = new AsyncSessionRunner({ runner })

      session.start('cmd')
      emitStdout('out\n')
      emitStderr('err\n')

      expect(session.output).toHaveLength(2)
      expect(session.output.every((e) =>
        e.type === 'stdout' || e.type === 'stderr',
      )).toBe(true)
    })
  })
})
