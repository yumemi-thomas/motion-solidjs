import type { MotionNodeOptions } from 'motion-dom'

import type { PresenceContext } from '@/components/animate-presence/presence'
import type { Options } from '@/types'
import type { MotionStyleRecord } from './render-style'

/**
 * Options after internal resolution. The userland `style` prop is the strict
 * Solid-faithful `MotionStyleProps`; `cleanStylePropForMotionDom` filters it
 * and camelCases its keys for motion-dom, so resolved options carry a loose
 * string record instead.
 */
export type ResolvedOptions = Omit<Options, 'style'> & { style?: MotionStyleRecord }

export type MotionDomOptions = ResolvedOptions & {
  presenceContext?: PresenceContext
}

export function resolveMotionDomProps(options: MotionDomOptions): MotionNodeOptions {
  const { dragConstraints, viewport, ...props } = options
  return props
}
