import { motion } from 'solidjs-motion'
import { For, createSignal } from 'solid-js'

export const meta = {
  slug: 'variants-propagation',
  title: 'Variant propagation',
  category: 'variants',
  description: 'Variants flow down the tree; toggle the parent only.',
  tag: 'propagation',
} as const

const parent = {
  rest: { rotate: 0 },
  hover: { rotate: 6, transition: { staggerChildren: 0.04 } },
}
const dot = {
  rest: { y: 0, scale: 1, backgroundColor: '#7c5cff' },
  hover: { y: -10, scale: 1.2, backgroundColor: '#ff4d8d' },
}

export default function VariantsPropagation() {
  const [hover, setHover] = createSignal(false)

  return (
    <motion.div
      class="flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-card px-5 py-4"
      variants={parent}
      animate={hover() ? 'hover' : 'rest'}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <For each={[0, 1, 2, 3]}>
        {() => (
          <motion.div
            class="h-3 w-3 rounded-full"
            variants={dot}
            transition={{ type: 'spring', stiffness: 360, damping: 14 }}
          />
        )}
      </For>
    </motion.div>
  )
}
