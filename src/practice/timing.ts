/** Options for a timed drill, carried in the route query so a run can be shared or repeated. */
export type SprintSeconds = 60 | 120 | 300
export type ShotSeconds = 0 | 10 | 20 | 30 | 60
export interface TimedOptions {
  /** Endless problems until this many seconds pass; undefined means the usual ten. */
  sprint: SprintSeconds | undefined
  /** Seconds allowed per problem; 0 is no shot clock. */
  shot: ShotSeconds
}
export type BestKey = 'clean10' | 'sprint60' | 'sprint120' | 'sprint300'

export const SPRINTS: SprintSeconds[] = [60, 120, 300]
export const SHOTS: ShotSeconds[] = [0, 10, 20, 30, 60]

type Query = Record<string, unknown>

/** Null when the query asks for an ordinary run. `timed=1` is the older stopwatch-only flag. */
export function parseTimed(query: Query): TimedOptions | null {
  const len = query.len === undefined ? undefined : String(query.len)
  const shotRaw = query.shot === undefined ? undefined : Number(query.shot)
  const sprint =
    len === undefined
      ? undefined
      : len === '1m'
        ? 60
        : len === '2m'
          ? 120
          : len === '5m'
            ? 300
            : null
  const shot =
    shotRaw === undefined
      ? 0
      : SHOTS.includes(shotRaw as ShotSeconds)
        ? (shotRaw as ShotSeconds)
        : null
  if (sprint === null || shot === null) return null
  if (sprint === undefined && shot === 0) return query.timed === '1' ? { sprint, shot } : null
  return { sprint, shot }
}

export function timedQuery(opts: TimedOptions): Record<string, string> {
  const q: Record<string, string> = {}
  if (opts.sprint) q.len = `${opts.sprint / 60}m`
  if (opts.shot) q.shot = String(opts.shot)
  if (!opts.sprint && !opts.shot) q.timed = '1'
  return q
}

export function bestKey(opts: TimedOptions): BestKey {
  return opts.sprint ? (`sprint${opts.sprint}` as BestKey) : 'clean10'
}

/** The new best value when this result beats the old one, otherwise undefined. */
export function improves(
  key: BestKey,
  prev: number | undefined,
  r: { correct: number; total: number; seconds: number },
): number | undefined {
  if (key === 'clean10') {
    if (r.total === 0 || r.correct !== r.total) return undefined
    return prev === undefined || r.seconds < prev ? r.seconds : undefined
  }
  return prev === undefined || r.correct > prev ? r.correct : undefined
}

export function describeTimed(opts: TimedOptions): string {
  const parts = [opts.sprint ? `${opts.sprint / 60} min sprint` : '10 problems']
  if (opts.shot) parts.push(`${opts.shot} s per problem`)
  return parts.join(' · ')
}

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** "0:42 clean ten" or "17 in 2 min" */
export function describeBest(key: BestKey, value: number): string {
  if (key === 'clean10') return `${clock(value)} clean ten`
  return `${value} in ${Number(key.slice(6)) / 60} min`
}
