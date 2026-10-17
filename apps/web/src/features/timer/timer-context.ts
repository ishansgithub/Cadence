import type { Session } from '@cadence/core'
import { createContext } from 'react'

export const interruptReasons = ['Distracted', 'Urgent task', 'Break needed', 'Other'] as const

export type TimerContextValue = {
  active: Session | null
  now: Date
  todaySessions: Session[]
  loading: boolean
  promptTaskId: string | null
  startFocus: (taskId: string | null) => Promise<void>
  stopFocus: (reason: string) => Promise<void>
  skipBreak: () => Promise<void>
  dismissPrompt: () => void
}

export const TimerContext = createContext<TimerContextValue | null>(null)
