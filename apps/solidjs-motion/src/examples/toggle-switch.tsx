import { motion } from 'solidjs-motion'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'toggle-switch',
  title: 'Toggle switch',
  category: 'showcase',
  description: 'Layout animates the knob, color crossfades the track.',
  tag: 'layout',
} as const

export default function ToggleSwitch() {
  const [on, setOn] = createSignal(false)

  return (
    <button
      data-on={on()}
      onClick={() => setOn((v) => !v)}
      class="relative flex h-9 w-16 items-center rounded-full bg-zinc-300 p-1 shadow-inner transition-colors data-[on=true]:bg-gradient-to-r data-[on=true]:from-emerald-400 data-[on=true]:to-cyan-400"
      style={{ 'justify-content': on() ? 'flex-end' : 'flex-start' }}
    >
      <motion.span
        data-state={on()}
        layout
        class="h-7 w-7 rounded-full bg-white shadow"
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}
