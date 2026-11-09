import type { Session, SessionType, Settings } from './types'

type Timed = Pick<Session, 'planned_min' | 'started_at'>

/** Client-side pause clock; persisted locally so refresh/sleep keep the remaining time stable. */
export type PauseClock = {
  pausedMs: number
  pausedAt: string | null
}

export function remainingSeconds(session: Timed, now: Date, pause?: PauseClock | null): number {
  let pausedMs = pause?.pausedMs ?? 0
  if (pause?.pausedAt) {
    pausedMs += Math.max(0, now.getTime() - new Date(pause.pausedAt).getTime())
  }
  const elapsedSeconds = (now.getTime() - new Date(session.started_at).getTime() - pausedMs) / 1000
  return Math.floor(session.planned_min * 60 - elapsedSeconds)
}

export function isExpired(session: Timed, now: Date, pause?: PauseClock | null): boolean {
  if (pause?.pausedAt) return false
  return remainingSeconds(session, now, pause) <= 0
}

export function autoCompleteEnd(session: Timed, pause?: PauseClock | null): string {
  const pausedMs = pause?.pausedMs ?? 0
  return new Date(new Date(session.started_at).getTime() + session.planned_min * 60_000 + pausedMs).toISOString()
}

export function nextSessionType(
  completedFocusCount: number,
  settings: Pick<Settings, 'sessions_before_long_break'>,
): 'short_break' | 'long_break' {
  const every = settings.sessions_before_long_break
  if (every > 0 && completedFocusCount > 0 && completedFocusCount % every === 0) return 'long_break'
  return 'short_break'
}

/** Filled dots in the cycle toward the next long break. */
export function cycleProgress(
  completedFocusCount: number,
  sessionsBeforeLongBreak: number,
  activeType?: SessionType | null,
): { filled: number; total: number } {
  const every = sessionsBeforeLongBreak
  if (every <= 0) return { filled: 0, total: 0 }
  const rem = completedFocusCount % every
  if (rem === 0 && completedFocusCount > 0 && activeType === 'long_break') {
    return { filled: every, total: every }
  }
  return { filled: rem, total: every }
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

export function focusMinutesToday(sessions: Session[], now: Date): number {
  let elapsedMs = 0
  for (const session of sessions) {
    if (session.type !== 'focus') continue
    const end = session.ended_at ? new Date(session.ended_at).getTime() : now.getTime()
    elapsedMs += Math.max(0, end - new Date(session.started_at).getTime())
  }
  return elapsedMs / 60_000
}

export function completedFocusCount(sessions: Session[]): number {
  return sessions.filter((session) => session.type === 'focus' && session.ended_at !== null && !session.interrupted)
    .length
}

export function applyPause(pause: PauseClock, now: Date): PauseClock {
  if (pause.pausedAt) return pause
  return { ...pause, pausedAt: now.toISOString() }
}

export function applyResume(pause: PauseClock, now: Date): PauseClock {
  if (!pause.pausedAt) return pause
  const extra = Math.max(0, now.getTime() - new Date(pause.pausedAt).getTime())
  return { pausedMs: pause.pausedMs + extra, pausedAt: null }
}
