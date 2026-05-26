import { motion } from 'motion/react'

export const meta = {
  slug: 'keyframes',
  title: 'Keyframes',
  category: 'animations',
  description: 'Pass an array of values to interpolate through keyframes.',
  tag: 'keyframes',
} as const

export default function Keyframes() {
  return (
    <motion.div
      className="h-20 w-20 rounded-2xl bg-grad-violet"
      animate={{
        scale: [1, 1.3, 1.3, 1, 1],
        rotate: [0, 0, 180, 180, 0],
        borderRadius: ['20%', '20%', '50%', '50%', '20%'],
      }}
      transition={{
        duration: 2.2,
        ease: 'easeInOut',
        times: [0, 0.2, 0.5, 0.8, 1],
        repeat: Infinity,
        repeatDelay: 0.6,
      }}
    />
  )
}
