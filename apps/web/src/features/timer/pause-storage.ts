import type { PauseClock } from '@cadence/core'

const keyFor = (sessionId: string) => `cadence:timer-pause:${sessionId}`

export function readPause(sessionId: string): PauseClock {
  try {
    const raw = localStorage.getItem(keyFor(sessionId))
    if (!raw) return { pausedMs: 0, pausedAt: null }
    const parsed = JSON.parse(raw) as PauseClock
    return {
      pausedMs: typeof parsed.pausedMs === 'number' ? parsed.pausedMs : 0,
      pausedAt: typeof parsed.pausedAt === 'string' ? parsed.pausedAt : null,
    }
  } catch {
    return { pausedMs: 0, pausedAt: null }
  }
}

export function writePause(sessionId: string, pause: PauseClock) {
  localStorage.setItem(keyFor(sessionId), JSON.stringify(pause))
}

export function clearPause(sessionId: string) {
  localStorage.removeItem(keyFor(sessionId))
}
