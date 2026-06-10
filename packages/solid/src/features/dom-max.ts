import type { FeatureDefinitions } from '@/features/definitions'
import { domAnimation } from '@/features/dom-animation'
import { createVisualElement, motionHandleMachinery, type FeatureBundle } from '@/features/dom-min'
import { DragGesture, isDragEnabled } from '@/features/gestures/drag'
import { PanGesture, isPanEnabled } from '@/features/gestures/pan'
import { LayoutFeature, isLayoutEnabled } from '@/features/layout/layout'
import { createProjection } from '@/features/layout/projection'

const maxDefinitions: FeatureDefinitions = {
  ...domAnimation.features,
  pan: { isEnabled: isPanEnabled, Feature: PanGesture },
  drag: { isEnabled: isDragEnabled, Feature: DragGesture },
  layout: { isEnabled: isLayoutEnabled, Feature: LayoutFeature },
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
