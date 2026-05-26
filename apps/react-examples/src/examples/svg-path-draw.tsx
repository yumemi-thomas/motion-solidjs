import { motion } from 'motion/react'

export const meta = {
  slug: 'svg-path-draw',
  title: 'SVG path draw',
  category: 'svg',
  description: 'Animate pathLength to draw the checkmark on mount.',
  tag: 'pathLength',
} as const

export default function SvgPathDraw() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24">
      <motion.circle
        cx="40"
        cy="40"
        r="34"
        fill="none"
        stroke="#36e0c5"
        strokeWidth="4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      <motion.path
        d="M24 42 L36 54 L58 30"
        fill="none"
        stroke="#36e0c5"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 1, ease: 'easeOut' }}
      />
    </svg>
  )
}
