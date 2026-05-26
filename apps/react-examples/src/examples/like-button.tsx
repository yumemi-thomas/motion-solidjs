import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'like-button',
  title: 'Fancy like button',
  category: 'showcase',
  description: 'A heart pops, particles burst, and the count slides up.',
  tag: 'micro',
} as const

const particleAngles = [-60, -30, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270]

export default function LikeButton() {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(128)

  const toggle = () => {
    setLiked((v) => !v)
    setCount((c) => c + (liked ? -1 : 1))
  }

  return (
    <button
      onClick={toggle}
      className="relative flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
    >
      <span className="relative grid place-items-center">
        <motion.span
          animate={liked ? { scale: [1, 0.7, 1.4, 1], rotate: [0, 0, -10, 0] } : { scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={liked ? 'text-pink-500' : 'text-fg-dim'}
        >
          ♥
        </motion.span>
        <AnimatePresence>
          {liked ? (
            <span className="pointer-events-none absolute inset-0">
              {particleAngles.map((angle) => (
                <motion.span
                  key={angle}
                  className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-400"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos((angle * Math.PI) / 180) * 22,
                    y: Math.sin((angle * Math.PI) / 180) * 22,
                    opacity: 0,
                    scale: 0.3,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              ))}
            </span>
          ) : null}
        </AnimatePresence>
      </span>
      <span className="font-mono tabular-nums">{count}</span>
    </button>
  )
}
