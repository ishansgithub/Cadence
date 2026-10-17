export function todayInTimeZone(timeZone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  if (!year || !month || !day) {
    throw new Error(`Could not resolve a calendar date in ${timeZone}`)
  }
  return `${year}-${month}-${day}`
}

export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  utc.setUTCDate(utc.getUTCDate() + days)
  const nextYear = utc.getUTCFullYear()
  const nextMonth = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const nextDay = String(utc.getUTCDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

export function calendarDateInTimeZone(timeZone: string, isoTimestamp: string): string {
  return todayInTimeZone(timeZone, new Date(isoTimestamp))
}

export function zonedDayBounds(timeZone: string, now: Date): { from: string; to: string } {
  const today = todayInTimeZone(timeZone, now)
  return {
    from: zonedMidnight(timeZone, today).toISOString(),
    to: zonedMidnight(timeZone, addCalendarDays(today, 1)).toISOString(),
  }
}

function zonedMidnight(timeZone: string, isoDate: string): Date {
  const utcGuess = new Date(`${isoDate}T00:00:00.000Z`)
  const first = new Date(utcGuess.getTime() - timeZoneOffsetMs(timeZone, utcGuess))
  return new Date(utcGuess.getTime() - timeZoneOffsetMs(timeZone, first))
}

function timeZoneOffsetMs(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? '0')
  let hour = read('hour')
  if (hour === 24) hour = 0
  const asUtc = Date.UTC(read('year'), read('month') - 1, read('day'), hour, read('minute'), read('second'))
  return asUtc - date.getTime()
}
