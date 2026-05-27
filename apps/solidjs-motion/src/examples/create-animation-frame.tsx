// solidjs-motion has no `createAnimationFrame`; a plain rAF loop with
// onMount/onCleanup is the idiomatic Solid equivalent.
import { motion, createMotionValue } from 'solidjs-motion'
import { createSignal, onCleanup, onMount } from 'solid-js'

export const meta = {
  slug: 'create-animation-frame',
  title: 'createAnimationFrame',
  category: 'animations',
  description: 'Run a callback every frame — drive a signal and a motion value from one rAF loop.',
  tag: 'createAnimationFrame',
} as const

export default function UseAnimationFrameExample() {
  const [elapsed, setElapsed] = createSignal(0)
  const rotate = createMotionValue(0)

  onMount(() => {
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      const t = now - start
      setElapsed(t / 1000)
      rotate.set((t / 16) % 360)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    onCleanup(() => cancelAnimationFrame(raf))
  })

  return (
    <div class="flex flex-col items-center gap-3">
      <motion.div
        class="grid h-20 w-20 place-items-center rounded-2xl bg-grad-violet text-2xl shadow-glow"
        style={{ rotate }}
      >
        ✦
      </motion.div>
      <span class="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-mono text-fg-dim">
        elapsed: {elapsed().toFixed(2)}s
      </span>
    </div>
  )
}
