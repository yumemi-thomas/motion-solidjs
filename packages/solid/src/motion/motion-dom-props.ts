import type { MotionNodeOptions } from 'motion-dom'

import type { PresenceContext } from '@/components/animate-presence/presence'
import type { Options } from '@/types'

export type MotionDomOptions = Options & {
  presenceContext?: PresenceContext
}

export function resolveMotionDomProps(options: MotionDomOptions): MotionNodeOptions {
  const { dragConstraints, viewport, ...props } = options
  return props
}
