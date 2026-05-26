import { afterEach, describe, expect, it } from 'vitest'
import { createSignal, Show } from 'solid-js'
import { render } from 'solid-js/web'
import { AnimatePresence, motion } from '@/components'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.innerHTML = ''
})

describe('AnimatePresence custom prop', () => {
  it('exit variant function receives custom value', async () => {
    const exitCalls: unknown[] = []
    const [show, setShow] = createSignal(true)

    const variants = {
      visible: { opacity: 1 },
      hidden: (custom: unknown) => {
        exitCalls.push(custom)
        return { opacity: 0 }
      },
    }

    function App() {
      return (
        <AnimatePresence custom={42}>
          <Show when={show()}>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={variants}
              transition={{ duration: 0.05 }}
            />
          </Show>
        </AnimatePresence>
      )
    }

    dispose = render(() => <App />, document.body)

    await delay(50)

    exitCalls.length = 0
    setShow(false)

    await delay(100)

    expect(exitCalls.length).toBeGreaterThan(0)
    expect(exitCalls[0]).toBe(42)
  })

  it('exit variant receives updated custom when changed before removal', async () => {
    const exitCalls: unknown[] = []

    const [show, setShow] = createSignal(true)
    const [custom, setCustom] = createSignal(1)

    const variants = {
      visible: { opacity: 1 },
      hidden: (value: unknown) => {
        exitCalls.push(value)
        return { opacity: 0 }
      },
    }

    function App() {
      return (
        <AnimatePresence custom={custom()}>
          <Show when={show()}>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={variants}
              transition={{ duration: 0.05 }}
            />
          </Show>
        </AnimatePresence>
      )
    }

    dispose = render(() => <App />, document.body)

    await delay(50)

    exitCalls.length = 0

    setCustom(-1)
    setShow(false)

    await delay(100)

    expect(exitCalls.length).toBeGreaterThan(0)
    expect(exitCalls[0]).toBe(-1)
  })
})
