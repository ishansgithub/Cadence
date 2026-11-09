import type { PauseClock, Session, SessionType } from '@cadence/core'
import { createContext } from 'react'

export const interruptReasons = ['Distracted', 'Urgent task', 'Break needed', 'Other'] as const

export type TimerContextValue = {
  active: Session | null
  now: Date
  todaySessions: Session[]
  loading: boolean
  pause: PauseClock | null
  paused: boolean
  promptTaskId: string | null
  completedMoment: SessionType | null
  startFocus: (taskId: string | null) => Promise<void>
  startMode: (type: SessionType, taskId?: string | null) => Promise<void>
  stopFocus: (reason: string | null) => Promise<void>
  skipBreak: () => Promise<void>
  pauseTimer: () => void
  resumeTimer: () => void
  dismissPrompt: () => void
  dismissCompleted: () => void
}

export const TimerContext = createContext<TimerContextValue | null>(null)
