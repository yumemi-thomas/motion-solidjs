import { cleanup, render } from '@solidjs/testing-library'
import { onMount, onCleanup } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import type { AnimationOptions } from 'motion-dom'
import { spring } from 'motion-dom'
import { pipe } from 'motion-utils'
import { scroll } from 'motion'
import { createAnimate } from '@/primitives/create-animate'
import { createAnimateMini } from '@/primitives/create-animate-mini'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/scroll.ts
// — `scroll-default-ease` sub-test. Verifies the same easing through
// createAnimate (useAnimate) and createAnimateMini (useAnimateMini)
// produces matching transforms when driven by scroll(). Upstream uses
// `cy.viewport(400, 400)` and scrolls 1250px; we scroll proportionally
// for the test viewport (1000x660).
describe('scroll-default-ease', () => {
  it('applies the same easing across createAnimate and createAnimateMini', async () => {
    const labels: Record<string, HTMLDivElement> = {}
    const setLabel = (k: string) => (el: HTMLDivElement) => (labels[k] = el)

    render(() => {
      const [scopeDefault, miniAnimateDefault] = createAnimateMini<HTMLDivElement>()
      const [scopeEaseOut, miniAnimateEaseOut] = createAnimateMini<HTMLDivElement>()
      const [scopeSpring, miniAnimateSpring] = createAnimateMini<HTMLDivElement>()
      const [scopeAnimateDefault, animateDefault] = createAnimate<HTMLDivElement>()
      const [scopeAnimateEaseOut, animateEaseOut] = createAnimate<HTMLDivElement>()
      const [scopeAnimateSpring, animateSpring] = createAnimate<HTMLDivElement>()
      const [scopeAnimateMTDefault, animateMTDefault] = createAnimate<HTMLDivElement>()
      const [scopeAnimateMTEaseOut, animateMTEaseOut] = createAnimate<HTMLDivElement>()
      const [scopeAnimateMTSpring, animateMTSpring] = createAnimate<HTMLDivElement>()

      function scrollAnimate(
        scope: { current: HTMLDivElement | null },
        anim: any,
        options?: AnimationOptions,
      ): VoidFunction {
        if (!scope.current) return () => {}
        return scroll(
          anim(scope.current, { transform: ['translate(0px)', 'translateX(100px)'] }, options),
        )
      }

      onMount(() => {
        const dispose = pipe(
          scrollAnimate(scopeDefault, miniAnimateDefault),
          scrollAnimate(scopeEaseOut, miniAnimateEaseOut, { ease: 'easeOut' }),
          scrollAnimate(scopeSpring, miniAnimateSpring, { type: spring }),
          scrollAnimate(scopeAnimateDefault, animateDefault),
          scrollAnimate(scopeAnimateEaseOut, animateEaseOut, { ease: 'easeOut' }),
          scrollAnimate(scopeAnimateSpring, animateSpring, { type: spring }),
          scrollAnimate(scopeAnimateMTDefault, animateMTDefault, {
            repeatDelay: 0.0001,
          }),
          scrollAnimate(scopeAnimateMTEaseOut, animateMTEaseOut, {
            ease: 'easeOut',
            repeatDelay: 0.0001,
          }),
          scrollAnimate(scopeAnimateMTSpring, animateMTSpring, {
            type: spring,
            repeatDelay: 0.0001,
          }),
        ) as VoidFunction
        onCleanup(() => dispose?.())
      })

      const progressStyle = {
        width: '100px',
        height: '100px',
        'background-color': 'white',
        color: 'black',
      }
      const containerStyle = { height: '500vh' }
      const scrollContainer = {
        position: 'fixed' as const,
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
      }

      // Multi-ref helper: assign to both scope.set (for animate target)
      // and our `labels` map (for boundingClientRect lookup).
      const multiRef =
        (scopeSet: (el: HTMLDivElement | null) => void, key: string) => (el: HTMLDivElement) => {
          scopeSet(el)
          labels[key] = el
        }

      return (
        <div style={containerStyle}>
          <div style={scrollContainer}>
            <div ref={multiRef(scopeDefault.set, 'miniDefault')} style={progressStyle}>
              mini - default
            </div>
            <div ref={multiRef(scopeEaseOut.set, 'miniEaseOut')} style={progressStyle}>
              mini - easeOut
            </div>
            <div ref={multiRef(scopeSpring.set, 'miniSpring')} style={progressStyle}>
              mini - spring
            </div>
            <div ref={multiRef(scopeAnimateDefault.set, 'animateDefault')} style={progressStyle}>
              animate - default
            </div>
            <div ref={multiRef(scopeAnimateEaseOut.set, 'animateEaseOut')} style={progressStyle}>
              animate - easeOut
            </div>
            <div ref={multiRef(scopeAnimateSpring.set, 'animateSpring')} style={progressStyle}>
              animate - spring
            </div>
            <div ref={multiRef(scopeAnimateMTDefault.set, 'mtDefault')} style={progressStyle}>
              animate main thread - default
            </div>
            <div ref={multiRef(scopeAnimateMTEaseOut.set, 'mtEaseOut')} style={progressStyle}>
              animate main thread - easeOut
            </div>
            <div ref={multiRef(scopeAnimateMTSpring.set, 'mtSpring')} style={progressStyle}>
              animate main thread - spring
            </div>
          </div>
        </div>
      )
    })

    // Scroll halfway through the 500vh container. With viewport 660 and
    // total height = 5 * 660 = 3300, max scroll = 2640. Aim for ~78%
    // progress (matches upstream 1250/1600).
    await wait(100)
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, Math.round(max * 0.78))
    await wait(300)

    const left = (key: string) => labels[key].getBoundingClientRect().left

    // mini default vs animate default (same easing) should match.
    expect(left('miniDefault')).toBeCloseTo(left('animateDefault'), 4)
    // mini easeOut vs animate easeOut should match.
    expect(left('miniEaseOut')).toBeCloseTo(left('animateEaseOut'), 4)
    // main-thread default matches animate default.
    expect(left('mtDefault')).toBeCloseTo(left('animateDefault'), 4)
    // main-thread easeOut matches animate easeOut (rounded to 1px).
    expect(Math.round(left('mtEaseOut'))).toBe(Math.round(left('animateEaseOut')))

    // Different easing functions should produce different positions.
    expect(left('miniDefault')).not.toBe(left('miniEaseOut'))
    expect(left('miniDefault')).not.toBe(left('miniSpring'))
    expect(left('mtDefault')).not.toBe(left('mtEaseOut'))
    expect(left('mtDefault')).not.toBe(left('mtSpring'))
  })
})
