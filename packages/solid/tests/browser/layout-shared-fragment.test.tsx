import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-shared-fragment.ts
// Fixture mirrors dev/react/src/tests/layout-shared-fragment.tsx.
//
// Two sibling components — A and B — each render a single motion.div with
// layoutId="box" inside a Solid Fragment. Toggling state swaps which
// component renders. Under `ease: () => 0.5` and `duration: 1`, the box
// position should land halfway between starts (top:100) and ends (top:300),
// i.e. top:200. If the layoutId snapshot is broken inside fragments the
// element would project from top:0 → 150 instead.

const baseBox = {
  position: 'absolute' as const,
  left: 0,
  background: 'red',
}

const a = { ...baseBox, top: 100, width: 100, height: 100 }
const b = { ...baseBox, top: 300, width: 100, height: 100 }

function A(props: { onClick: () => void }) {
  return (
    <>
      <motion.div
        id="box"
        data-testid="box"
        layoutId="box"
        style={a}
        onClick={props.onClick}
        transition={{ duration: 1, ease: () => 0.5 }}
      />
    </>
  )
}

function B(props: { onClick: () => void }) {
  return (
    <>
      <motion.div
        id="box"
        data-testid="box"
        layoutId="box"
        style={b}
        onClick={props.onClick}
        transition={{ duration: 1, ease: () => 0.5 }}
      />
    </>
  )
}

describe('Shared layout: Fragment', () => {
  it('elements with layoutId inside a Fragment animate from the correct starting position', async () => {
    const [state, setState] = createSignal(true)
    render(() => (
      <Show when={state()} fallback={<B onClick={() => setState(true)} />}>
        <A onClick={() => setState(false)} />
      </Show>
    ))

    await wait(50)
    const box1 = document.getElementById('box') as HTMLElement
    expect(box1.getBoundingClientRect().top).toBe(100)

    box1.click()
    await wait(200)

    const box2 = document.getElementById('box') as HTMLElement
    // ease: () => 0.5 holds at 50%. Halfway between top:100 → top:300 = 200.
    // Without fragment-aware projection snapshot, projection would start
    // at top:0 → midpoint at 150.
    expect(box2.getBoundingClientRect().top).toBe(200)
  })
})
