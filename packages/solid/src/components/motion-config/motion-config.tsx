import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import { resolveTransition } from 'motion-dom'
import { createMotionConfig, defaultConfig, motionConfigInjectionKey } from './context'
import type { MotionConfigProps } from './types'

export interface SolidMotionConfigProps extends MotionConfigProps {
  children?: JSX.Element
  reducedMotion?: 'user' | 'never' | 'always'
}

/**
 * Provides shared motion configuration (default transition, reduced-motion
 * preference, CSP nonce, pan/drag point transform) to descendant motion
 * components. Nests: child scopes shallow-merge into the parent.
 *
 * @example
 * ```tsx
 * <MotionConfig
 *   transition={{ duration: 0.3, ease: 'easeOut' }}
 *   reducedMotion="user"
 * >
 *   <App />
 * </MotionConfig>
 * ```
 */
export default function MotionConfig(props: SolidMotionConfigProps) {
  const parentConfig = createMotionConfig()

  const config = createMemo(() => ({
    // `transition.inherit: true` shallow-merges with the parent transition
    // (child keys win); resolveTransition handles that and strips `inherit`.
    transition:
      resolveTransition(props.transition, parentConfig().transition) ?? parentConfig().transition,
    reducedMotion: props.reducedMotion ?? defaultConfig.reducedMotion,
    nonce: props.nonce ?? parentConfig().nonce,
    // Inherit parent's transformPagePoint unless overridden. Consumed by
    // pan/drag via visualElement.getTransformPagePoint().
    transformPagePoint: props.transformPagePoint ?? parentConfig().transformPagePoint,
  }))

  return (
    <motionConfigInjectionKey.Provider value={config}>
      {props.children}
    </motionConfigInjectionKey.Provider>
  )
}
