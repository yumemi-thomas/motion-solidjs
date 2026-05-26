import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

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
  const [active, setActive] = useState<(typeof tabs)[number]['id']>('home')

  return (
    <div className="flex w-64 flex-col gap-3">
      <div className="flex gap-1 rounded-full border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className="relative flex-1 rounded-full px-3 py-1.5 text-xs"
          >
            {active === t.id ? (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-full bg-grad-rose"
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              />
            ) : null}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="relative h-20 overflow-hidden rounded-2xl border border-border bg-card p-4 text-xs text-fg-muted">
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {tabs.find((x) => x.id === active)?.body}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
