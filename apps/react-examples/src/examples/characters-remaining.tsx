import { motion, useMotionTemplate, useSpring, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'

export const meta = {
  slug: 'characters-remaining',
  title: 'Characters remaining',
  category: 'showcase',
  description: 'A circle ring shrinks toward the limit, color warms past 80%.',
  tag: 'progress',
} as const

const LIMIT = 60

export default function CharactersRemaining() {
  const [text, setText] = useState('')
  const ringRatio = useSpring(0, { stiffness: 200, damping: 24 })

  useEffect(() => {
    ringRatio.set(Math.min(1, text.length / LIMIT))
  }, [text, ringRatio])

  const dash = useTransform(ringRatio, [0, 1], [0, 88])
  const color = useTransform(
    ringRatio,
    [0, 0.6, 0.85, 1],
    ['#36e0c5', '#ffd166', '#ff8a5b', '#ff4d8d'],
  )
  const strokeStyle = useMotionTemplate`${dash} 88`

  return (
    <div className="flex w-64 flex-col items-center gap-3">
      <input
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        maxLength={LIMIT}
        placeholder="Type something..."
        className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-fg-dim"
      />
      <div className="relative grid h-14 w-14 place-items-center">
        <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#23232f" strokeWidth="3" />
          <motion.circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ stroke: color, strokeDasharray: strokeStyle }}
          />
        </svg>
        <span className="font-mono text-xs tabular-nums">{LIMIT - text.length}</span>
      </div>
    </div>
  )
}
