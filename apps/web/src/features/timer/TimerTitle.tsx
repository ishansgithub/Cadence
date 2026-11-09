import { appName, formatCountdown, remainingSeconds } from '@cadence/core'
import { useEffect, useRef } from 'react'
import { useTimer } from './useTimer'

export function TimerTitle() {
  const { active, now, pause, loading } = useTimer()
  const lastTitle = useRef(appName)

  useEffect(() => {
    return () => {
      document.title = appName
    }
  }, [])

  useEffect(() => {
    if (loading && !active) {
      document.title = lastTitle.current
      return
    }
    if (!active) {
      lastTitle.current = appName
      document.title = appName
      return
    }
    const next = `${formatCountdown(Math.max(0, remainingSeconds(active, now, pause)))} · ${appName}`
    lastTitle.current = next
    document.title = next
  }, [active, loading, now, pause])

  return null
}
