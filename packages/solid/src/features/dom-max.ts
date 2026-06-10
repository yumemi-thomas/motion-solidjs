import type { FeatureDefinitions } from '@/features/definitions'
import { domAnimation } from '@/features/dom-animation'
import { createVisualElement, motionHandleMachinery, type FeatureBundle } from '@/features/dom-min'
import { dragFeatureDefinition } from '@/features/gestures/drag'
import { panFeatureDefinition } from '@/features/gestures/pan'
import { layoutFeatureDefinition } from '@/features/layout/layout'
import { createProjection } from '@/features/layout/projection'

const maxDefinitions: FeatureDefinitions = {
  ...domAnimation.features,
  pan: panFeatureDefinition,
  drag: dragFeatureDefinition,
  layout: layoutFeatureDefinition,
}

/**
 * Maximal feature bundle: animation, gestures, projection, pan, drag and
 * layout. Use with {@link LazyMotion} to opt into the full motion API.
 *
 * @example
 * ```tsx
 * import { LazyMotion, domMax, m } from 'motion-solidjs'
 *
 * <LazyMotion features={domMax}>
 *   <m.div drag layout animate={{ x: 100 }} />
 * </LazyMotion>
 * ```
 */
export const domMax: FeatureBundle = {
  renderer: createVisualElement,
  machinery: motionHandleMachinery,
  features: maxDefinitions,
  projection: createProjection,
}
