import { HTMLVisualElement, SVGVisualElement } from 'motion-dom'
import { createAnimation } from '@/features/animation'
import { createGestures } from '@/features/gestures/gestures'
import { isSVGElement } from '@/utils/is'
import type { MotionHandle } from '@/motion/create-motion'
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

/**
 * A lazy feature is registered by its identifier + a loader that dynamically
 * imports the feature module. The loader is invoked at most once per
 * process; subsequent prop-triggered checks reuse the resolved factory.
 *
 * `triggers` lists the option keys that, when present (truthy), cause this
 * feature to load. Matches motion-dom's per-prop feature-loading idiom but
 * keeps the implementation Solid-native.
 *
 * `dependsOn` lists ids of other lazy entries that must load AND bind to a
 * motion handle before this entry binds. Used for implicit cross-feature
 * dependencies (drag and layout both read `visualElement.projection` at
 * bind-time, so they depend on projection). Listed entries are loaded and
 * bound via the same per-handle `onResolved` callback as the dependent
 * entry — bindFactory is idempotent so duplicate binds from sibling
 * entries (e.g. both drag and layout depending on projection on the same
 * handle) collapse to a single attach.
 */
export interface LazyFeatureEntry {
  id: string
  triggers: ReadonlyArray<string>
  load: () => Promise<BindingFactory>
  dependsOn?: ReadonlyArray<string>
}

export interface FeatureBundle {
  renderer: typeof createVisualElement
  features: Array<BindingFactory>
  /**
   * Lazily-loaded features. The implementations (drag, layout, projection,
   * pan) live in separate modules that the bundler emits as on-demand
   * chunks. Common-path consumers (no drag/layout props) never pay for
   * those bytes in the initial bundle.
   */
  lazyFeatures?: ReadonlyArray<LazyFeatureEntry>
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
}
