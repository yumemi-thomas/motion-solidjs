import { motion, Variants } from 'motion/react'

export const meta = {
  slug: 'variants-stagger',
  title: 'Stagger children',
  category: 'variants',
  description: 'staggerChildren orchestrates a beautiful entrance.',
  tag: 'stagger',
} as const

const parent = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const child: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.6 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 220, damping: 16 },
  },
}

export default function VariantsStagger() {
  return (
    <motion.ul className="flex gap-2" variants={parent} initial="hidden" animate="visible">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.li
          key={i}
          className="h-10 w-10 rounded-xl bg-grad-mint"
          style={{ backgroundPosition: `${i * 25}%` }}
          variants={child}
        />
      ))}
    </motion.ul>
  )
}
