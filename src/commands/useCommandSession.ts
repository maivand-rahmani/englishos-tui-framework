import { useState, useCallback, useEffect, useRef } from 'react'
import { useInputInScope } from '../interaction/useInputInScope.js'
import { useKeyboardScope } from '../interaction/KeyboardScopeProvider.js'
import type { ProcessRunner, RunningProcess } from './ProcessRunner.js'

export type CommandSessionMode = 'navigation' | 'command' | 'process'
export type SessionStatus = 'idle' | 'running' | 'exited'

export interface UseCommandSessionOptions {
  runner: ProcessRunner
  onExit?: (exitCode: number | null) => void
}

export interface CommandSessionAPI {
  mode: CommandSessionMode
  status: SessionStatus
  input: string
  setInput: (value: string) => void
  submit: () => void
  output: OutputLine[]
  activeCommand: string | null
  exitCode: number | null
  kill: () => void
  activate: () => void
  deactivate: () => void
  clearOutput: () => void
}

export interface OutputLine {
  text: string
  stream: 'stdout' | 'stderr'
}

export function useCommandSession(
  options: UseCommandSessionOptions,
): CommandSessionAPI {
  const { runner, onExit } = options

  const [mode, setMode] = useState<CommandSessionMode>('navigation')
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [input, setStateInput] = useState('')
  const [output, setOutput] = useState<OutputLine[]>([])
  const [activeCommand, setActiveCommand] = useState<string | null>(null)
  const [exitCode, setExitCode] = useState<number | null>(null)

  // Refs that stay synchronous with state
  const processRef = useRef<RunningProcess | null>(null)
  const onExitRef = useRef(onExit)
  onExitRef.current = onExit
  const modeRef = useRef(mode)
  modeRef.current = mode
  const inputRef = useRef(input)
  inputRef.current = input

  const { pushScope, popScope, isScopeActive } = useKeyboardScope()

  // Sync keyboard scopes with mode
  useEffect(() => {
    const commandActive = isScopeActive('command')
    const processActive = isScopeActive('process')

    if (mode === 'command' && !commandActive) {
      pushScope('command')
    } else if (mode === 'process' && !processActive) {
      pushScope('process')
    } else if (mode === 'navigation') {
      if (commandActive) popScope('command')
      if (processActive) popScope('process')
    }
  }, [mode, pushScope, popScope, isScopeActive])

  // Command-mode keyboard handler
  useInputInScope(
    (char, key) => {
      if (modeRef.current !== 'command') return

      if (key.escape) {
        setMode('navigation')
        setStateInput('')
        return true
      }

      if (key.return) {
        submitRef.current()
        return true
      }

      if (key.backspace) {
        setStateInput((prev) => prev.slice(0, -1))
        return true
      }

      if (char.length === 1 && char >= ' ' && char <= '~') {
        setStateInput((prev) => prev + char)
        return true
      }

      return false
    },
    'command',
    { enabled: mode === 'command', priority: 70 },
  )

  // Process-mode keyboard handler
  useInputInScope(
    (char, key) => {
      if (modeRef.current !== 'process') return

      if (key.escape) {
        killRef.current()
        return true
      }

      if (key.return) {
        processRef.current?.sendStdin('\n')
        return true
      }

      if (key.backspace) {
        setStateInput((prev) => prev.slice(0, -1))
        return true
      }

      if (char.length === 1 && char >= ' ' && char <= '~') {
        setStateInput((prev) => prev + char)
        return true
      }

      return false
    },
    'process',
    { enabled: mode === 'process', priority: 70 },
  )

  // Stable submit — reads refs, not closure
  const submitCommand = useCallback(() => {
    const currentMode = modeRef.current

    if (currentMode === 'process') {
      processRef.current?.sendStdin(inputRef.current + '\n')
      setStateInput('')
      inputRef.current = ''
      return
    }

    if (currentMode !== 'command') return

    const cmd = inputRef.current.trim()
    if (!cmd) return

    const proc = runner.spawn(cmd)
    processRef.current = proc
    setActiveCommand(cmd)
    setStatus('running')
    setMode('process')
    modeRef.current = 'process'
    setStateInput('')
    inputRef.current = ''
    setOutput([])
    setExitCode(null)

    proc.onStdout((data) => {
      setOutput((prev) => [...prev, { text: data, stream: 'stdout' }])
    })

    proc.onStderr((data) => {
      setOutput((prev) => [...prev, { text: data, stream: 'stderr' }])
    })

    proc.onExit((code) => {
      setStatus('exited')
      setExitCode(code)
      processRef.current = null
      onExitRef.current?.(code)
    })
  }, [runner])

  // Wrap submit in a ref so the keyboard handler always calls the latest
  const submitRef = useRef(submitCommand)
  submitRef.current = submitCommand

  const killProcess = useCallback(() => {
    processRef.current?.kill()
    processRef.current = null
    setMode('navigation')
    modeRef.current = 'navigation'
    setStatus('idle')
    setActiveCommand(null)
    setExitCode(null)
  }, [])

  const killRef = useRef(killProcess)
  killRef.current = killProcess

  // setInput wrapper that also keeps the inputRef in sync
  const setInput = useCallback((value: string) => {
    setStateInput(value)
    inputRef.current = value
  }, [])

  const activate = useCallback(() => {
    setMode('command')
    modeRef.current = 'command'
    setStateInput('')
    inputRef.current = ''
  }, [])

  const deactivate = useCallback(() => {
    if (processRef.current) {
      processRef.current.kill()
      processRef.current = null
    }
    setMode('navigation')
    modeRef.current = 'navigation'
    setStatus('idle')
    setStateInput('')
    inputRef.current = ''
    setActiveCommand(null)
    setExitCode(null)
  }, [])

  const clearOutput = useCallback(() => {
    setOutput([])
  }, [])

  return {
    mode,
    status,
    input,
    setInput,
    submit: submitCommand,
    output,
    activeCommand,
    exitCode,
    kill: killProcess,
    activate,
    deactivate,
    clearOutput,
  }
}
