import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

export const meta = {
  slug: 'spring',
  title: 'Spring physics',
  category: 'animations',
  description: 'Stiffness and damping shape a natural overshoot.',
  tag: 'spring',
} as const

export default function Spring() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      className="h-20 w-20 rounded-3xl bg-grad-amber shadow-glow"
      animate={{ x: on ? 80 : -80, rotate: on ? 12 : -12 }}
      transition={{ type: 'spring', stiffness: 200, damping: 10, mass: 0.9 }}
    />
  )
}
