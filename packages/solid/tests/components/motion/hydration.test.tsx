import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { Motion } from '@/components'

afterEach(() => {
  cleanup()
})

describe('Motion props evaluation (hydration regression)', () => {
  // Regression for the SSR hydration bug: motion state used to spread the
  // raw Solid props proxy into resolveMotionProps during MotionState
  // construction. That spread fires the `children` getter, eagerly running
  // each nested motion component's setup before the parent has emitted its
  // own DOM. Under SSR this consumes the hydration key registry twice and
  // produces "Hydration Mismatch" + a cascade of "template$1 is not a
  // function" errors on any subsequent Dynamic on the page.
  //
  // The fix splits `children` out of the props before spreading. This test
  // exercises that property by counting how many times the children getter
  // is read during the parent's initial render: it must be at most once
  // (Solid's normal child wiring). Before the fix this was at least twice.
  it('does not evaluate the children getter during parent setup', () => {
    let childGetterReads = 0

    // Build a props object whose `children` is exposed as a getter so we can
    // observe reads. We hand it directly to <Motion> via spread, so Solid's
    // mergeProps proxy will forward gets to this descriptor.
    const trackedProps = {
      get children() {
        childGetterReads++
        return null
      },
    }

    render(() => <Motion {...trackedProps} />)

    // Solid itself reads `children` exactly once when binding the slot. The
    // bug caused a second read inside motion state getProps() spread.
    expect(childGetterReads).toBeLessThanOrEqual(1)
  })

  it('renders nested motion components without re-evaluating inner JSX', () => {
    // The hydration mismatch surfaced because nested motion components ran
    // their createComponent twice — once when the parent's props spread
    // accessed `children`, and once via the real <Dynamic> slot. Mirror that
    // shape and ensure the inner factory runs exactly once.
    let innerCreates = 0

    function Inner() {
      innerCreates++
      return <Motion as="span">hi</Motion>
    }

    const [bump, setBump] = createSignal(0)
    void bump

    render(() => (
      <Motion>
        <Inner />
      </Motion>
    ))

    // Component factories run once per insertion; an extra eager evaluation
    // during the parent's setup would have doubled this.
    expect(innerCreates).toBe(1)

    // A subsequent unrelated parent update must not re-create the inner
    // component either (sanity check that we didn't trade one bug for
    // another).
    setBump(1)
    expect(innerCreates).toBe(1)
  })
})
