import { appName } from '@cadence/core'

export function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <h1 className="p-8 text-3xl font-semibold">{appName}</h1>
    </main>
  )
}
