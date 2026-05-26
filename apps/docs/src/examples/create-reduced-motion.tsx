import { motion, createReducedMotion } from 'motion-solidjs'

export const meta = {
  slug: 'create-reduced-motion',
  title: 'createReducedMotion',
  category: 'motion-values',
  description: 'Respect the user — fall back to a tame transition.',
  tag: 'a11y',
} as const

export default function UseReducedMotionExample() {
  const reduce = createReducedMotion()

  return (
    <div class="flex flex-col items-center gap-2">
      <motion.div
        class="h-20 w-20 rounded-2xl bg-grad-amber"
        animate={reduce() ? { opacity: [0.5, 1, 0.5] } : { rotate: 360, scale: [1, 1.3, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span class="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-mono text-fg-dim">
        prefers-reduced-motion: {reduce() ? 'reduce' : 'no-preference'}
      </span>
    </div>
  )
}
