import type { TransformPoint } from 'motion-utils'
import type { Options } from '@/types'

/**
 * Motion configuration state shared through context
 */
export interface MotionConfigState {
  /** Default transition settings for animations */
  transition?: Options['transition']
  /** Controls motion reduction based on user preference or explicit setting */
  reducedMotion?: 'user' | 'never' | 'always'
  /** Custom nonce for CSP compliance with inline styles */
  nonce?: string
  /**
   * If true, this is a static context (e.g. the Framer canvas). When set,
   * dynamic functionality is disabled. Mirrors framer-motion's
   * `MotionConfigContext.isStatic`.
   */
  isStatic?: boolean
  /**
   * Map a page-relative pointer point to the coordinate space pan / drag
   * gestures should work in. Used to compensate for CSS-transformed
   * ancestors (`correctParentTransform`) and SVG viewBox scaling
   * (`transformViewBoxPoint`). Mirrors framer-motion's
   * `MotionConfigContext.transformPagePoint`.
   */
  transformPagePoint?: TransformPoint
}

/** Props interface matching the config state */
export type MotionConfigProps = MotionConfigState
