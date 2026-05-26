// `motion` / `Motion` — the eager-renderer namespace.
//
// Split out from `motion.tsx` so consumers who import only `m` / `M`
// never reach `domMax` (and through it `createVisualElement` →
// `HTMLVisualElement`). The bundler can drop this entire file from the
// import graph when it's unused.
import { domMax } from '@/features/dom-max'
import { createMotionComponentWithFeatures } from './motion'
import type { MotionComponent } from './motion'

export const motion = createMotionComponentWithFeatures(domMax)
export const Motion: MotionComponent = motion.create('div')
