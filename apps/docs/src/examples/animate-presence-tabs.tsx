import { AnimatePresence, motion } from 'motion-solidjs'
import { For, Show, createSignal } from 'solid-js'

export const meta = {
  slug: 'animate-presence-tabs',
  title: 'Crossfade tabs',
  category: 'animate-presence',
  description: 'Switch tab bodies with a quick crossfade.',
  tag: 'tabs',
} as const

const tabs = [
  { id: 'home', label: 'Home', body: 'Welcome to the home tab.' },
  { id: 'about', label: 'About', body: 'We build motion examples for fun.' },
  {
    id: 'contact',
    label: 'Contact',
    body: 'Find us on GitHub @motiondivision.',
  },
] as const

export default function AnimatePresenceTabs() {
  const [active, setActive] = createSignal<(typeof tabs)[number]['id']>('home')

  return (
    <div class="flex w-64 flex-col gap-3">
      <div class="flex gap-1 rounded-full border border-border bg-card p-1">
        <For each={tabs}>
          {(t) => (
            <button
              onClick={() => setActive(t.id)}
              class="relative flex-1 rounded-full px-3 py-1.5 text-xs"
            >
              <Show when={active() === t.id}>
                <motion.span
                  layoutId="tab-indicator"
                  class="absolute inset-0 rounded-full bg-grad-rose"
                  transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                />
              </Show>
              <span class="relative">{t.label}</span>
            </button>
          )}
        </For>
      </div>
      <div class="relative h-20 overflow-hidden rounded-2xl border border-border bg-card p-4 text-xs text-fg-muted">
        <AnimatePresence mode="wait">
          <Show when={active()} keyed>
            {(id) => (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                {tabs.find((x) => x.id === id)?.body}
              </motion.p>
            )}
          </Show>
        </AnimatePresence>
      </div>
    </div>
  )
}
