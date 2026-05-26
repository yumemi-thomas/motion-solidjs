import { motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'layout-list',
  title: 'Layout — list reflow',
  category: 'layout',
  description: 'Layout siblings reflow with springs when an item is removed.',
  tag: 'layout',
} as const

const seed = ['Spring', 'Tween', 'Inertia', 'Keyframes', 'Layout']

export default function LayoutList() {
  const [items, setItems] = useState(seed)
  return (
    <div className="flex w-72 flex-col gap-2">
      {items.map((item) => (
        <motion.button
          key={item}
          layout
          onClick={() => setItems((xs) => xs.filter((x) => x !== item))}
          className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-xs hover:bg-card-hover"
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          {item}
        </motion.button>
      ))}
      <button
        onClick={() => setItems(seed)}
        className="self-start rounded-full border border-border bg-card px-3 py-1 text-xs text-fg-dim hover:text-fg"
      >
        Reset
      </button>
    </div>
  )
}
