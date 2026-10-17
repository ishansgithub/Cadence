import type { Session, Settings } from './types'

type Timed = Pick<Session, 'planned_min' | 'started_at'>

export function remainingSeconds(session: Timed, now: Date): number {
  const elapsedSeconds = (now.getTime() - new Date(session.started_at).getTime()) / 1000
  return Math.floor(session.planned_min * 60 - elapsedSeconds)
}

export function isExpired(session: Timed, now: Date): boolean {
  return remainingSeconds(session, now) <= 0
}

export function autoCompleteEnd(session: Timed): string {
  return new Date(new Date(session.started_at).getTime() + session.planned_min * 60_000).toISOString()
}

export function nextSessionType(
  completedFocusCount: number,
  settings: Pick<Settings, 'sessions_before_long_break'>,
): 'short_break' | 'long_break' {
  const every = settings.sessions_before_long_break
  if (every > 0 && completedFocusCount > 0 && completedFocusCount % every === 0) return 'long_break'
  return 'short_break'
}

export function formatCountdown(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const minutes = Math.floor(clamped / 60)
  const rest = clamped % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export function focusMinutesForTask(sessions: Session[], taskId: string, now: Date): number {
  let elapsedMs = 0
  for (const session of sessions) {
    if (session.type !== 'focus' || session.task_id !== taskId) continue
    const end = session.ended_at ? new Date(session.ended_at).getTime() : now.getTime()
    elapsedMs += Math.max(0, end - new Date(session.started_at).getTime())
  }
  return elapsedMs / 60_000
}

export function completedFocusCount(sessions: Session[]): number {
  return sessions.filter((session) => session.type === 'focus' && session.ended_at !== null && !session.interrupted)
    .length
}
