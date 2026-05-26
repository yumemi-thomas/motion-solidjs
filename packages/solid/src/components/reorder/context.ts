import { createContext } from '@/utils'
import type { Box } from 'motion-utils'
import type { Accessor } from 'solid-js'

export interface ReorderContextProps<T> {
  axis?: Accessor<'x' | 'y'>
  values?: Accessor<T[]>
  registerItem?: (item: T, layout: Box) => void
  updateOrder?: (item: T, offset: number, velocity: number) => void

  groupRef?: Accessor<HTMLElement | null>
}

export const [injectReorderContext, reorderContextProvider] =
  createContext<ReorderContextProps<any>>('ReorderContext')
