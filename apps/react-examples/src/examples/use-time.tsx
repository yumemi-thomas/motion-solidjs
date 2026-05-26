import { motion, useTime, useTransform } from 'motion/react'

export const meta = {
  slug: 'use-time',
  title: 'useTime',
  category: 'motion-values',
  description: 'A motion value that ticks with the document — drive any prop.',
  tag: 'useTime',
} as const

export default function UseTimeExample() {
  const time = useTime()
  const rotate = useTransform(time, [0, 4000], [0, 360], { clamp: false })

  return (
    <motion.div
      className="grid h-20 w-20 place-items-center rounded-2xl bg-grad-mint text-2xl"
      style={{ rotate }}
    >
      ✦
    </motion.div>
  )
}
