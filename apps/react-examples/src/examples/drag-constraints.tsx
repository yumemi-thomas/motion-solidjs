import { motion } from 'motion/react'

export const meta = {
  slug: 'drag-constraints',
  title: 'Drag — constraints',
  category: 'drag',
  description: 'Numerical constraints limit how far the element travels.',
  tag: 'dragConstraints',
} as const

export default function DragConstraints() {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -80, right: 80 }}
      dragElastic={0.2}
      className="h-16 w-16 cursor-grab rounded-2xl bg-grad-mint shadow-glow active:cursor-grabbing"
    />
  )
}
