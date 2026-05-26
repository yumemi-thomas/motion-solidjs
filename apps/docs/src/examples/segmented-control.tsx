import { motion } from 'motion-solidjs'
import { For, Show, createSignal } from 'solid-js'

export const meta = {
  slug: 'segmented-control',
  title: 'Segmented control',
  category: 'showcase',
  description: 'Pill indicator slides between items with a shared layoutId.',
  tag: 'layoutId',
} as const

const items = ['Day', 'Week', 'Month', 'Year']

export default function SegmentedControl() {
  const [active, setActive] = createSignal('Week')

  return (
    <div class="flex gap-1 rounded-full border border-border bg-card p-1">
      <For each={items}>
        {(it) => (
          <button onClick={() => setActive(it)} class="relative px-4 py-1.5 text-xs font-medium">
            <Show when={active() === it}>
              <motion.span
                layoutId="seg"
                class="absolute inset-0 rounded-full bg-grad-violet"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            </Show>
            <span
              class="relative"
              style={{ color: active() === it ? '#fff' : 'var(--color-fg-muted)' }}
            >
              {it}
            </span>
          </button>
        )}
      </For>
    </div>
  )
}
