import type { FeatureBundle } from '@/features/dom-animation'
import { createContext } from '@/utils'
import type { Accessor } from 'solid-js'

export type LazyMotionContext = {
  features: Accessor<Partial<FeatureBundle>>
  strict: Accessor<boolean>
}
export const [injectLazyMotionContext, , lazyMotionInjectionKey] =
  createContext<LazyMotionContext>('LazyMotionContext')
