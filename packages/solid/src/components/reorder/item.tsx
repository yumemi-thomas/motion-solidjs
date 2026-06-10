import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { invariant } from '@/utils/is'
import { Motion } from '@/components/motion-max'
import { createTransform } from '@/primitives/create-transform'
import { injectReorderContext } from './context'
import { createDefaultMotionValue } from './utils'
import { autoScrollIfNeeded, resetAutoScrollState } from './auto-scroll'
import type { ReorderItemProps } from './types'

export interface SolidReorderItemProps<V> extends ReorderItemProps<V> {
  children?: JSX.Element
}

/**
 * A draggable child of `Reorder.Group`. Identified by its `value`, which
 * must be a member of the enclosing group's `values` array.
 *
 * @example
 * ```tsx
 * <Reorder.Item value={todo} as="li">
 *   {todo.label}
 * </Reorder.Item>
 * ```
 */
export default function Item<V>(props: SolidReorderItemProps<V>) {
  const context = injectReorderContext()
  invariant(Boolean(context), 'Reorder.Item must be a descendant of Reorder.Group')

  const axis = () => context.axis?.() ?? 'y'
  const userStyle = () => props.style ?? {}
  const point = {
    x: createDefaultMotionValue(userStyle().x),
    y: createDefaultMotionValue(userStyle().y),
  }
  const zIndex = createTransform([point.x, point.y], ([x, y]) => (x || y ? 1 : 'unset'))

  const [, rest] = splitProps(props, [
    'value',
    'as',
    'style',
    'drag',
    'onDrag',
    'onDragStart',
    'onDragEnd',
    'onLayoutMeasure',
    'children',
  ])

  return (
    <Motion
      as={props.as ?? 'li'}
      // Mirror framer-motion: suppress the native HTML5 drag image so it can't
      // fight the pointer-driven reorder. Omitted when dragging is disabled.
      draggable={props.dragListener === false ? undefined : false}
      layout={props.layout ?? true}
      layoutDependency={context.values?.()}
      drag={props.drag ?? axis()}
      dragSnapToOrigin
      dragElastic={props.dragElastic ?? 0.5}
      dragMomentum={props.dragMomentum ?? true}
      style={{ ...userStyle(), x: point.x, y: point.y, 'z-index': zIndex }}
      onLayoutMeasure={(measured, prevMeasured) => {
        context.registerItem(props.value, measured)
        props.onLayoutMeasure?.(measured, prevMeasured)
      }}
      onDragStart={(event, gesturePoint) => {
        props.onDragStart?.(event, gesturePoint)
      }}
      onDrag={(event, gesturePoint) => {
        const a = axis()
        const offset = point[a].get()
        const velocity = gesturePoint.velocity[a]
        context.updateOrder(props.value, offset, velocity)
        autoScrollIfNeeded(context.groupRef?.() ?? null, gesturePoint.point[a], a, velocity)
        props.onDrag?.(event, gesturePoint)
      }}
      onDragEnd={(event, gesturePoint) => {
        resetAutoScrollState()
        props.onDragEnd?.(event, gesturePoint)
      }}
      ignoreStrict
      {...rest}
    >
      {props.children}
    </Motion>
  )
}
