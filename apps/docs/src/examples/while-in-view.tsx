import { motion } from 'motion-solidjs'
import { For, createSignal } from 'solid-js'

export const meta = {
  slug: 'while-in-view',
  title: 'While in view',
  category: 'scroll',
  description: 'Each card animates as it enters the viewport.',
  tag: 'whileInView',
} as const

export default function WhileInView() {
  const [container, setContainer] = createSignal<HTMLDivElement | null>(null)
  return (
    <div
      ref={setContainer}
      class="h-64 w-56 overflow-y-scroll rounded-2xl border border-border bg-card p-4"
    >
      <For each={[0, 1, 2, 3, 4, 5, 6, 7]}>
        {(i) => (
          <motion.div
            class="mb-3 grid h-16 place-items-center rounded-2xl bg-grad-amber text-xs font-semibold text-white"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ root: container() ?? undefined, amount: 0.5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          >
            Card {i + 1}
          </motion.div>
        )}
      </For>
    </div>
  )
}
