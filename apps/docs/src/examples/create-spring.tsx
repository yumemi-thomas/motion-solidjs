import { motion, createMotionValue, createSpring, createTransform } from 'motion-solidjs'
import { createSignal, onCleanup, onMount } from 'solid-js'

export const meta = {
  slug: 'create-spring',
  title: 'createSpring',
  category: 'motion-values',
  description: 'Smooth any motion value with a spring — fingers track lag.',
  tag: 'createSpring',
} as const

export default function UseSpringExample() {
  const x = createMotionValue(0)
  const y = createMotionValue(0)
  const springX = createSpring(x, { stiffness: 200, damping: 22 })
  const springY = createSpring(y, { stiffness: 200, damping: 22 })

  const [box, setBox] = createSignal<HTMLDivElement | null>(null)

  onMount(() => {
    const el = box()
    if (!el) return
    const handle = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      x.set(e.clientX - rect.left - rect.width / 2)
      y.set(e.clientY - rect.top - rect.height / 2)
    }
    el.addEventListener('pointermove', handle)
    onCleanup(() => el.removeEventListener('pointermove', handle))
  })

  return (
    <div
      ref={setBox}
      class="relative grid h-56 w-56 place-items-center rounded-3xl border border-border bg-card text-xs text-fg-dim"
    >
      <span>move pointer</span>
      <motion.span
        class="pointer-events-none absolute h-12 w-12 rounded-full bg-grad-rose shadow-glow"
        style={{ x: springX, y: springY }}
      />
    </div>
  )
}
