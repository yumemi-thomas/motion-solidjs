import { cleanup, render } from '@solidjs/testing-library'
import { rootProjectionNode } from 'motion-dom'
import { MotionGlobalConfig } from 'motion-utils'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import {
  createInstantTransition,
  createResetProjection,
  disableInstantTransitions,
} from '@/primitives'
import { wait } from './helpers'

afterEach(() => {
  cleanup()
  disableInstantTransitions()
})

const box = {
  position: 'absolute',
  top: 0,
  width: '100px',
  height: '100px',
  background: 'red',
} as const

describe('createInstantTransition', () => {
  it('runs the callback with animations disabled, then unlocks within a few frames', async () => {
    const [state, setState] = createSignal(false)
    let startInstantTransition: (cb: () => void) => void = () => {}

    render(() => {
      startInstantTransition = createInstantTransition()
      return (
        <motion.div
          data-testid="box"
          layout
          style={state() ? { ...box, left: '500px' } : { ...box, left: '200px' }}
          transition={{ duration: 10 }}
        />
      )
    })
    // The motion.div layout render registers a root projection node.
    await wait(50)
    expect(rootProjectionNode.current).toBeTruthy()

    let ranWithInstantAnimations = false
    startInstantTransition(() => {
      ranWithInstantAnimations = MotionGlobalConfig.instantAnimations === true
      setState(true)
    })
    expect(ranWithInstantAnimations).toBe(true)
    expect(MotionGlobalConfig.instantAnimations).toBe(true)

    // Unlocks two postRender frames later, matching motion/react.
    await wait(100)
    expect(MotionGlobalConfig.instantAnimations).toBe(false)
  })

  it('disableInstantTransitions unlocks immediately', () => {
    MotionGlobalConfig.instantAnimations = true
    disableInstantTransitions()
    expect(MotionGlobalConfig.instantAnimations).toBe(false)
  })
})

describe('createResetProjection', () => {
  it('is a safe no-op without a projection tree', () => {
    const resetProjection = createResetProjection()
    expect(() => resetProjection()).not.toThrow()
  })

  it('resets the projection tree of rendered layout elements', async () => {
    let resetProjection: () => void = () => {}

    render(() => {
      resetProjection = createResetProjection()
      return <motion.div data-testid="box" layout style={box} />
    })
    await wait(50)

    expect(rootProjectionNode.current).toBeTruthy()
    expect(() => resetProjection()).not.toThrow()
  })
})
