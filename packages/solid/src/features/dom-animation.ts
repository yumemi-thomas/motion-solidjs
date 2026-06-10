import type { FeatureDefinitions } from '@/features/definitions'
import {
  animationDefinitions,
  createVisualElement,
  motionHandleMachinery,
  type FeatureBundle,
} from '@/features/dom-min'
import {
  FocusGesture,
  HoverGesture,
  InViewFeature,
  PressGesture,
  isFocusEnabled,
  isHoverEnabled,
  isInViewEnabled,
  isPressEnabled,
} from '@/features/gestures/gestures'

export { createVisualElement, domMin, motionHandleMachinery } from '@/features/dom-min'
export type { FeatureBundle } from '@/features/dom-min'

const gestureDefinitions: FeatureDefinitions = {
  hover: { isEnabled: isHoverEnabled, Feature: HoverGesture },
  tap: { isEnabled: isPressEnabled, Feature: PressGesture },
  focus: { isEnabled: isFocusEnabled, Feature: FocusGesture },
  inView: { isEnabled: isInViewEnabled, Feature: InViewFeature },
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
