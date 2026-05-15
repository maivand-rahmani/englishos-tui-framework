import type { ProcessRunner, RunningProcess } from './ProcessRunner.js'

// ── Public Types ──

export type SessionStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'waiting'
  | 'error'
  | 'complete'

export interface SessionOptions {
  runner: ProcessRunner
  /** Maximum number of events in the ring buffer. Default: 500. */
  maxOutputLines?: number
}

export interface SessionEvent {
  type: 'stdout' | 'stderr' | 'status' | 'error'
  data: string
  timestamp: number
}

export interface SessionLifecycle {
  onStatusChange?: (status: SessionStatus) => void
  onEvent?: (event: SessionEvent) => void
  onError?: (error: Error) => void
  onExit?: (exitCode: number | null) => void
}

// ── Implementation ──

export class AsyncSessionRunner {
  private _status: SessionStatus = 'idle'
  private _events: SessionEvent[] = []
  private _process: RunningProcess | null = null
  private _maxOutputLines: number
  private _runner: ProcessRunner
  private _lifecycle: SessionLifecycle | undefined
  private _exited = false

  constructor(options: SessionOptions) {
    this._runner = options.runner
    this._maxOutputLines = options.maxOutputLines ?? 500
  }

  // ── Public Accessors ──

  get status(): SessionStatus {
    return this._status
  }

  get events(): readonly SessionEvent[] {
    return this._events
  }

  /** Derived view filtered to stdout/stderr events only. */
  get output(): readonly SessionEvent[] {
    return this._events.filter(
      (e) => e.type === 'stdout' || e.type === 'stderr',
    )
  }

  // ── Public Methods ──

  /**
   * Spawn a command. Cancels any currently-running process first.
   * Lifecycle callbacks are active for the duration of this session.
   */
  start(
    command: string,
    args?: string[],
    lifecycle?: SessionLifecycle,
  ): void {
    if (this._process) {
      this._cleanupProcess()
    }

    this._lifecycle = lifecycle
    this._events = []
    this._exited = false
    this._setStatus('starting')

    try {
      const cmd = args && args.length > 0
        ? `${command} ${args.join(' ')}`
        : command

      const proc = this._runner.spawn(cmd)
      this._process = proc
      this._setStatus('running')

      proc.onStdout((data: string) => {
        this._addEvent('stdout', data)
      })

      proc.onStderr((data: string) => {
        this._addEvent('stderr', data)
      })

      proc.onExit((code: number | null) => {
        this._process = null
        if (!this._exited) {
          this._exited = true
          const status = code === 0 ? 'complete' : 'error'
          this._setStatus(status)
          this._lifecycle?.onExit?.(code)
        }
      })
    } catch (err: unknown) {
      this._setStatus('error')
      this._lifecycle?.onError?.(
        err instanceof Error ? err : new Error(String(err)),
      )
    }
  }

  /** Send data to the process's stdin. No-op if not running. */
  sendInput(data: string): void {
    this._process?.sendStdin(data)
  }

  /** Kill the process and reset status to idle. */
  cancel(): void {
    this._cleanupProcess()
    this._setStatus('idle')
  }

  /** True while the session is starting or running. */
  isRunning(): boolean {
    return this._status === 'starting' || this._status === 'running'
  }

  /**
   * Full teardown. Kills process, clears output buffer, resets state.
   * Safe to call multiple times.
   */
  cleanup(): void {
    if (this._process) {
      this._process.kill()
      this._process = null
    }
    this._events = []
    this._status = 'idle'
  }

  // ── Private ──

  private _setStatus(status: SessionStatus): void {
    this._status = status
    this._addEvent('status', status)
    this._lifecycle?.onStatusChange?.(status)
  }

  private _addEvent(type: SessionEvent['type'], data: string): void {
    const event: SessionEvent = { type, data, timestamp: Date.now() }
    this._events.push(event)

    while (this._events.length > this._maxOutputLines) {
      this._events.shift()
    }

    this._lifecycle?.onEvent?.(event)
  }

  private _cleanupProcess(): void {
    if (this._process) {
      this._process.kill()
      this._process = null
    }
  }
}
