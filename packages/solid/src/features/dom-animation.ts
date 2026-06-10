import { HTMLVisualElement, SVGVisualElement } from 'motion-dom'
import { createAnimation } from '@/features/animation'
import { createGestures } from '@/features/gestures/gestures'
import { isSVGElement } from '@/utils/is'
import type { MotionHandle } from '@/motion/create-motion'
import type { MotionMachinery } from '@/motion/machinery'
import { createPresenceRegistration } from '@/motion/presence-registration'
import type { AsTag } from '@/types'

export function createVisualElement(Component: AsTag, options: any) {
  return isSVGElement(Component) ? new SVGVisualElement(options) : new HTMLVisualElement(options)
}

/**
 * A factory that wires a {@link MotionHandle} into the Solid effect graph,
 * returning a cleanup that the handle invokes on detach.
 *
 * Each factory owns its own reactivity: it subscribes to the relevant
 * `getOpts` reads via `createEffect`, manages DOM listeners or animation
 * subscriptions, and cleans up via the returned function (or via internal
 * `onCleanup` calls — both fire when the handle's owner disposes).
 *
 * Features should never reach beyond the {@link MotionHandle} surface
 * for synchronous reads; for reactive subscription, accept `getOpts`.
 */
export type BindingFactory = (
  handle: MotionHandle,
  getOpts: () => MotionHandle['options'],
) => (() => void) | undefined

export interface FeatureBundle {
  renderer: typeof createVisualElement
  features: Array<BindingFactory>
  /**
   * Handle machinery (MotionValue registry, style writer, presence
   * registration) installed globally when the bundle registers. Bare `m`
   * ships without it and renders statically until then — mirroring
   * motion/react — which keeps motion-dom's MotionValue/frameloop out of
   * the bare-`m` bundle.
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
  features: [createAnimation, createGestures],
  machinery: motionHandleMachinery,
}

/**
 * Smallest feature bundle: animation only, no gestures, drag or layout.
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
  features: [createAnimation],
  machinery: motionHandleMachinery,
}
