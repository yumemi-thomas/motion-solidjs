import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'animate-presence-wait',
  title: 'AnimatePresence — wait',
  category: 'animate-presence',
  description: 'mode="wait" defers the new child until the old one exits.',
  tag: 'mode=wait',
} as const

const slides = ['Hello', 'Bonjour', 'こんにちは', 'Olá', 'Привет']

export default function AnimatePresenceWait() {
  const [i, setI] = useState(0)

  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatePresence mode="wait">
        <motion.h2
          key={slides[i]}
          className="bg-gradient-to-r from-[#ff5d9e] to-[#ffd166] bg-clip-text text-5xl font-bold text-transparent"
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {slides[i]}
        </motion.h2>
      </AnimatePresence>
      <button
        onClick={() => setI((v) => (v + 1) % slides.length)}
        className="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-fg-muted hover:text-fg"
      >
        Next →
      </button>
    </div>
  )
}
