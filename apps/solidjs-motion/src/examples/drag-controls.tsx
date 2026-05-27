import { motion, createDragControls } from 'solidjs-motion'

export const meta = {
  slug: 'drag-controls',
  title: 'Drag — createDragControls',
  category: 'drag',
  description: 'Start a drag from a separate handle with createDragControls.',
  tag: 'controls',
} as const

export default function DragControls() {
  const controls = createDragControls()

  return (
    <div class="flex flex-col items-center gap-3">
      <motion.div
        drag
        dragListener={false}
        dragControls={controls}
        dragConstraints={{ left: -120, right: 120, top: -60, bottom: 60 }}
        dragElastic={0.2}
        class="h-16 w-16 rounded-2xl bg-grad-amber shadow-glow"
      />
      <button
        onPointerDown={(e) => controls.start(e)}
        class="cursor-grab rounded-full bg-card border border-border px-4 py-1.5 text-xs text-fg-muted active:cursor-grabbing hover:text-fg"
      >
        Drag from here
      </button>
    </div>
  )
}
