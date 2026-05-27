import { motion } from 'solidjs-motion'
import type { PanInfo } from 'solidjs-motion'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'drag-snap',
  title: 'Drag — snap to slots',
  category: 'drag',
  description: 'On drag end, snap to the nearest of three positions.',
  tag: 'snap',
} as const

const slots = [-80, 0, 80]

export default function DragSnap() {
  const [x, setX] = createSignal(0)

  return (
    <div class="flex flex-col items-center gap-4">
      <div class="relative flex h-16 w-56 items-center justify-between rounded-full border border-border bg-card px-3">
        {slots.map((s) => (
          <span
            class="h-2 w-2 rounded-full bg-fg-dim"
            style={{ transform: `translateX(${s - slots[1]}px)` }}
          />
        ))}
        <motion.div
          drag="x"
          dragConstraints={{ left: -90, right: 90 }}
          dragElastic={0.2}
          class="absolute h-12 w-12 cursor-grab rounded-full bg-grad-rose shadow-glow active:cursor-grabbing"
          animate={{ x: x() }}
          // solidjs-motion's proxy intersects native HTML drag-event handler
          // types with motion's gesture callbacks, so `onDragEnd`'s type is
          // unsatisfiable. The cast hands motion the (event, info) handler it
          // dispatches at runtime.
          onDragEnd={
            ((_: PointerEvent, info: PanInfo) => {
              const final = x() + info.offset.x
              const nearest = slots.reduce((a, b) =>
                Math.abs(b - final) < Math.abs(a - final) ? b : a,
              )
              setX(nearest)
            }) as never
          }
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        />
      </div>
    </div>
  )
}
