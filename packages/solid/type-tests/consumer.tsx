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
import {
  animateMini,
  animateSequence,
  cancelFrame,
  createInstantTransition,
  createMotionValue,
  createPageInView,
  createResetProjection,
  createWillChange,
  disableInstantTransitions,
  distance,
  distance2D,
  frame,
  hover,
  m,
  M,
  mix,
  motion,
  Motion,
  press,
  scrollInfo,
  transform,
} from 'motion-solidjs'

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

/**
 * The `style` prop is Solid-faithful: kebab-case csstype properties, `--*`
 * custom properties, and motion transform shorthands — each value may also be
 * a MotionValue. camelCase CSS keys and unknown properties must be rejected.
 */
export function StyleProp() {
  const x = createMotionValue(0)
  return (
    <>
      <motion.div
        style={{
          'background-color': 'red',
          'border-radius': '8px',
          top: '10px',
          opacity: 0.5,
          '--accent': 'blue',
          x,
          y: 10,
          scale: 1.2,
          rotate: 45,
          pathLength: 1,
          width: x,
        }}
      />
      {/* @ts-expect-error camelCase CSS keys are not Solid-faithful */}
      <motion.div style={{ backgroundColor: 'red' }} />
      {/* @ts-expect-error unknown CSS properties are rejected */}
      <motion.div style={{ 'not-a-real-prop': 1 }} />
      {/* @ts-expect-error length properties take csstype values, not bare numbers */}
      <motion.div style={{ top: 10 }} />
    </>
  )
}

/**
 * Parity primitives added alongside motion/react's useWillChange,
 * usePageInView, useInstantTransition and useResetProjection, plus the
 * curated motion-dom / motion utility re-exports.
 */
export function ParityPrimitives() {
  const willChange = createWillChange()
  const pageInView = createPageInView()
  const startInstantTransition = createInstantTransition()
  const resetProjection = createResetProjection()

  const mixer = mix(0, 100)
  const mapper = transform([0, 1], [0, 360])
  const frameProcess = frame.read(() => {})
  cancelFrame(() => {})
  const d: number = distance(0, 10)
  const d2: number = distance2D({ x: 0, y: 0 }, { x: 3, y: 4 })

  void [
    mixer(0.5),
    mapper(0.5),
    frameProcess,
    d,
    d2,
    scrollInfo,
    hover,
    press,
    animateMini,
    animateSequence,
  ]

  return (
    <motion.div
      style={{ 'will-change': willChange, opacity: pageInView() ? 1 : 0.5 }}
      onClick={() => {
        startInstantTransition(() => {})
        resetProjection()
        disableInstantTransitions()
      }}
    />
  )
}
