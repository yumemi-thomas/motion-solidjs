import { motion } from 'solidjs-motion'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'pan',
  title: 'Pan gesture',
  category: 'gestures',
  description: 'Track pointer offset across pan events.',
  tag: 'onPan',
} as const

export default function Pan() {
  const [offset, setOffset] = createSignal({ x: 0, y: 0 })

  return (
    <motion.div
      class="h-24 w-24 cursor-grab rounded-2xl bg-grad-mint shadow-glow active:cursor-grabbing"
      onPan={(_, info) => setOffset({ x: info.offset.x, y: info.offset.y })}
      onPanEnd={() => setOffset({ x: 0, y: 0 })}
      style={{
        transform: `translate(${offset().x * 0.3}px, ${offset().y * 0.3}px)`,
      }}
    />
  )
}
