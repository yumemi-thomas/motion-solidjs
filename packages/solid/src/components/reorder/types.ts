import type { Axis } from 'motion-utils'
import type { JSX } from 'solid-js'
import type { MotionProps } from '@/components/motion'
import type { MotionHTMLAttributes } from '@/types'

export interface ItemData<T> {
  value: T
  layout: Axis
}

export interface ReorderGroupProps<V> extends Omit<
  MotionProps<'ul'> & MotionHTMLAttributes<'ul'>,
  'onReorder'
> {
  as?: any
  axis?: 'x' | 'y'
  values: V[]
  onReorder: (values: V[]) => void
  children?: JSX.Element
}

export interface ReorderItemProps<V>
  extends MotionProps<'li'>, Omit<MotionHTMLAttributes<'li'>, 'value'> {
  as?: any
  value: V
  children?: JSX.Element
}
