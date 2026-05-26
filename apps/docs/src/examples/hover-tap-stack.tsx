import { motion } from 'motion-solidjs'
import { For } from 'solid-js'

export const meta = {
  slug: 'hover-tap-stack',
  title: 'Hover + tap stack',
  category: 'gestures',
  description: 'A row of chips that lift on hover and depress on tap, with a per-item spring.',
  tag: 'compound',
} as const

const labels = ['Apple', 'Lime', 'Berry', 'Mint']
const grads = ['bg-grad-rose', 'bg-grad-amber', 'bg-grad-violet', 'bg-grad-mint']

export default function HoverTapStack() {
  return (
    <div class="flex gap-2">
      <For each={labels}>
        {(label, i) => (
          <motion.button
            class={`rounded-2xl ${grads[i()]} px-4 py-2 text-xs font-semibold text-white`}
            whileHover={{ y: -6, scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 16 }}
          >
            {label}
          </motion.button>
        )}
      </For>
    </div>
  )
}
