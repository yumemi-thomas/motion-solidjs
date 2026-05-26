import { AnimatePresence, motion, wrap } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'animate-presence-slides',
  title: 'AnimatePresence — slide carousel',
  category: 'animate-presence',
  description: 'Arrow buttons slide a card; exit direction depends on the press.',
  tag: 'popLayout',
} as const

const colors = ['#ff5d9e', '#ffd166', '#36e0c5', '#7c5cff', '#ff8b3d', '#0cdcf7']

export default function AnimatePresenceSlides() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  const slide = (delta: 1 | -1) => {
    setDirection(delta)
    setIndex((i) => wrap(0, colors.length, i + delta))
  }

  const color = colors[index]
  const enterFrom = direction * 60
  const exitTo = direction * -60

  return (
    <div className="flex items-center gap-4">
      <button
        aria-label="Previous"
        onClick={() => slide(-1)}
        className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-fg-muted hover:text-fg"
      >
        ←
      </button>
      <div className="relative grid h-24 w-24 place-items-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={color}
            className="absolute h-24 w-24 rounded-2xl"
            initial={{ opacity: 0, x: enterFrom }}
            animate={{
              opacity: 1,
              x: 0,
              transition: {
                delay: 0.1,
                type: 'spring',
                stiffness: 320,
                damping: 26,
              },
            }}
            exit={{ opacity: 0, x: exitTo }}
            style={{ backgroundColor: color }}
          />
        </AnimatePresence>
      </div>
      <button
        aria-label="Next"
        onClick={() => slide(1)}
        className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-fg-muted hover:text-fg"
      >
        →
      </button>
    </div>
  )
}
