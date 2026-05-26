import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, onMount, Show } from 'solid-js'
import { render as solidRender } from 'solid-js/web'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

/**
 * Port of motion-upstream/packages/framer-motion/cypress/integration/animate-presence-pop-shadow-root.ts
 * Fixture: motion-upstream/dev/react/src/tests/animate-presence-pop-shadow-root.tsx
 *
 * Renders the AnimatePresence tree inside a `ShadowRoot` and asks the
 * popLayout style-injection to target that shadow root via the `root`
 * prop. Without `root`, the injected <style> goes to `document.head`
 * and Constructable-Stylesheet isolation prevents it from affecting the
 * shadow-DOM child.
 */

afterEach(() => cleanup())

interface Bbox {
  top: number
  left: number
  width: number
  height: number
}

function expectBbox(element: HTMLElement, expected: Bbox) {
  const bbox = element.getBoundingClientRect()
  expect(bbox.top).toBe(expected.top)
  expect(bbox.left).toBe(expected.left)
  expect(bbox.width).toBe(expected.width)
  expect(bbox.height).toBe(expected.height)
}

const boxStyle = {
  width: '100px',
  height: '100px',
  'background-color': 'red',
}

function ShadowApp(props: { position?: 'static' | 'relative' }) {
  let host!: HTMLDivElement

  onMount(() => {
    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    const [state, setState] = createSignal(true)
    const itemStyle =
      props.position === 'relative'
        ? { ...boxStyle, position: 'relative' as const, top: '100px', left: '100px' }
        : boxStyle

    // Render the AnimatePresence subtree into the shadow root. We use
    // `solid-js/web`'s `render` directly because `@solidjs/testing-library`'s
    // `render(ui, options)` only accepts options as its second argument —
    // it would ignore a bare element and silently mount into document.body.
    // solidRender's signature is `render(code, element)` and a ShadowRoot is
    // a valid Node target.
    solidRender(
      () => (
        <section
          style={{
            position: 'relative',
            display: 'flex',
            'flex-direction': 'column',
            padding: '100px',
          }}
          onClick={() => setState(!state())}
        >
          <AnimatePresence mode="popLayout" root={shadowRoot}>
            <motion.div id="a" layout transition={{ ease: () => 1 }} style={{ ...itemStyle }} />
            <Show when={state()}>
              <motion.div
                id="b"
                animate={{ opacity: 1, transition: { duration: 0.001 } }}
                exit={{ opacity: 0, transition: { duration: 10 } }}
                layout
                style={{ ...itemStyle, 'background-color': 'green' }}
              />
            </Show>
            <motion.div
              id="c"
              layout
              transition={{ ease: () => 1 }}
              style={{ ...itemStyle, 'background-color': 'blue' }}
            />
          </AnimatePresence>
        </section>
      ),
      shadowRoot as unknown as Node & ParentNode,
    )
  })

  return <div id="shadow" ref={(el) => (host = el)} />
}

function queryShadow(id: string): HTMLElement {
  const host = document.getElementById('shadow') as HTMLElement
  const el = host.shadowRoot!.getElementById(id)
  if (!el) throw new Error(`shadow element not found: ${id}`)
  return el
}

describe('AnimatePresence popLayout with shadowRoot', () => {
  // Fixed in src/components/animate-presence/animate-presence.tsx —
  // AnimatePresence now accepts a `root` prop (defaulting to
  // `document.head`) and `addPopStyle` appends the injected <style>
  // there. Passing the host's ShadowRoot lets the pop rule actually
  // reach the shadow-DOM child.
  it('correctly pops exiting elements out of the DOM', async () => {
    render(() => <ShadowApp />)

    await wait(50)
    expectBbox(queryShadow('b'), { top: 200, left: 100, width: 100, height: 100 })
    expectBbox(queryShadow('c'), { top: 300, left: 100, width: 100, height: 100 })

    ;(queryShadow('a').parentElement as HTMLElement).click()
    await wait(100)
    expectBbox(queryShadow('b'), { top: 200, left: 100, width: 100, height: 100 })
    expectBbox(queryShadow('c'), { top: 200, left: 100, width: 100, height: 100 })

    ;(queryShadow('a').parentElement as HTMLElement).click()
    await wait(100)
    expectBbox(queryShadow('b'), { top: 200, left: 100, width: 100, height: 100 })
    expectBbox(queryShadow('c'), { top: 300, left: 100, width: 100, height: 100 })
  })

  // Fixed by the same `root`-prop wiring; the `position: relative`
  // variant also exercises explicit top/left preservation in the pop
  // style.
  it('correctly pops exiting elements out of the DOM when they already have an explicit top/left', async () => {
    render(() => <ShadowApp position="relative" />)

    await wait(50)
    expectBbox(queryShadow('b'), { top: 300, left: 200, width: 100, height: 100 })
    expectBbox(queryShadow('c'), { top: 400, left: 200, width: 100, height: 100 })

    ;(queryShadow('a').parentElement as HTMLElement).click()
    await wait(100)
    expectBbox(queryShadow('b'), { top: 300, left: 200, width: 100, height: 100 })
    expectBbox(queryShadow('c'), { top: 300, left: 200, width: 100, height: 100 })

    ;(queryShadow('a').parentElement as HTMLElement).click()
    await wait(100)
    expectBbox(queryShadow('b'), { top: 300, left: 200, width: 100, height: 100 })
    expectBbox(queryShadow('c'), { top: 400, left: 200, width: 100, height: 100 })
  })
})
