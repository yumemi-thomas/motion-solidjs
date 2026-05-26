import type { Edge, Intersection, ProgressIntersection } from '@/types'

type ReadonlyProgressIntersection = readonly [number, number]
type ScrollOffsetItem = Edge | Intersection | ProgressIntersection | ReadonlyProgressIntersection
type ScrollOffsetType = ReadonlyArray<ScrollOffsetItem>

/**
 * Preset scroll offsets matching framer-motion's ScrollOffset presets.
 * Use with createScroll's offset option to define scroll-linked animation ranges.
 *
 * @example
 * createScroll({ target: el, offset: ScrollOffset.Enter })
 */
export const ScrollOffset = {
  /** Progress 0→1 as target enters the container */
  Enter: [
    [0, 1],
    [1, 1],
  ] as const,
  /** Progress 0→1 as target exits the container */
  Exit: [
    [0, 0],
    [1, 0],
  ] as const,
  /** Progress 0→1 across any overlap between target and container */
  Any: [
    [1, 0],
    [0, 1],
  ] as const,
  /** Progress 0→1 while target is fully contained within the container */
  All: [
    [0, 0],
    [1, 1],
  ] as const,
}

export type ScrollOffset = ScrollOffsetType

type NormalisedOffset = [[number, number], [number, number]]

const presets: [readonly (readonly [number, number])[], string][] = [
  [ScrollOffset.Enter, 'entry'],
  [ScrollOffset.Exit, 'exit'],
  [ScrollOffset.Any, 'cover'],
  [ScrollOffset.All, 'contain'],
]

const stringToProgress: Record<string, number> = {
  start: 0,
  end: 1,
}

function parseStringOffset(s: string): [number, number] | undefined {
  const parts = s.trim().split(/\s+/)
  if (parts.length !== 2) return undefined
  const a = stringToProgress[parts[0]]
  const b = stringToProgress[parts[1]]
  if (a === undefined || b === undefined) return undefined
  return [a, b]
}

function normaliseOffset(offset: ScrollOffsetType): NormalisedOffset | undefined {
  if (offset.length !== 2) return undefined

  const first = offset[0]
  const second = offset[1]

  let firstNormalised: [number, number] | undefined
  let secondNormalised: [number, number] | undefined

  if (Array.isArray(first)) {
    if (first.length !== 2 || typeof first[0] !== 'number' || typeof first[1] !== 'number') {
      return undefined
    }

    firstNormalised = [first[0], first[1]]
  } else if (typeof first === 'string') {
    firstNormalised = parseStringOffset(first)
    if (!firstNormalised) return undefined
  } else {
    return undefined
  }

  if (Array.isArray(second)) {
    if (second.length !== 2 || typeof second[0] !== 'number' || typeof second[1] !== 'number') {
      return undefined
    }

    secondNormalised = [second[0], second[1]]
  } else if (typeof second === 'string') {
    secondNormalised = parseStringOffset(second)
    if (!secondNormalised) return undefined
  } else {
    return undefined
  }

  return [firstNormalised, secondNormalised]
}

function matchesPreset(
  offset: ScrollOffsetType,
  preset: readonly (readonly [number, number])[],
): boolean {
  const normalised = normaliseOffset(offset)
  if (!normalised) return false
  for (let i = 0; i < 2; i++) {
    const o = normalised[i]
    const p = preset[i]
    if (o[0] !== p[0] || o[1] !== p[1]) return false
  }
  return true
}

/**
 * Maps a ScrollOffset array to a ViewTimeline named range.
 * Returns undefined for unrecognised patterns — signals fallback to JS scroll tracking.
 *
 * Ported from framer-motion's internal render/dom/scroll/utils/offset-to-range.mjs
 */
export function offsetToViewTimelineRange(
  offset: ScrollOffsetType | undefined,
): { rangeStart: string; rangeEnd: string } | undefined {
  if (!offset) {
    return { rangeStart: 'contain 0%', rangeEnd: 'contain 100%' }
  }
  for (const [preset, name] of presets) {
    if (matchesPreset(offset, preset)) {
      return { rangeStart: `${name} 0%`, rangeEnd: `${name} 100%` }
    }
  }
  return undefined
}
