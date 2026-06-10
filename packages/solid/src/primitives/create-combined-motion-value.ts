import { getOwner, onCleanup } from 'solid-js'
import { type MotionValue, cancelFrame, frame, motionValue } from 'motion-dom'

/**
 * Low-level primitive: returns a `MotionValue<T>` whose value is recomputed
 * from `combineValues()` whenever a subscribed source emits. Callers wire
 * sources up explicitly via the returned `subscribe(values)`. Most consumers
 * want `createTransform` / `createComputed` / `createMotionTemplate` instead.
 */
export function createCombinedMotionValue<T>(combineValues: () => T) {
  const value = motionValue(combineValues())

  /**
   * Create a function that will update the template motion value with the latest values.
   * This is pre-bound so whenever a motion value updates it can schedule its
   * execution in Framesync. If it's already been scheduled it won't be fired twice
   * in a single frame.
   */
  const updateValue = () => value.set(combineValues())

  const scheduleUpdate = () => frame.preRender(updateValue, false, true)
  let subscriptions: VoidFunction[]

  const subscribe = (values: MotionValue[]) => {
    subscriptions = values.map((v) => v.on('change', scheduleUpdate))
  }
  const unsubscribe = () => {
    subscriptions.forEach((unsubscribe) => unsubscribe())
    cancelFrame(updateValue)
  }

  if (getOwner()) {
    onCleanup(() => {
      unsubscribe()
    })
  }
  return {
    subscribe,
    unsubscribe,
    value,
    updateValue,
  }
}
