import { HTMLVisualElement, SVGVisualElement } from 'motion-dom'
import { AnimationFeature, isAnimationEnabled } from '@/features/animation'
import type { FeatureDefinitions } from '@/features/definitions'
import { isSVGElement } from '@/utils/is'
import type { MotionHandle } from '@/motion/create-motion'
import type { MotionMachinery } from '@/motion/machinery'
import { createPresenceRegistration } from '@/motion/presence-registration'
import type { AsTag } from '@/types'

export function createVisualElement(Component: AsTag, options: any) {
  return isSVGElement(Component) ? new SVGVisualElement(options) : new HTMLVisualElement(options)
}

export interface FeatureBundle {
  renderer: typeof createVisualElement
  /**
   * Feature definitions merged into motion-dom's global registry
   * (`setFeatureDefinitions`); `VisualElement.updateFeatures` instantiates
   * each per node when `isEnabled(props)` matches.
   */
  features: FeatureDefinitions
  /**
   * Per-VE projection initializer, carried by bundles with layout/drag.
   * Projection isn't prop-gated — every node participates in the projection
   * tree — so it installs into a slot the core handle drives directly.
   */
  projection?: (handle: MotionHandle) => void
  /**
   * Handle machinery (AnimatePresence registration) installed globally when
   * the bundle registers. Bare `m` ships without it and renders statically
   * until then — mirroring motion/react — which keeps motion-dom's
   * frameloop out of the bare-`m` bundle.
   */
  machinery?: MotionMachinery
}

/**
 * Shared machinery implementation carried by every feature bundle (domMin /
 * domAnimation / domMax).
 */
export const motionHandleMachinery: MotionMachinery = {
  createPresenceRegistration,
}

export const animationDefinitions: FeatureDefinitions = {
  animation: { isEnabled: isAnimationEnabled, Feature: AnimationFeature },
}

/**
 * Smallest feature bundle: animation only, no gestures, drag or layout.
 * Lives in its own module so the gesture classes stay out of its import
 * graph (class heritage defeats tree-shaking).
 *
 * @example
 * ```tsx
 * import { LazyMotion, domMin, m } from 'motion-solidjs'
 *
 * <LazyMotion features={domMin}>
 *   <m.div animate={{ opacity: 1 }} />
 * </LazyMotion>
 * ```
 */
export const domMin: FeatureBundle = {
  renderer: createVisualElement,
  features: animationDefinitions,
  machinery: motionHandleMachinery,
}
