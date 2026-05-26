import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

export const meta = {
  slug: 'layout-shuffle',
  title: 'Layout — shuffle',
  category: 'layout',
  description: 'A list of items reshuffles every second; layout springs them into place.',
  tag: 'layout',
} as const

const initialOrder = ['#ff0088', '#dd00ee', '#9911ff', '#0d63f8']

function shuffle<T>(input: readonly T[]) {
  return [...input].sort(() => Math.random() - 0.5)
}

export default function LayoutShuffle() {
  const [order, setOrder] = useState<string[]>([...initialOrder])

  useEffect(() => {
    const id = window.setInterval(() => setOrder((o) => shuffle(o)), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <ul
      className="grid w-[180px] grid-cols-2 gap-2"
      style={{ listStyle: 'none', padding: 0, margin: 0 }}
    >
      {order.map((color) => (
        <motion.li
          key={color}
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="aspect-square rounded-xl"
          style={{ backgroundColor: color }}
        />
      ))}
    </ul>
  )
}
