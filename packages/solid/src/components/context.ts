import type { MotionHandle } from '@/motion/create-motion'
import { createContext } from '@/utils'
import type { NodeGroup } from 'motion-dom'
import type { Accessor } from 'solid-js'

export const [injectMotion, provideMotion, motionInjectionKey] =
  createContext<MotionHandle>('Motion')

export interface LayoutGroupState {
  id?: string
  group?: NodeGroup
  forceRender?: VoidFunction
  key?: Accessor<number>
}

export const [injectLayoutGroup, provideLayoutGroup, layoutGroupInjectionKey] =
  createContext<LayoutGroupState>('LayoutGroup')
