import { motion } from 'motion-solidjs'

export const meta = {
  slug: 'drag-basic',
  title: 'Drag — basic',
  category: 'drag',
  description: 'A draggable block with momentum and a soft spring back.',
  tag: 'drag',
} as const

export default function DragBasic() {
  return (
    <motion.div
      drag
      dragMomentum
      class="h-20 w-20 cursor-grab rounded-3xl bg-grad-rose shadow-glow active:cursor-grabbing"
      whileTap={{ scale: 1.1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    />
  )
}
