import type { JSX } from 'solid-js'
import { createComputed, createEffect, splitProps } from 'solid-js'
import { invariant } from '@/utils/is'
import { Motion } from '@/components/motion-max'
import { reorderContextProvider } from './context'
import { checkReorder, compareMin } from './utils'
import type { ItemData, ReorderGroupProps } from './types'

export interface SolidReorderGroupProps<V> extends ReorderGroupProps<V> {
  children?: JSX.Element
}

/**
 * Container for a drag-to-reorder list. Provide the current order via
 * `values` and update it from `onReorder`. Children must be `Reorder.Item`s.
 *
 * @example
 * ```tsx
 * const [items, setItems] = createSignal(['a', 'b', 'c'])
 * return (
 *   <Reorder.Group values={items()} onReorder={setItems}>
 *     <For each={items()}>{(item) => (
 *       <Reorder.Item value={item}>{item}</Reorder.Item>
 *     )}</For>
 *   </Reorder.Group>
 * )
 * ```
 */
export default function Group<V>(props: SolidReorderGroupProps<V>) {
  createEffect(() => {
    invariant(Boolean(props.values), 'Reorder.Group must be provided a values prop')
  })

  let order: Array<ItemData<V>> = []
  let isReordering = false
  let groupEl: HTMLElement | null = null
  const axis = () => props.axis ?? 'y'

  // Reset local order when `values` changes from outside (not from our own
  // reorder). createComputed runs in Solid's pure phase, BEFORE render
  // effects fire, so the order signal is up to date by the time downstream
  // bindings read it.
  createComputed(() => {
    props.values
    if (!isReordering) order = []
  })

  reorderContextProvider({
    axis,
    values: () => props.values,
    groupRef: () => groupEl,
    registerItem: (value, layout) => {
      if (!props.values.includes(value)) return
      const idx = order.findIndex((entry) => value === entry.value)
      if (idx !== -1) order[idx].layout = layout[axis()]
      else order.push({ value, layout: layout[axis()] })
      order.sort(compareMin)
    },
    updateOrder: (item, offset, velocity) => {
      if (isReordering) return
      const prevOrder = order
      const newOrder = checkReorder(prevOrder, item, offset, velocity)
      if (prevOrder !== newOrder) {
        isReordering = true
        order = newOrder

        // Mirror upstream React semantics
        // (motion-upstream/packages/framer-motion/src/components/Reorder/Group.tsx):
        // find the first swap between `prevOrder` and `newOrder`, then apply
        // the same swap to a copy of the full `values` prop. This preserves
        // unmeasured items (e.g. virtualized lists where only a slice of items
        // is rendered) — their relative positions stay intact while the two
        // visible items that actually swapped reorder in place.
        const newValues = [...props.values]
        for (let i = 0; i < newOrder.length; i++) {
          if (prevOrder[i].value !== newOrder[i].value) {
            const a = props.values.indexOf(prevOrder[i].value)
            const b = props.values.indexOf(newOrder[i].value)
            if (a !== -1 && b !== -1) {
              ;[newValues[a], newValues[b]] = [newValues[b], newValues[a]]
            }
            break
          }
        }
        props.onReorder(newValues)
        queueMicrotask(() => {
          isReordering = false
        })
      }
    },
  })

  const [, rest] = splitProps(props, ['axis', 'values', 'onReorder', 'as', 'children', 'style'])

  return (
    <Motion
      as={props.as ?? 'ul'}
      style={{ 'overflow-anchor': 'none', ...props.style }}
      ref={(el: HTMLElement) => {
        groupEl = el
      }}
      {...rest}
    >
      {props.children}
    </Motion>
  )
}
