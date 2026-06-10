import { cleanup, render } from '@solidjs/testing-library'
import { createEffect, createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-instant-undo.ts
// Fixture: motion-upstream/dev/react/src/tests/layout-instant-undo.tsx
//
// The fixture renders a `motion.div layout` whose style toggles between
// left:200 (`a`) and left:500 (`b`). A `useLayoutEffect` immediately
// reverts state to `true` when it becomes `false`, so the box must
// never visibly move — even though the `layout` projection saw the
// intermediate measurement.

const box = {
  position: 'absolute',
  top: 0,
  width: '100px',
  height: '100px',
  background: 'red',
} as const
const a = { ...box, left: '200px' }
const b = { ...box, left: '500px' }

describe('Layout animation: Instant layout undo', () => {
  it('Correctly cancels animation', async () => {
    const [state, setState] = createSignal(true)

    render(() => {
      // Mirror React `useLayoutEffect(() => { if (state===false) setState(true) }, [state])`
      // — synchronously revert state inside the reactive scope.
      createEffect(() => {
        if (state() === false) setState(true)
      })
      return (
        <motion.div
          id="box"
          data-testid="box"
          layout
          style={state() ? a : b}
          onClick={() => setState(!state())}
          transition={{ duration: 10 }}
        />
      )
    })

    await wait(50)
    const $box = document.getElementById('box') as HTMLElement
    expect(Math.round($box.getBoundingClientRect().left)).toBe(200)

    $box.click()
    await wait(50)
    expect(Math.round($box.getBoundingClientRect().left)).toBe(200)
  })
})
