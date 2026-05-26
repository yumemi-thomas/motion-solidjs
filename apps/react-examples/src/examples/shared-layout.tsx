import { motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'shared-layout',
  title: 'Shared layout',
  category: 'layout',
  description: 'layoutId animates between two elements as one.',
  tag: 'layoutId',
} as const

const opts = [
  { id: 'a', color: 'bg-grad-rose', label: 'Rose' },
  { id: 'b', color: 'bg-grad-violet', label: 'Violet' },
  { id: 'c', color: 'bg-grad-mint', label: 'Mint' },
  { id: 'd', color: 'bg-grad-amber', label: 'Amber' },
] as const

export default function SharedLayout() {
  const [selected, setSelected] = useState('a')

  return (
    <div className="flex gap-2">
      {opts.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setSelected(opt.id)}
          className={`relative grid h-14 w-14 place-items-center rounded-2xl ${opt.color}`}
        >
          <span className="relative z-10 text-[10px] font-semibold text-white">{opt.label}</span>
          {selected === opt.id ? (
            <motion.span
              layoutId="ring"
              className="absolute inset-0 rounded-2xl border-2 border-white"
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            />
          ) : null}
        </button>
      ))}
    </div>
  )
}
