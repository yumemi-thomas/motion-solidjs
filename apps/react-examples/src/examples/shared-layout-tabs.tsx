import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'shared-layout-tabs',
  title: 'Shared layout — tabs',
  category: 'layout',
  description: 'layoutId slides the active underline; AnimatePresence swaps the body.',
  tag: 'layoutId',
} as const

const tabs = [
  { id: 'tomato', icon: '🍅', label: 'Tomato' },
  { id: 'lettuce', icon: '🥬', label: 'Lettuce' },
  { id: 'cheese', icon: '🧀', label: 'Cheese' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function SharedLayoutTabs() {
  const [active, setActive] = useState<TabId>('tomato')
  const selected = tabs.find((t) => t.id === active)!

  return (
    <div className="flex w-72 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <nav className="border-b border-border px-1.5 pt-1.5">
        <ul className="flex gap-1" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {tabs.map((t) => (
            <motion.li
              key={t.id}
              className="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium select-none"
              initial={false}
              animate={{
                backgroundColor: t.id === active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0)',
              }}
              onClick={() => setActive(t.id)}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.id === active ? (
                <motion.span
                  layoutId="shared-layout-tabs-underline"
                  className="absolute right-0 -bottom-px left-0 h-[2px] bg-grad-rose"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              ) : null}
            </motion.li>
          ))}
        </ul>
      </nav>
      <main className="flex h-32 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-6xl"
          >
            {selected.icon}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
