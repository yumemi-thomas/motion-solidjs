import { Presence, motion } from 'solidjs-motion'
import { For, Show, createSignal } from 'solid-js'

export const meta = {
  slug: 'shared-layout-tabs',
  title: 'Shared layout — tabs',
  category: 'layout',
  description: 'layoutId slides the active underline; Presence swaps the body.',
  tag: 'layoutId',
} as const

const tabs = [
  { id: 'tomato', icon: '🍅', label: 'Tomato' },
  { id: 'lettuce', icon: '🥬', label: 'Lettuce' },
  { id: 'cheese', icon: '🧀', label: 'Cheese' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function SharedLayoutTabs() {
  const [active, setActive] = createSignal<TabId>('tomato')
  const selected = () => tabs.find((t) => t.id === active())!

  return (
    <div class="flex w-72 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <nav class="border-b border-border px-1.5 pt-1.5">
        <ul class="flex gap-1" style={{ 'list-style': 'none', padding: 0, margin: 0 }}>
          <For each={tabs}>
            {(t) => (
              <motion.li
                class="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium select-none"
                initial={false}
                animate={{
                  'background-color':
                    t.id === active() ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0)',
                }}
                onClick={() => setActive(t.id)}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                <Show when={t.id === active()}>
                  <motion.span
                    layoutId="shared-layout-tabs-underline"
                    class="absolute right-0 -bottom-px left-0 h-[2px] bg-grad-rose"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                </Show>
              </motion.li>
            )}
          </For>
        </ul>
      </nav>
      <main class="flex h-32 items-center justify-center">
        <Presence mode="wait">
          <Show when={selected()} keyed>
            {(tab) => (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
                class="text-6xl"
              >
                {tab.icon}
              </motion.div>
            )}
          </Show>
        </Presence>
      </main>
    </div>
  )
}
