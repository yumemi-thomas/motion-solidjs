import { motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'drag-snap',
  title: 'Drag — snap to slots',
  category: 'drag',
  description: 'On drag end, snap to the nearest of three positions.',
  tag: 'snap',
} as const

const slots = [-80, 0, 80]

export default function DragSnap() {
  const [x, setX] = useState(0)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-16 w-56 items-center justify-between rounded-full border border-border bg-card px-3">
        {slots.map((s, i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-fg-dim"
            style={{ transform: `translateX(${s - slots[1]}px)` }}
          />
        ))}
        <motion.div
          drag="x"
          dragConstraints={{ left: -90, right: 90 }}
          dragElastic={0.2}
          className="absolute h-12 w-12 cursor-grab rounded-full bg-grad-rose shadow-glow active:cursor-grabbing"
          animate={{ x }}
          onDragEnd={(_, info) => {
            const final = x + info.offset.x
            const nearest = slots.reduce((a, b) =>
              Math.abs(b - final) < Math.abs(a - final) ? b : a,
            )
            setX(nearest)
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        />
      </div>
    </div>
  )
}
