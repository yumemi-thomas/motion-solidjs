import { motion } from 'solidjs-motion'
import { createSignal } from 'solid-js'

// solidjs-motion has no `createCycle`; it's a few lines over a signal.
function createCycle<T>(...items: T[]): [() => T, () => void] {
  const [i, setI] = createSignal(0)
  return [() => items[i()], () => setI((p) => (p + 1) % items.length)]
}

export const meta = {
  slug: 'create-cycle',
  title: 'createCycle',
  category: 'variants',
  description: 'Step through a fixed set of variants — each click advances and wraps around.',
  tag: 'createCycle',
} as const

type MenuState = 'closed' | 'open' | 'expanded'

const variants = {
  closed: { scale: 0.85, borderRadius: '50%', rotate: 0 },
  open: { scale: 1, borderRadius: '24%', rotate: 0 },
  expanded: { scale: 1.25, borderRadius: '12%', rotate: 12 },
} satisfies Record<MenuState, object>

export default function UseCycleExample() {
  const [state, cycleState] = createCycle<MenuState>('closed', 'open', 'expanded')

  return (
    <div class="flex flex-col items-center gap-3">
      <motion.div
        class="h-24 w-24 bg-grad-mint shadow-glow"
        variants={variants}
        animate={state()}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      />
      <button
        onClick={() => cycleState()}
        class="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        {state()}
      </button>
    </div>
  )
}
