import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export const meta = {
  slug: 'animated-button',
  title: 'Animated button',
  category: 'showcase',
  description: 'A submit button that morphs through pending and success.',
  tag: 'states',
} as const

type State = 'idle' | 'pending' | 'success'

export default function AnimatedButton() {
  const [state, setState] = useState<State>('idle')

  const run = () => {
    if (state !== 'idle') return
    setState('pending')
    setTimeout(() => setState('success'), 1100)
    setTimeout(() => setState('idle'), 2400)
  }

  return (
    <motion.button
      onClick={run}
      layout
      className="grid h-11 place-items-center rounded-full px-5 text-sm font-semibold text-white shadow-glow"
      animate={{
        backgroundColor: state === 'success' ? '#36e0c5' : '#ff4d8d',
        width: state === 'pending' ? 110 : state === 'success' ? 130 : 140,
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="inline-flex items-center gap-2"
        >
          {state === 'idle' ? (
            <span>Subscribe</span>
          ) : state === 'pending' ? (
            <>
              <motion.span
                className="block h-3 w-3 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              <span>Working</span>
            </>
          ) : (
            <span>✓ Subscribed</span>
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
