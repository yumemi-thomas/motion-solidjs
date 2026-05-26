import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'animate-presence-basic',
  title: 'AnimatePresence — basic',
  category: 'animate-presence',
  description: 'Exit animations when an element unmounts.',
  tag: 'exit',
} as const

export default function AnimatePresenceBasic() {
  const [show, setShow] = useState(true)

  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatePresence>
        {show ? (
          <motion.div
            className="grid h-24 w-24 place-items-center rounded-3xl bg-grad-rose text-3xl"
            initial={{ opacity: 0, scale: 0.4, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.4, y: -30 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            ✦
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button
        onClick={() => setShow((v) => !v)}
        className="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        {show ? 'Remove' : 'Add'}
      </button>
    </div>
  )
}
