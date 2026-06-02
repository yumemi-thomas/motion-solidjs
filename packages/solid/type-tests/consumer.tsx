/**
 * Consumer-facing type guard. This file is type-checked against the BUILT
 * `dist/v1` declarations (see ./tsconfig.json), exactly as an npm consumer
 * sees them under their own strict tsconfig — NOT against `src`, whose
 * internal `@/*` aliases degrade to `any` in a consumer's project and would
 * mask type regressions.
 *
 * Regression guard for issue #1: `<motion.div>` must be a valid JSX element
 * (the `Partial` wrapper on the namespace once unioned `| undefined` onto
 * every tag, producing TS2604 "no construct or call signatures").
 */
import { m, M, motion, Motion } from 'motion-solidjs'

export function EagerNamespace() {
  return (
    <motion.div
      class="bg-grad-violet shadow-glow h-20 w-20 rounded-2xl"
      whileHover={{ y: -10, scale: 1.08, rotate: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 14 }}
      layout
    />
  )
}

export function MiniNamespace() {
  return <m.span animate={{ opacity: 1 }}>hi</m.span>
}

export function GenericAliases() {
  return (
    <>
      <Motion as="div" animate={{ x: 10 }} />
      <M animate={{ x: 10 }} />
    </>
  )
}

export function CreatedComponent() {
  const MotionButton = motion.create('button')
  return <MotionButton whileTap={{ scale: 0.95 }}>click</MotionButton>
}
