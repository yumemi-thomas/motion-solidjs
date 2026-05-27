import { motion } from 'solidjs-motion'
import { TodoNotice } from '~/components/TodoNotice'

export const meta = {
  slug: 'svg-path-draw',
  title: 'SVG path draw',
  category: 'svg',
  description: 'Animate pathLength to draw the checkmark on mount.',
  tag: 'pathLength',
} as const

// TODO(solidjs-motion): SVG path drawing (`pathLength`) is deferred to v0.3+,
// so this falls back to an opacity fade-in instead of stroking the path on.
export default function SvgPathDraw() {
  return (
    <div class="flex flex-col items-center gap-3">
      <svg viewBox="0 0 80 80" class="h-24 w-24">
        <motion.circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="#36e0c5"
          stroke-width="4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
        <motion.path
          d="M24 42 L36 54 L58 30"
          fill="none"
          stroke="#36e0c5"
          stroke-width="6"
          stroke-linecap="round"
          stroke-linejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1, ease: 'easeOut' }}
        />
      </svg>
      <TodoNotice>
        solidjs-motion defers SVG path drawing (<code>pathLength</code>) to v0.3+ — this fades in
        via opacity instead of stroking on.
      </TodoNotice>
    </div>
  )
}
