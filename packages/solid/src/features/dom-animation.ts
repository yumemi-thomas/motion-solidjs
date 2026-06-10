import type { FeatureDefinitions } from '@/features/definitions'
import {
  animationDefinitions,
  createVisualElement,
  motionHandleMachinery,
  type FeatureBundle,
} from '@/features/dom-min'
import { focusFeatureDefinition } from '@/features/gestures/focus'
import { hoverFeatureDefinition } from '@/features/gestures/hover'
import { inViewFeatureDefinition } from '@/features/gestures/in-view'
import { pressFeatureDefinition } from '@/features/gestures/press'

export { createVisualElement, domMin, motionHandleMachinery } from '@/features/dom-min'
export type { FeatureBundle } from '@/features/dom-min'

// Gesture entries live here, not in dom-min's import graph — class heritage
// defeats tree-shaking, so each bundle module imports only the feature
// modules it actually ships.
const gestureDefinitions: FeatureDefinitions = {
  hover: hoverFeatureDefinition,
  tap: pressFeatureDefinition,
  focus: focusFeatureDefinition,
  inView: inViewFeatureDefinition,
}

/**
 * Animation + gesture feature bundle (no drag/layout). Smaller than
 * {@link domMax}; use when you don't need layout animations or drag.
 *
 * @example
 * ```tsx
 * import { LazyMotion, domAnimation, m } from 'motion-solidjs'
 *
 * <LazyMotion features={domAnimation}>
 *   <m.div animate={{ opacity: 1 }} whileHover={{ scale: 1.05 }} />
 * </LazyMotion>
 * ```
 */
export const domAnimation: FeatureBundle = {
  renderer: createVisualElement,
  features: { ...animationDefinitions, ...gestureDefinitions },
  machinery: motionHandleMachinery,
}
