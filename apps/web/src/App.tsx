import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { GoalsPage } from './features/goals/GoalsPage'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { LandingPage } from './features/landing/LandingPage'
import { ReportsPage } from './features/reports/ReportsPage'
import { AuthenticatedLayout } from './features/session/AuthenticatedLayout'
import { SettingsPage } from './features/settings/SettingsPage'
import { TasksPage } from './features/tasks/TasksPage'
import { FocusTimerPage } from './features/timer/FocusTimerPage'
import { TodayPage } from './features/today/TodayPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/focus" element={<FocusTimerPage />} />
          <Route element={<AppShell />}>
            <Route path="/today" element={<TodayPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
