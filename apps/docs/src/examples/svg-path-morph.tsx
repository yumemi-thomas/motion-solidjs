import { interpolate } from 'flubber'
import { animate, createMotionValue, createTransform } from 'motion-solidjs'
import { createEffect, createSignal, onCleanup } from 'solid-js'

export const meta = {
  slug: 'svg-path-morph',
  title: 'SVG path — morph',
  category: 'svg',
  description: 'flubber + createTransform mixer morph an icon between shapes.',
  tag: 'flubber',
} as const

const star =
  'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'
const heart =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
const hand =
  'M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z'
const plane =
  'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z'
const lightning = 'M7 2v11h3v9l7-12h-4l4-8z'
const note = 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'

const paths = [lightning, hand, plane, heart, note, star, lightning]
const colors = ['#fff312', '#ff0088', '#dd00ee', '#9911ff', '#0d63f8', '#0cdcf7', '#4ff0b7']
const inputRange = paths.map((_, i) => i)

export default function SvgPathMorph() {
  const [pathIndex, setPathIndex] = createSignal(1)
  const progress = createMotionValue(0)
  const fillMv = createTransform(progress, inputRange, colors)
  const pathMv = createTransform(progress, inputRange, paths, {
    mixer: (a: string, b: string) => interpolate(a, b, { maxSegmentLength: 0.1 }),
  })

  // motion.path d={MotionValue} isn't wired in motion-solidjs (the prop
  // stringifies to "[object Object]"), so bridge the MotionValues to Solid
  // signals and bind them to a plain <path>.
  const [d, setD] = createSignal(pathMv.get())
  const [fill, setFill] = createSignal(fillMv.get())
  createEffect(() => {
    setD(pathMv.get())
    setFill(fillMv.get())
    const unsubD = pathMv.on('change', (v) => setD(v))
    const unsubFill = fillMv.on('change', (v) => setFill(v))
    onCleanup(() => {
      unsubD()
      unsubFill()
    })
  })

  createEffect(() => {
    const target = pathIndex()
    const animation = animate(progress, target, {
      duration: 0.8,
      ease: 'easeInOut',
      onComplete: () => {
        if (target === paths.length - 1) {
          progress.set(0)
          setPathIndex(1)
        } else {
          setPathIndex(target + 1)
        }
      },
    })
    onCleanup(() => animation.stop())
  })

  return (
    <svg viewBox="0 0 24 24" class="h-48 w-48">
      <path d={d()} fill={fill()} />
    </svg>
  )
}
