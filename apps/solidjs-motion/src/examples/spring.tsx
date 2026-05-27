import { motion } from 'solidjs-motion'
import { createSignal, onCleanup, onMount } from 'solid-js'

export const meta = {
  slug: 'spring',
  title: 'Spring physics',
  category: 'animations',
  description: 'Stiffness and damping shape a natural overshoot.',
  tag: 'spring',
} as const

export default function Spring() {
  const [on, setOn] = createSignal(false)
  let id: ReturnType<typeof setInterval>

  onMount(() => {
    id = setInterval(() => setOn((v) => !v), 1400)
  })
  onCleanup(() => clearInterval(id))

  return (
    <motion.div
      class="h-20 w-20 rounded-3xl bg-grad-amber shadow-glow"
      animate={{ x: on() ? 80 : -80, rotate: on() ? 12 : -12 }}
      transition={{ type: 'spring', stiffness: 200, damping: 10, mass: 0.9 }}
    />
  )
}
