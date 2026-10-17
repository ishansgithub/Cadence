import { addCalendarDays } from './dates'

export type QuickAdd = {
  title: string
  goalQuery: string | null
  estimateMin: number | null
  dueDate: string | null
}

const estimatePattern = /~(\d+(?:\.\d+)?)h(?:(\d+)m)?|~(\d+)m/gi
const duePattern = /!(today|tomorrow|\d{4}-\d{2}-\d{2})\b/gi
const goalPattern = /#([^\s#]+)/g

export function parseQuickAdd(input: string, today: string): QuickAdd {
  let goalQuery: string | null = null
  let estimateMin: number | null = null
  let dueDate: string | null = null

  for (const match of input.matchAll(goalPattern)) {
    goalQuery = match[1] ?? null
  }
  for (const match of input.matchAll(estimatePattern)) {
    estimateMin = minutesFromEstimate(match)
  }
  for (const match of input.matchAll(duePattern)) {
    dueDate = dateFromToken(match[1] ?? '', today)
  }

  const title = input
    .replace(goalPattern, ' ')
    .replace(estimatePattern, ' ')
    .replace(duePattern, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return { title, goalQuery, estimateMin, dueDate }
}

export type GoalMatch = { id: string; title: string }

export function matchGoal(goals: GoalMatch[], query: string): GoalMatch | 'none' | 'ambiguous' {
  const needle = query.trim().toLowerCase()
  if (!needle) return 'none'

  const exact = goals.filter((goal) => goal.title.toLowerCase() === needle)
  if (exact.length === 1) return exact[0]
  if (exact.length > 1) return 'ambiguous'

  const starts = goals.filter((goal) => goal.title.toLowerCase().startsWith(needle))
  if (starts.length === 1) return starts[0]
  if (starts.length > 1) return 'ambiguous'

  const includes = goals.filter((goal) => goal.title.toLowerCase().includes(needle))
  if (includes.length === 1) return includes[0]
  if (includes.length > 1) return 'ambiguous'
  return 'none'
}

function minutesFromEstimate(match: RegExpMatchArray): number {
  if (match[3]) return Number(match[3])
  const hours = Number(match[1])
  const minutes = match[2] ? Number(match[2]) : 0
  return Math.round(hours * 60 + minutes)
}

function dateFromToken(token: string, today: string): string | null {
  if (token === 'today') return today
  if (token === 'tomorrow') return addCalendarDays(today, 1)
  if (/^\d{4}-\d{2}-\d{2}$/.test(token)) return token
  return null
}
