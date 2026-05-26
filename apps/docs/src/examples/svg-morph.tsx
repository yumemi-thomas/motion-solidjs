import { motion } from 'motion-solidjs'

export const meta = {
  slug: 'svg-morph',
  title: 'SVG transforms',
  category: 'svg',
  description: 'Independent transforms on an SVG group.',
  tag: 'svg',
} as const

export default function SvgMorph() {
  return (
    <svg viewBox="0 0 120 120" class="h-32 w-32">
      <defs>
        <linearGradient id="g" x1="0%" x2="100%">
          <stop offset="0%" stop-color="#ff5d9e" />
          <stop offset="100%" stop-color="#ffd166" />
        </linearGradient>
      </defs>
      <motion.rect
        x="20"
        y="20"
        width="80"
        height="80"
        rx="20"
        fill="url(#g)"
        animate={{ rotate: 360, scale: [1, 0.6, 1], rx: ['20', '40', '20'] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ 'transform-origin': '60px 60px' }}
      />
    </svg>
  )
}
