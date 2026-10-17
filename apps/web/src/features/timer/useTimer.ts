import { useContext } from 'react'
import { TimerContext, type TimerContextValue } from './timer-context'

export function useTimer(): TimerContextValue {
  const value = useContext(TimerContext)
  if (!value) throw new Error('useTimer must be used within TimerProvider')
  return value
}
