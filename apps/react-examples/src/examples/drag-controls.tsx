import { motion, useDragControls } from 'motion/react'

export const meta = {
  slug: 'drag-controls',
  title: 'Drag — useDragControls',
  category: 'drag',
  description: 'Start a drag from a separate handle with useDragControls.',
  tag: 'controls',
} as const

export default function DragControls() {
  const controls = useDragControls()

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        drag
        dragListener={false}
        dragControls={controls}
        dragConstraints={{ left: -120, right: 120, top: -60, bottom: 60 }}
        dragElastic={0.2}
        className="h-16 w-16 rounded-2xl bg-grad-amber shadow-glow"
      />
      <button
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab rounded-full bg-card border border-border px-4 py-1.5 text-xs text-fg-muted active:cursor-grabbing hover:text-fg"
      >
        Drag from here
      </button>
    </div>
  )
}
