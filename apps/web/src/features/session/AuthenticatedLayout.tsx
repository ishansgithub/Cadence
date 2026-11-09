import { Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { SettingsProvider } from '../settings/SettingsProvider'
import { TimerProvider } from '../timer/TimerProvider'
import { TimerTitle } from '../timer/TimerTitle'

export function AuthenticatedLayout() {
  const { user } = useAuth()

  return (
    <SettingsProvider key={user?.id}>
      <TimerProvider>
        <TimerTitle />
        <Outlet />
      </TimerProvider>
    </SettingsProvider>
  )
}
