import { motion, createTime, createTransform } from 'solidjs-motion'

export const meta = {
  slug: 'create-time',
  title: 'createTime',
  category: 'motion-values',
  description: 'A motion value that ticks with the document — drive any prop.',
  tag: 'createTime',
} as const

export default function UseTimeExample() {
  const time = createTime()
  const rotate = createTransform(time, [0, 4000], [0, 360], { clamp: false })

  return (
    <motion.div
      class="grid h-20 w-20 place-items-center rounded-2xl bg-grad-mint text-2xl"
      style={{ rotate }}
    >
      ✦
    </motion.div>
  )
}
