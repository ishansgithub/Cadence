import {
  completedFocusCount,
  isExpired,
  nextSessionType,
  remainingSeconds,
  zonedDayBounds,
  type Session,
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

  const active = activeQuery.data ?? null
  const activeRef = useRef(active)
  const settingsRef = useRef(settings)
  const rangeRef = useRef(rangeQuery.data)
  const previousRemaining = useRef<number | null>(null)
  const trackedSessionId = useRef<string | null>(null)
  const finishing = useRef<string | null>(null)
  const lastFinishError = useRef(0)

  useEffect(() => {
    activeRef.current = active
    settingsRef.current = settings
    rangeRef.current = rangeQuery.data
  }, [active, rangeQuery.data, settings])

  const finishOnTime = useCallback(
    async (session: Session, currentSettings: Settings, alert: boolean) => {
      if (finishing.current === session.id) return
      if (Date.now() - lastFinishError.current < 5000) return
      finishing.current = session.id
      try {
        const closed = await completeSession.mutateAsync(session.id)
        if (!closed) return
        if (alert) {
          playChime()
          notifySessionEnded(session.type)
        }
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
    if (!current || !currentSettings) return
    if (!isExpired(current, new Date())) return
    void finishOnTime(current, currentSettings, false)
  }, [active, finishOnTime])

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = activeRef.current
      const currentSettings = settingsRef.current
      if (!current || !currentSettings) return
      const seconds = remainingSeconds(current, new Date())
      if (trackedSessionId.current !== current.id) {
        trackedSessionId.current = current.id
        previousRemaining.current = seconds
        return
      }
      const crossedZero = previousRemaining.current !== null && previousRemaining.current > 0 && seconds <= 0
      previousRemaining.current = seconds
      if (seconds <= 0) void finishOnTime(current, currentSettings, crossedZero)
    }, 250)
    return () => window.clearInterval(id)
  }, [finishOnTime])

  async function startFocus(taskId: string | null) {
    if (!settings) return
    await askForNotifications()
    await startSession.mutateAsync({
      type: 'focus',
      planned_min: settings.focus_min,
      task_id: taskId,
    })
    previousRemaining.current = null
    finishing.current = null
  }

  async function stopFocus(reason: string) {
    if (!active) return
    await stopSession.mutateAsync({ id: active.id, interrupted: true, reason })
  }

  async function skipBreak() {
    if (!active) return
    await stopSession.mutateAsync({ id: active.id, interrupted: false, reason: null })
  }

  return (
    <TimerContext.Provider
      value={{
        active,
        now,
        todaySessions: rangeQuery.data ?? [],
        loading: activeQuery.isPending,
        promptTaskId,
        startFocus,
        stopFocus,
        skipBreak,
        dismissPrompt: () => setPromptTaskId(null),
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}
