import type { Goal, Task } from './types'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatGoalTarget(goal: Pick<Goal, 'target_type' | 'target_value' | 'deadline'>): string | null {
  if (goal.target_type === 'hours_per_week' && goal.target_value !== null) {
    return `${formatHours(goal.target_value)} h/week`
  }
  if (goal.target_type === 'total_hours' && goal.target_value !== null) {
    return `${formatHours(goal.target_value)} h total`
  }
  if (goal.target_type === 'deadline' && goal.deadline) {
    const [, month, day] = goal.deadline.split('-').map(Number)
    return `due ${months[month - 1]} ${day}`
  }
  return null
}

export function countTasksForGoal(tasks: Task[], goalId: string): { open: number; done: number } {
  let open = 0
  let done = 0
  for (const task of tasks) {
    if (task.goal_id !== goalId || task.status === 'archived') continue
    if (task.status === 'done') done += 1
    else open += 1
  }
  return { open, done }
}

function formatHours(value: number): string {
  return String(value)
}
