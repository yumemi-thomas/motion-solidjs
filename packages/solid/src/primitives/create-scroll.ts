import { createEffect, onCleanup } from 'solid-js'
import {
  type AccelerateConfig,
  type AnimationPlaybackControlsWithThen,
  motionValue,
  supportsScrollTimeline,
  supportsViewTimeline,
} from 'motion-dom'
import { scroll } from 'motion'
import type { ScrollInfoOptions } from '@/types'
import { isSSR } from '@/utils/is'
import {
  type MaybeAccessor,
  type MaybeElementAccessor,
  resolveAccessor,
  resolveElement,
} from '@/types'
import { offsetToViewTimelineRange } from './scroll-offsets'

// Walks past text/comment nodes to the first concrete Element.
function getMotionElement(el: Node | null | undefined): HTMLElement | SVGElement | undefined {
  if (!el) return undefined
  if (el instanceof HTMLElement || el instanceof SVGElement) return el
  return getMotionElement(el.nextSibling)
}

function getElement(target: MaybeElementAccessor) {
  return getMotionElement(resolveElement(target))
}

export interface CreateScrollOptions extends Omit<ScrollInfoOptions, 'container' | 'target'> {
  container?: MaybeElementAccessor
  target?: MaybeElementAccessor
}

function createScrollMotionValues() {
  return {
    scrollX: motionValue(0),
    scrollY: motionValue(0),
    scrollXProgress: motionValue(0),
    scrollYProgress: motionValue(0),
  }
}

function canAccelerateScroll(
  target: MaybeElementAccessor | undefined,
  offset: ScrollInfoOptions['offset'],
): boolean {
  if (isSSR) return false
  return target
    ? supportsViewTimeline() && !!offsetToViewTimelineRange(offset)
    : supportsScrollTimeline()
}

function makeAccelerateConfig(
  axis: 'x' | 'y',
  options: MaybeAccessor<CreateScrollOptions>,
): AccelerateConfig {
  return {
    factory: (animation: AnimationPlaybackControlsWithThen) => {
      const { container, target, ...rest } = resolveAccessor(options)
      return scroll(animation, {
        ...rest,
        axis,
        container: getElement(container),
        target: getElement(target),
      })
    },
    times: [0, 1],
    keyframes: [0, 1],
    ease: (v: number) => v,
    duration: 1,
  }
}

/**
 * MotionValues tracking scroll position and progress along both axes. The
 * factory lazily reads `options` each time the underlying scroll callback
 * fires, so passing a getter keeps `container` / `target` reactive.
 *
 * Note: when `options` is a getter, `target` / `offset` are resolved here
 * at construction (before mount), so getter-wrapped targets always take the
 * ScrollTimeline path rather than ViewTimeline — matching React's `useScroll`.
 *
 * @example
 * ```tsx
 * const { scrollYProgress } = createScroll()
 * const opacity = createTransform(scrollYProgress, [0, 0.5], [0, 1])
 *
 * return <motion.div style={{ opacity }}>Fade in on scroll</motion.div>
 * ```
 */
export function createScroll(options: MaybeAccessor<CreateScrollOptions> = {}) {
  const values = createScrollMotionValues()

  const { target, offset } = resolveAccessor(options)
  if (canAccelerateScroll(target, offset)) {
    values.scrollXProgress.accelerate = makeAccelerateConfig('x', options)
    values.scrollYProgress.accelerate = makeAccelerateConfig('y', options)
  }

  createEffect(() => {
    if (isSSR) {
      return
    }
    const { container, target, ...rest } = resolveAccessor(options)
    const cleanup = scroll(
      (_progress, { x, y }) => {
        values.scrollX.set(x.current)
        values.scrollXProgress.set(x.progress)
        values.scrollY.set(y.current)
        values.scrollYProgress.set(y.progress)
      },
      {
        ...rest,
        container: getElement(container),
        target: getElement(target),
      },
    )
    onCleanup(() => {
      cleanup()
    })
  })

  return values
}
