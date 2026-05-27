import { motion } from 'solidjs-motion'

export const meta = {
  slug: 'animate-on-mount',
  title: 'Animate on mount',
  category: 'animations',
  description: 'initial → animate runs once when the element mounts.',
  tag: 'initial / animate',
} as const

export default function AnimateOnMount() {
  return (
    <motion.div
      class="h-20 w-20 rounded-3xl bg-grad-pink shadow-glow"
      initial={{ opacity: 0, scale: 0.4, rotate: -120 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    />
  )
}
