import { type ChildProcess, spawn } from 'node:child_process'

// ── Public API Types ──

/**
 * A handle to a running child process, returned by `ProcessRunner.spawn()`.
 */
export interface RunningProcess {
  /** Send data to the process's stdin. */
  sendStdin: (data: string) => void
  /** Force-kill the process (SIGTERM). */
  kill: () => void
  /** Register a stdout-data listener. Returns an unsubscribe function. */
  onStdout: (cb: (data: string) => void) => () => void
  /** Register a stderr-data listener. Returns an unsubscribe function. */
  onStderr: (cb: (data: string) => void) => () => void
  /** Register an exit listener. Returns an unsubscribe function. */
  onExit: (cb: (code: number | null) => void) => () => void
}

/**
 * Abstract interface for spawning processes.
 * Framework consumers provide their own runner or use the default
 * `NodeProcessRunner`.
 */
export interface ProcessRunner {
  spawn: (command: string) => RunningProcess
}

// ── Default Node.js Implementation ──

type Listener<T> = (value: T) => void

class NodeRunningProcess implements RunningProcess {
  private proc: ChildProcess
  private stdoutListeners = new Set<Listener<string>>()
  private stderrListeners = new Set<Listener<string>>()
  private exitListeners = new Set<Listener<number | null>>()
  private exited = false

  constructor(proc: ChildProcess) {
    this.proc = proc

    proc.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      for (const cb of this.stdoutListeners) cb(text)
    })

    proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      for (const cb of this.stderrListeners) cb(text)
    })

    proc.on('exit', (code) => {
      this.exited = true
      for (const cb of this.exitListeners) cb(code)
    })

    proc.on('error', () => {
      if (!this.exited) {
        this.exited = true
        for (const cb of this.exitListeners) cb(null)
      }
    })
  }

  sendStdin(data: string): void {
    if (this.exited || !this.proc.stdin) return
    this.proc.stdin.write(data)
  }

  kill(): void {
    if (this.exited) return
    this.proc.kill('SIGTERM')
  }

  onStdout(cb: Listener<string>): () => void {
    this.stdoutListeners.add(cb)
    return () => { this.stdoutListeners.delete(cb) }
  }

  onStderr(cb: Listener<string>): () => void {
    this.stderrListeners.add(cb)
    return () => { this.stderrListeners.delete(cb) }
  }

  onExit(cb: Listener<number | null>): () => void {
    this.exitListeners.add(cb)
    return () => { this.exitListeners.delete(cb) }
  }
}

/**
 * Default `ProcessRunner` that shells out via `child_process.spawn`.
 * Parses the command string with a simple shell-aware split.
 *
 * @example
 * ```ts
 * const runner = new NodeProcessRunner()
 * ```
 */
export class NodeProcessRunner implements ProcessRunner {
  private shell: boolean

  constructor(options?: { shell?: boolean }) {
    this.shell = options?.shell ?? true
  }

  spawn(command: string): RunningProcess {
    if (this.shell) {
      const proc = spawn(command, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] })
      return new NodeRunningProcess(proc)
    }

    const parts = splitCommand(command)
    const [cmd, ...args] = parts
    const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    return new NodeRunningProcess(proc)
  }
}

/**
 * Simple shell-aware command splitter.
 * Handles single and double quotes.
 */
function splitCommand(input: string): string[] {
  const parts: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false

  for (const ch of input) {
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble
    } else if (ch === ' ' && !inSingle && !inDouble) {
      if (current.length > 0) {
        parts.push(current)
        current = ''
      }
    } else {
      current += ch
    }
  }

  if (current.length > 0) parts.push(current)
  return parts
}
