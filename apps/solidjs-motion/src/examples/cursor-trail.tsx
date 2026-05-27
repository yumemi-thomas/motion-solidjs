import { motion, createMotionValue, createSpring } from 'solidjs-motion'
import { For, createSignal, onCleanup, onMount } from 'solid-js'

export const meta = {
  slug: 'cursor-trail',
  title: 'Cursor trail',
  category: 'showcase',
  description: 'A chain of springs follows the pointer with growing lag.',
  tag: 'springs',
} as const

const LINKS = 6

export default function CursorTrail() {
  const [box, setBox] = createSignal<HTMLDivElement | null>(null)
  const x = createMotionValue(0)
  const y = createMotionValue(0)

  const trail = Array.from({ length: LINKS }, (_, i) => {
    const stiffness = 360 - i * 45
    return {
      x: createSpring(x, { stiffness, damping: 26 }),
      y: createSpring(y, { stiffness, damping: 26 }),
    }
  })

  onMount(() => {
    const el = box()
    if (!el) return
    const handle = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      x.set(e.clientX - rect.left)
      y.set(e.clientY - rect.top)
    }
    el.addEventListener('pointermove', handle)
    onCleanup(() => el.removeEventListener('pointermove', handle))
  })

  return (
    <div
      ref={setBox}
      class="relative h-56 w-56 overflow-hidden rounded-3xl border border-border bg-card"
    >
      <For each={trail}>
        {(t, i) => (
          <motion.span
            class="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-grad-rose"
            style={{
              x: t.x,
              y: t.y,
              opacity: 1 - i() / LINKS,
              scale: 1 - i() / (LINKS * 1.5),
            }}
          />
        )}
      </For>
    </div>
  )
}
