import { wrap } from 'motion-utils'
import { createSignal, type Accessor } from 'solid-js'

export type Cycle = (i?: number) => void
export type CycleState<T> = [Accessor<T>, Cycle]

/**
 * Cycles through a set of states. The returned accessor holds the current
 * value; calling `cycle()` advances to the next (wrapping at the end), or
 * `cycle(i)` jumps to a specific index.
 *
 * @example
 * ```tsx
 * const [color, cycleColor] = createCycle('red', 'green', 'blue')
 *
 * return (
 *   <motion.div
 *     animate={{ backgroundColor: color() }}
 *     onClick={() => cycleColor()}
 *   />
 * )
 * ```
 */
export function createCycle<T>(first: T, ...rest: T[]): CycleState<T> {
  const items = [first, ...rest]
  let index = 0
  const [item, setItem] = createSignal<T>(first)

  const cycle: Cycle = (next?: number) => {
    index = typeof next === 'number' ? next : wrap(0, items.length, index + 1)
    setItem(() => items[index])
  }

  return [item, cycle]
}
