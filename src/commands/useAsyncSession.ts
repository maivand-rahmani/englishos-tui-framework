import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  AsyncSessionRunner,
  type SessionStatus,
  type SessionEvent,
  type SessionLifecycle,
} from './AsyncSessionRunner.js'
import type { ProcessRunner } from './ProcessRunner.js'

export interface UseAsyncSessionOptions {
  runner: ProcessRunner
  /** Call cleanup() on component unmount. Default: true. */
  autoCleanup?: boolean
}

export function useAsyncSession(options: UseAsyncSessionOptions): {
  status: SessionStatus
  events: SessionEvent[]
  output: SessionEvent[]
  start: (command: string) => void
  sendInput: (data: string) => void
  cancel: () => void
  isRunning: boolean
  isComplete: boolean
  isError: boolean
  lastEvent: SessionEvent | null
} {
  const { runner, autoCleanup = true } = options

  const runnerRef = useRef<AsyncSessionRunner | null>(null)
  if (!runnerRef.current) {
    runnerRef.current = new AsyncSessionRunner({ runner })
  }

  const [status, setStatus] = useState<SessionStatus>('idle')
  const [events, setEvents] = useState<SessionEvent[]>([])
  const [output, setOutput] = useState<SessionEvent[]>([])

  const lifecycle: SessionLifecycle = useMemo(
    () => ({
      onStatusChange(newStatus: SessionStatus) {
        setStatus(newStatus)
      },
      onEvent(event: SessionEvent) {
        setEvents((prev) => [...prev, event])
        if (event.type === 'stdout' || event.type === 'stderr') {
          setOutput((prev) => [...prev, event])
        }
      },
      onExit() {},
    }),
    [],
  )

  const start = useCallback(
    (command: string) => {
      setEvents([])
      setOutput([])
      runnerRef.current!.start(command, undefined, lifecycle)
    },
    [lifecycle],
  )

  const sendInput = useCallback((data: string) => {
    runnerRef.current!.sendInput(data)
  }, [])

  const cancel = useCallback(() => {
    runnerRef.current!.cancel()
  }, [])

  useEffect(() => {
    if (!autoCleanup) return
    return () => {
      runnerRef.current?.cleanup()
    }
  }, [autoCleanup])

  const isRunning = status === 'starting' || status === 'running'
  const isComplete = status === 'complete'
  const isError = status === 'error'
  const lastEvent = events.length > 0 ? events[events.length - 1] : null

  return {
    status,
    events,
    output,
    start,
    sendInput,
    cancel,
    isRunning,
    isComplete,
    isError,
    lastEvent,
  }
}
