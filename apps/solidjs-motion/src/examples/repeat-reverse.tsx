import { motion } from 'solidjs-motion'

export const meta = {
  slug: 'repeat-reverse',
  title: 'Repeat & reverse',
  category: 'animations',
  description: 'repeatType "reverse" yo-yos endlessly between two states.',
  tag: 'repeat',
} as const

export default function RepeatReverse() {
  return (
    <motion.div
      class="h-16 w-16 rounded-2xl bg-grad-amber"
      animate={{ rotate: 90, scale: 1.4, 'border-radius': '50%' }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    />
  )
}
