import { createAnimation } from '@/features/animation'
import {
  createVisualElement,
  motionHandleMachinery,
  type FeatureBundle,
} from '@/features/dom-animation'
import { createDrag } from '@/features/gestures/drag'
import { createGestures } from '@/features/gestures/gestures'
import { createPan } from '@/features/gestures/pan'
import { createLayout } from '@/features/layout/layout'
import { createProjection } from '@/features/layout/projection'

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
  features: [
    createAnimation,
    createGestures,
    createProjection,
    createPan,
    createDrag,
    createLayout,
  ],
}
