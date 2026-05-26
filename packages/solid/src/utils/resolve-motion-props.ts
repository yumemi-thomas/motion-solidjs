import type { LayoutGroupState } from '@/components/context'
import type { PresenceContext } from '@/components/animate-presence/presence'
import type { MotionConfigState } from '@/components/motion-config/types'
import type { Options } from '@/types'

export interface MotionContext {
  layoutGroup: LayoutGroupState
  presenceContext: PresenceContext
  config: MotionConfigState
}

/**
 * Merge motion props with context values (layout group, presence, config).
 * Shared by motion components and v-motion directive.
 */
export function resolveMotionProps(
  props: Options,
  context: MotionContext,
): Options & { presenceContext: PresenceContext } {
  const { layoutGroup, presenceContext, config } = context

  const layoutId =
    layoutGroup.id && props.layoutId
      ? `${layoutGroup.id}-${props.layoutId}`
      : props.layoutId || undefined

  return {
    ...props,
    layoutId,
    transition: props.transition ?? config.transition,
    layoutGroup,
    motionConfig: config,
    // Lift `transformPagePoint` from MotionConfig onto the resolved
    // props so motion-dom's `VisualElement.getTransformPagePoint()` —
    // which reads from `this.props.transformPagePoint` — picks it up.
    // Mirrors framer-motion's `useVisualElement`, which spreads
    // `MotionConfigContext` over `props` before passing to the renderer.
    transformPagePoint: props.transformPagePoint ?? config.transformPagePoint,
    presenceContext,
    initial:
      presenceContext.initial === false
        ? presenceContext.initial
        : props.initial === true
          ? undefined
          : props.initial,
  }
}
