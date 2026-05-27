import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// motion-ref-forwarding.ts. Solid uses callback refs rather than React
// RefObjects; the parity surface is that user refs receive the DOM element
// and get released when the motion node unmounts.
describe('motion ref forwarding', () => {
  it('calls a user callback ref with the DOM element on mount', async () => {
    let refTag = ''

    render(() => <motion.div id="target" ref={(el) => (refTag = el.tagName)} />)
    await wait(20)

    expect(refTag).toBe('DIV')
  })

  it('keeps motion internals working when a user callback ref is supplied', async () => {
    let node: HTMLDivElement | undefined

    render(() => (
      <motion.div
        id="target"
        ref={(el) => (node = el)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.01 }}
      />
    ))
    await wait(50)

    expect(node).toBe(document.getElementById('target'))
    expect(node?.style.opacity).toBe('1')
  })

  it('does not call stale user refs after unmount/remount', async () => {
    const [shown, setShown] = createSignal(true)
    let first: HTMLDivElement | undefined
    let second: HTMLDivElement | undefined

    render(() => (
      <Show when={shown()} fallback={<motion.div id="second" ref={(el) => (second = el)} />}>
        <motion.div id="first" ref={(el) => (first = el)} />
      </Show>
    ))

    await wait(20)
    setShown(false)
    await wait(20)

    expect(first?.id).toBe('first')
    expect(second?.id).toBe('second')
    expect(document.getElementById('first')).toBeNull()
  })
})
