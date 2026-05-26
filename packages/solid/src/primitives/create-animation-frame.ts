import { cancelFrame, frame, type FrameData } from 'motion-dom'
import { createEffect, onCleanup } from 'solid-js'
import { createMotionConfig } from '@/components/motion-config/context'

export type FrameCallback = (timestamp: number, delta: number) => void

/**
 * Runs `callback` once per animation frame with the timestamp since first
 * call and the delta since the previous frame. Pauses when the surrounding
 * `MotionConfig` has `isStatic`, and cancels on owner disposal.
 *
 * @example
 * ```tsx
 * const [elapsed, setElapsed] = createSignal(0)
 * createAnimationFrame((t) => setElapsed(t))
 *
 * return <div>Elapsed: {elapsed().toFixed(0)}ms</div>
 * ```
 */
export function createAnimationFrame(callback: FrameCallback) {
  const config = createMotionConfig()
  let initialTimestamp = 0

  createEffect(() => {
    if (config().isStatic) return

    const provideTimeSinceStart = ({ timestamp, delta }: FrameData) => {
      if (!initialTimestamp) initialTimestamp = timestamp
      callback(timestamp - initialTimestamp, delta)
    }

    frame.update(provideTimeSinceStart, true)
    onCleanup(() => cancelFrame(provideTimeSinceStart))
  })
}
