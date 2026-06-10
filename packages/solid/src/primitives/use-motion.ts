import type { MotionProps } from '@/components/motion'
import { domMax } from '@/features/dom-max'
import { installFeatureDefinitions } from '@/features/definitions'
import { createVisualElement } from '@/features/dom-animation'
import { installMotionMachinery } from '@/motion/machinery'
import {
  type CreateMotionAttrsOptions,
  type CreateMotionAttrsReturn,
  createMotionAttrs,
} from '@/motion/create-motion-attrs'

// Eagerly register the max feature bundle so consumers can use useMotion
// stand-alone (without first importing `motion.X`, which registers them as
// a module-init side effect). Mirrors createMotionComponentWithFeatures.
let featuresRegistered = false
function ensureFeatures() {
  if (featuresRegistered) return
  featuresRegistered = true
  if (domMax.machinery) installMotionMachinery(domMax.machinery)
  installFeatureDefinitions(domMax.features, domMax.projection)
}

export type UseMotionOptions = Omit<CreateMotionAttrsOptions, 'renderer'>
export type UseMotionResult = CreateMotionAttrsReturn

/**
 * Canonical hook-style entry point — returns a getter that merges user props
 * with motion's (style, ref, hydration marker) plus a `Provider` for variant
 * context propagation.
 *
 * Matches the shape of motion-react's `useMotion` / solidjs-motion's
 * `useMotion` so consumers migrating across frameworks have a 1:1 mapping.
 *
 * ```tsx
 * import { useMotion } from 'motion-solidjs'
 *
 * function Panel(props: { open: boolean }) {
 *   const m = useMotion(() => ({
 *     initial: { opacity: 0 },
 *     animate: { opacity: props.open ? 1 : 0 },
 *     transition: { duration: 0.2 },
 *   }))
 *
 *   return (
 *     <m.Provider>
 *       <div {...m({ class: 'panel' })} />
 *     </m.Provider>
 *   )
 * }
 * ```
 *
 * The max renderer is wired in by default so animation features (drag, layout,
 * gestures, …) work without an explicit `LazyMotion` boundary. For the
 * tree-shakeable "mini" surface, use `createMotionAttrs` directly with
 * `renderer` omitted and wrap in `<LazyMotion>`.
 */
export function useMotion(
  opts: MotionProps | (() => MotionProps),
  options: UseMotionOptions = {},
): UseMotionResult {
  ensureFeatures()
  return createMotionAttrs(opts, {
    ...options,
    renderer: createVisualElement,
  })
}
