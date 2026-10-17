import type { SessionType } from '@cadence/core'

export async function askForNotifications() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return
  try {
    await Notification.requestPermission()
  } catch {
    // Permission prompts can fail in embedded browsers. The timer still runs.
  }
}

export function notifySessionEnded(type: SessionType) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const body = type === 'focus' ? 'Focus session complete.' : 'Break complete.'
  new Notification('Cadence', { body })
}

export function playChime() {
  const Context = window.AudioContext
  if (!Context) return
  const audio = new Context()
  const tone = audio.createOscillator()
  const gain = audio.createGain()
  tone.frequency.value = 880
  gain.gain.setValueAtTime(0.04, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35)
  tone.connect(gain)
  gain.connect(audio.destination)
  tone.start()
  tone.stop(audio.currentTime + 0.35)
  tone.onended = () => void audio.close()
}
