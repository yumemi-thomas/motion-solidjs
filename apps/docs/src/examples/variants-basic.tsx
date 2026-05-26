import { motion } from 'motion-solidjs'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'variants-basic',
  title: 'Variants — basic',
  category: 'variants',
  description: 'Name your states and toggle between them by string.',
  tag: 'variants',
} as const

const box = {
  rest: { scale: 1, rotate: 0, borderRadius: '24%' },
  active: { scale: 1.2, rotate: 12, borderRadius: '50%' },
}

export default function VariantsBasic() {
  const [on, setOn] = createSignal(false)

  return (
    <motion.div
      onClick={() => setOn((v) => !v)}
      class="h-24 w-24 cursor-pointer bg-grad-violet shadow-glow"
      variants={box}
      animate={on() ? 'active' : 'rest'}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    />
  )
}
