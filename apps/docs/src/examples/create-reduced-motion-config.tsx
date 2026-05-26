import { MotionConfig, motion, createReducedMotionConfig } from 'motion-solidjs'
import { createSignal } from 'solid-js'

export const meta = {
  slug: 'create-reduced-motion-config',
  title: 'createReducedMotionConfig',
  category: 'animations',
  description:
    'Read the resolved reduced-motion preference — combines the OS setting with MotionConfig.',
  tag: 'reducedMotion',
} as const

function ReadOut() {
  const shouldReduce = createReducedMotionConfig()

  return (
    <div class="flex flex-col items-center gap-2">
      <motion.div
        class="h-20 w-20 rounded-2xl bg-grad-rose shadow-glow"
        animate={{ rotate: 360 }}
        transition={{
          duration: shouldReduce() ? 0 : 1.4,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <span class="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-mono text-fg-dim">
        reduced motion: {shouldReduce() ? 'yes' : 'no'}
      </span>
    </div>
  )
}

export default function UseReducedMotionConfigExample() {
  const [forced, setForced] = createSignal(false)

  return (
    <div class="flex flex-col items-center gap-3">
      <MotionConfig reducedMotion={forced() ? 'always' : 'never'}>
        <ReadOut />
      </MotionConfig>
      <button
        onClick={() => setForced((v) => !v)}
        class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        force: {forced() ? 'always' : 'never'}
      </button>
    </div>
  )
}
