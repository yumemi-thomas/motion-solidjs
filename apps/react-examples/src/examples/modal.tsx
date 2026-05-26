import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'modal',
  title: 'Modal',
  category: 'animate-presence',
  description: 'Backdrop fade + sheet slide, with coordinated exit.',
  tag: 'modal',
} as const

export default function Modal() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative h-full w-full">
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-grad-violet px-5 py-2 text-sm font-semibold text-white shadow-glow"
      >
        Open modal
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="absolute inset-0 z-10 grid place-items-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-72 rounded-3xl border border-border bg-card p-6 text-sm shadow-2xl"
              initial={{ y: 30, scale: 0.92, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 30, scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-2 text-base font-semibold">Confirm purchase</h3>
              <p className="text-fg-muted">
                You're about to spend zero dollars on a perfectly choreographed exit animation.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-grad-rose px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
