import { motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'between-value-types',
  title: 'Between value types',
  category: 'animations',
  description: 'Switching between px and % widths — motion handles the unit.',
  tag: 'units',
} as const

export default function BetweenValueTypes() {
  const [wide, setWide] = useState(false)

  return (
    <button
      onClick={() => setWide((v) => !v)}
      className="h-3 w-56 overflow-hidden rounded-full bg-card"
    >
      <motion.div
        className="h-full rounded-full bg-grad-rose"
        animate={{ width: wide ? '100%' : '40px' }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      />
    </button>
  )
}
