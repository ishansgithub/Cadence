export const goalKeys = {
  all: ['goals'] as const,
}

export const taskKeys = {
  all: ['tasks'] as const,
}

export const sessionKeys = {
  all: ['sessions'] as const,
  active: ['sessions', 'active'] as const,
  range: (from: string, to: string) => ['sessions', 'range', from, to] as const,
}
