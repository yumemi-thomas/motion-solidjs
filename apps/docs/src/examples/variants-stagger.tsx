import { motion, Variants } from 'motion-solidjs'
import { For } from 'solid-js'

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
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 360, damping: 24 },
  },
}

export default function VariantsStagger() {
  return (
    <motion.ul class="flex gap-2" variants={parent} initial="hidden" animate="visible">
      <For each={[0, 1, 2, 3, 4]}>
        {(i) => (
          <motion.li
            class="h-10 w-10 rounded-xl bg-grad-mint"
            style={{ 'background-position': `${i * 25}%` }}
            variants={child}
          />
        )}
      </For>
    </motion.ul>
  )
}
