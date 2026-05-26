import { motion } from 'motion/react'

export const meta = {
  slug: 'svg-path-shapes',
  title: 'SVG path — draw shapes',
  category: 'svg',
  description: 'A grid of shapes drawn in with staggered pathLength + opacity.',
  tag: 'pathLength',
} as const

const initial = { pathLength: 0 }
const animate = { pathLength: 1 }

type Shape =
  | { kind: 'circle'; cx: number; cy: number; r: number; stroke: string; delay: number }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; delay: number }
  | {
      kind: 'rect'
      x: number
      y: number
      w: number
      h: number
      rx: number
      stroke: string
      delay: number
    }

const shapes: Shape[] = [
  { kind: 'circle', cx: 100, cy: 100, r: 80, stroke: '#ff0088', delay: 0.25 },
  { kind: 'line', x1: 220, y1: 30, x2: 360, y2: 170, stroke: '#8df0cc', delay: 0.5 },
  { kind: 'line', x1: 220, y1: 170, x2: 360, y2: 30, stroke: '#8df0cc', delay: 0.625 },
  { kind: 'rect', x: 410, y: 30, w: 140, h: 140, rx: 20, stroke: '#0d63f8', delay: 0.75 },
  { kind: 'circle', cx: 100, cy: 300, r: 80, stroke: '#0d63f8', delay: 0.5 },
  { kind: 'line', x1: 220, y1: 230, x2: 360, y2: 370, stroke: '#ff0088', delay: 0.75 },
  { kind: 'line', x1: 220, y1: 370, x2: 360, y2: 230, stroke: '#ff0088', delay: 0.875 },
  { kind: 'rect', x: 410, y: 230, w: 140, h: 140, rx: 20, stroke: '#8df0cc', delay: 1 },
  { kind: 'circle', cx: 100, cy: 500, r: 80, stroke: '#8df0cc', delay: 0.75 },
  { kind: 'line', x1: 220, y1: 430, x2: 360, y2: 570, stroke: '#0d63f8', delay: 1 },
  { kind: 'line', x1: 220, y1: 570, x2: 360, y2: 430, stroke: '#0d63f8', delay: 1.125 },
  { kind: 'rect', x: 410, y: 430, w: 140, h: 140, rx: 20, stroke: '#ff0088', delay: 1.25 },
]

export default function SvgPathShapes() {
  return (
    <svg viewBox="0 0 600 600" className="h-64 w-64">
      {shapes.map((s, i) => {
        const transition = { delay: s.delay, duration: 1.2, ease: 'easeInOut' as const }
        if (s.kind === 'circle') {
          return (
            <motion.circle
              key={i}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              stroke={s.stroke}
              initial={initial}
              animate={animate}
              transition={transition}
              strokeWidth="10"
              strokeLinecap="round"
              fill="transparent"
            />
          )
        }
        if (s.kind === 'line') {
          return (
            <motion.line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={s.stroke}
              initial={initial}
              animate={animate}
              transition={transition}
              strokeWidth="10"
              strokeLinecap="round"
              fill="transparent"
            />
          )
        }
        return (
          <motion.rect
            key={i}
            x={s.x}
            y={s.y}
            width={s.w}
            height={s.h}
            stroke={s.stroke}
            initial={{ pathLength: 0, rx: s.rx }}
            animate={{ pathLength: 1, rx: s.rx }}
            transition={transition}
            strokeWidth="10"
            strokeLinecap="round"
            fill="transparent"
          />
        )
      })}
    </svg>
  )
}
