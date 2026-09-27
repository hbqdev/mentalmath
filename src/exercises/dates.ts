/**
 * Chapter 9's "A Day for Any Date" method: month code + date + year code (+ century code), mod 7.
 * Weekday numbering matches JavaScript's getDay(): 0 Sunday … 6 Saturday, which is also the book's
 * (1 Monday … 6 Saturday, 0 Sunday).
 */
export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const
export type Weekday = (typeof WEEKDAYS)[number]
export const WEEKDAY_OPTIONS: Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const MONTH_CODES = [6, 2, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

export function monthCode(month: number, year: number): number {
  const base = MONTH_CODES[month - 1] ?? 0
  if (isLeapYear(year) && month <= 2) return base - 1
  return base
}

/** (yy + yy ÷ 4) mod 7, yy being the last two digits. */
export function yearCode(year: number): number {
  const yy = year % 100
  return (yy + Math.floor(yy / 4)) % 7
}

/** 2000s → 0, 2100s → 5, 2200s → 3, 2300s → 1, repeating every 400 years (1900s → 1, 1800s → 3, 1700s → 5). */
export function centuryCode(year: number): number {
  const c = Math.floor(year / 100)
  return [0, 5, 3, 1][(((c - 20) % 4) + 4) % 4] ?? 0
}

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number)
  return [y ?? 0, m ?? 1, d ?? 1]
}

export function isValidDate(iso: string): boolean {
  const [y, m, d] = parts(iso)
  if (!Number.isInteger(y) || m < 1 || m > 12 || d < 1) return false
  const dim = [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] ?? 0
  return d <= dim
}

export function dayIndex(iso: string): number {
  const [y, m, d] = parts(iso)
  return (monthCode(m, y) + d + yearCode(y) + centuryCode(y)) % 7
}

export function dayOfWeek(iso: string): Weekday {
  return WEEKDAYS[dayIndex(iso)]!
}

export function daySteps(iso: string): string[] {
  const [y, m, d] = parts(iso)
  const mc = monthCode(m, y)
  const yc = yearCode(y)
  const cc = centuryCode(y)
  const total = mc + d + yc + cc
  const steps = [
    `${MONTHS[m - 1]} code: ${mc}${isLeapYear(y) && m <= 2 ? ' (leap year, one less)' : ''}`,
    `Date: ${d}`,
    `${y} → year code: ${y % 100} + ${Math.floor((y % 100) / 4)} = ${(y % 100) + Math.floor((y % 100) / 4)} → mod 7 = ${yc}`,
  ]
  if (cc) steps.push(`${Math.floor(y / 100)}00s: add ${cc}`)
  steps.push(
    `${mc} + ${d} + ${yc}${cc ? ` + ${cc}` : ''} = ${total} → mod 7 = ${total % 7} → ${dayOfWeek(iso)}`,
  )
  return steps
}
