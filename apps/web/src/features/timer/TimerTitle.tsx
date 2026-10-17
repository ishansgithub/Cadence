import { appName, formatCountdown, remainingSeconds } from '@cadence/core'
import { useEffect } from 'react'
import { useTimer } from './useTimer'

export function TimerTitle() {
  const { active, now } = useTimer()

  useEffect(() => {
    return () => {
      document.title = appName
    }
  }, [])

  useEffect(() => {
    document.title = active ? `${formatCountdown(remainingSeconds(active, now))} · ${appName}` : appName
  }, [active, now])

  return null
}
