import {
  applyPause,
  applyResume,
  completedFocusCount,
  isExpired,
  nextSessionType,
  remainingSeconds,
  zonedDayBounds,
  type PauseClock,
  type Session,
  type SessionType,
  type Settings,
} from '@cadence/core'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { getSupabase } from '../../lib/supabase'
import { sessionKeys } from '../../data/query-keys'
import {
  useActiveSession,
  useCompleteSession,
  useSessionRange,
  useStartSession,
  useStopSession,
} from '../../data/use-sessions'
import { useAuth } from '../auth/useAuth'
import { useSettings } from '../settings/useSettings'
import { askForNotifications, notifySessionEnded, playChime } from './feedback'
import { clearPause, readPause, writePause } from './pause-storage'
import { TimerContext } from './timer-context'

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { settings } = useSettings()
  const queryClient = useQueryClient()
  const activeQuery = useActiveSession()
  const [now, setNow] = useState(() => new Date())
  const bounds = settings ? zonedDayBounds(settings.timezone, now) : null
  const rangeQuery = useSessionRange(bounds?.from ?? null, bounds?.to ?? null)
  const startSession = useStartSession()
  const stopSession = useStopSession()
  const completeSession = useCompleteSession()
  const [promptTaskId, setPromptTaskId] = useState<string | null>(null)
  const [completedMoment, setCompletedMoment] = useState<SessionType | null>(null)
  const [pause, setPause] = useState<PauseClock | null>(null)

  const active = activeQuery.data ?? null
  const activeRef = useRef(active)
  const settingsRef = useRef(settings)
  const rangeRef = useRef(rangeQuery.data)
  const pauseRef = useRef(pause)
  const previousRemaining = useRef<number | null>(null)
  const trackedSessionId = useRef<string | null>(null)
  const finishing = useRef<string | null>(null)
  const lastFinishError = useRef(0)

  useEffect(() => {
    activeRef.current = active
    settingsRef.current = settings
    rangeRef.current = rangeQuery.data
    pauseRef.current = pause
  }, [active, pause, rangeQuery.data, settings])

  useEffect(() => {
    if (!active) {
      setPause(null)
      return
    }
    setPause(readPause(active.id))
  }, [active?.id])

  const persistPause = useCallback((sessionId: string, next: PauseClock) => {
    setPause(next)
    writePause(sessionId, next)
  }, [])

  const finishOnTime = useCallback(
    async (session: Session, currentSettings: Settings, alert: boolean) => {
      if (finishing.current === session.id) return
      if (Date.now() - lastFinishError.current < 5000) return
      finishing.current = session.id
      try {
        const closed = await completeSession.mutateAsync(session.id)
        if (!closed) return
        clearPause(session.id)
        setPause(null)
        setCompletedMoment(session.type)
        if (alert && currentSettings.sound_enabled) playChime()
        if (alert && currentSettings.notifications_enabled) notifySessionEnded(session.type)
        if (session.type !== 'focus') return
        const others = (rangeRef.current ?? []).filter((item) => item.id !== closed.id)
        const next = nextSessionType(completedFocusCount([...others, closed]), currentSettings)
        await startSession.mutateAsync({
          type: next,
          planned_min: next === 'long_break' ? currentSettings.long_break_min : currentSettings.short_break_min,
          task_id: null,
        })
        if (session.task_id) setPromptTaskId(session.task_id)
      } catch {
        finishing.current = null
        lastFinishError.current = Date.now()
      }
    },
    [completeSession, startSession],
  )

  useEffect(() => {
    if (!user) return
    const supabase = getSupabase()
    const realtime = supabase
      .channel(`sessions-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `user_id=eq.${user.id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
        },
      )
      .subscribe()
    const broadcast = new BroadcastChannel('cadence-sessions')
    broadcast.onmessage = () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    }
    return () => {
      void supabase.removeChannel(realtime)
      broadcast.close()
    }
  }, [queryClient, user])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const current = activeRef.current
    const currentSettings = settingsRef.current
    const currentPause = pauseRef.current
    if (!current || !currentSettings) return
    if (!isExpired(current, new Date(), currentPause)) return
    void finishOnTime(current, currentSettings, false)
  }, [active, finishOnTime, pause])

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = activeRef.current
      const currentSettings = settingsRef.current
      const currentPause = pauseRef.current
      if (!current || !currentSettings) return
      const seconds = remainingSeconds(current, new Date(), currentPause)
      if (trackedSessionId.current !== current.id) {
        trackedSessionId.current = current.id
        previousRemaining.current = seconds
        return
      }
      const crossedZero = previousRemaining.current !== null && previousRemaining.current > 0 && seconds <= 0
      previousRemaining.current = seconds
      if (seconds <= 0 && !currentPause?.pausedAt) void finishOnTime(current, currentSettings, crossedZero)
    }, 250)
    return () => window.clearInterval(id)
  }, [finishOnTime])

  async function startMode(type: SessionType, taskId: string | null = null) {
    if (!settings) return
    if (type === 'focus' && settings.notifications_enabled) await askForNotifications()
    const planned =
      type === 'focus'
        ? settings.focus_min
        : type === 'long_break'
          ? settings.long_break_min
          : settings.short_break_min
    await startSession.mutateAsync({
      type,
      planned_min: planned,
      task_id: type === 'focus' ? taskId : null,
    })
    previousRemaining.current = null
    finishing.current = null
    setCompletedMoment(null)
  }

  async function startFocus(taskId: string | null) {
    await startMode('focus', taskId)
  }

  async function stopFocus(reason: string | null) {
    if (!active) return
    await stopSession.mutateAsync({ id: active.id, interrupted: true, reason })
    clearPause(active.id)
    setPause(null)
  }

  async function skipBreak() {
    if (!active) return
    await stopSession.mutateAsync({ id: active.id, interrupted: false, reason: null })
    clearPause(active.id)
    setPause(null)
  }

  function pauseTimer() {
    if (!active || pause?.pausedAt) return
    const next = applyPause(pause ?? { pausedMs: 0, pausedAt: null }, new Date())
    persistPause(active.id, next)
  }

  function resumeTimer() {
    if (!active || !pause?.pausedAt) return
    const next = applyResume(pause, new Date())
    persistPause(active.id, next)
  }

  return (
    <TimerContext.Provider
      value={{
        active,
        now,
        todaySessions: rangeQuery.data ?? [],
        loading: activeQuery.isPending,
        pause,
        paused: Boolean(pause?.pausedAt),
        promptTaskId,
        completedMoment,
        startFocus,
        startMode,
        stopFocus,
        skipBreak,
        pauseTimer,
        resumeTimer,
        dismissPrompt: () => setPromptTaskId(null),
        dismissCompleted: () => setCompletedMoment(null),
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}
