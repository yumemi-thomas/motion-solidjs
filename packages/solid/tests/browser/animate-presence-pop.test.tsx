import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

interface BoundingBox {
  top: number
  left: number
  width: number
  height: number
}

function expectBbox(element: HTMLElement, expected: Partial<BoundingBox>) {
  const bbox = element.getBoundingClientRect()
  if (expected.left !== undefined) expect(bbox.left).toBe(expected.left)
  if (expected.top !== undefined) expect(bbox.top).toBe(expected.top)
  if (expected.width !== undefined) expect(bbox.width).toBe(expected.width)
  if (expected.height !== undefined) expect(bbox.height).toBe(expected.height)
}

const boxStyles = {
  width: '100px',
  height: '100px',
  'background-color': 'red',
}

type Position = 'static' | 'relative' | 'absolute' | 'fixed'
type Anchor = 'left' | 'right'

interface PopAppProps {
  position?: Position
  anchorX?: Anchor
  layoutContainer?: boolean
}

function PopApp(props: PopAppProps) {
  const [state, setState] = createSignal(true)
  const position = () => props.position ?? 'static'
  const anchorX = () => props.anchorX ?? 'left'
  const itemStyle = () =>
    position() === 'relative' ? { position: position(), top: '100px', left: '100px' } : {}

  const containerStyles = () =>
    props.layoutContainer
      ? {
          position: 'relative' as const,
          display: 'flex',
          'flex-direction': 'column' as const,
          padding: '80px',
          'background-color': 'grey',
          margin: '20px',
        }
      : {
          position: 'relative' as const,
          display: 'flex',
          'flex-direction': 'column' as const,
          padding: '100px',
        }

  const toggle = () => setState(!state())
  const children = (
    <AnimatePresence anchorX={anchorX()} mode="popLayout">
      <motion.div
        id="a"
        layout
        transition={{ ease: () => 1 }}
        style={{ ...boxStyles, ...itemStyle() }}
      />
      <Show when={state()}>
        <motion.div
          id="b"
          animate={{
            opacity: 1,
            transition: { duration: 0.001 },
          }}
          exit={{ opacity: 0, transition: { duration: 10 } }}
          layout
          style={{
            ...boxStyles,
            ...itemStyle(),
            'background-color': 'green',
          }}
        />
      </Show>
      <motion.div
        id="c"
        layout
        transition={{ ease: () => 1 }}
        style={{
          ...boxStyles,
          ...itemStyle(),
          'background-color': 'blue',
        }}
      />
    </AnimatePresence>
  )

  return (
    <Show
      when={props.layoutContainer}
      fallback={
        <div id="container" style={containerStyles()} onClick={toggle}>
          {children}
        </div>
      }
    >
      <motion.div
        id="container"
        layout
        style={containerStyles()}
        onClick={toggle}
        transition={{ duration: 10 }}
      >
        {children}
      </motion.div>
    </Show>
  )
}

function clickContainer() {
  const container = document.getElementById('container') as HTMLElement
  container.click()
}

function runTests(layoutContainer: boolean) {
  const name = `AnimatePresence popLayout${layoutContainer ? ' with layout animations' : ''}`

  // The cypress test asserts viewport-relative positions (top: 200, left: 100 etc).
  // In Solid's vitest browser environment the test root is not anchored at viewport
  // origin and the layout-container variant uses padding: 80px + margin: 20px, so
  // absolute coordinates differ. We assert RELATIVE positions: items #b and #c
  // are at the expected offsets within #container, and that the gap collapses
  // after #b exits (popLayout) then re-expands on re-entry.
  function relBbox(el: HTMLElement) {
    const container = document.getElementById('container') as HTMLElement
    const bbox = el.getBoundingClientRect()
    const cbox = container.getBoundingClientRect()
    return {
      top: bbox.top - cbox.top,
      left: bbox.left - cbox.left,
      width: bbox.width,
      height: bbox.height,
    }
  }

  describe(name, () => {
    it('correctly pops exiting elements out of the DOM', async () => {
      render(() => <PopApp layoutContainer={layoutContainer} />)

      await wait(50)

      const padding = layoutContainer ? 80 : 100
      const b0 = document.getElementById('b') as HTMLElement
      const c0 = document.getElementById('c') as HTMLElement

      // a is at padding, b at padding+100, c at padding+200
      expect(relBbox(b0)).toEqual({
        top: padding + 100,
        left: padding,
        width: 100,
        height: 100,
      })
      expect(relBbox(c0)).toEqual({
        top: padding + 200,
        left: padding,
        width: 100,
        height: 100,
      })

      // Click toggles state — b exits, popLayout pops it out of flow so c
      // collapses up into b's slot.
      clickContainer()
      await wait(100)

      const b1 = document.getElementById('b') as HTMLElement
      const c1 = document.getElementById('c') as HTMLElement
      // b should still be in DOM (exit animation duration: 10s) but absolutely
      // positioned at its original slot.
      expect(relBbox(b1)).toEqual({
        top: padding + 100,
        left: padding,
        width: 100,
        height: 100,
      })
      // c collapses up by 100px.
      expect(relBbox(c1)).toEqual({
        top: padding + 100,
        left: padding,
        width: 100,
        height: 100,
      })

      // Click again — b re-enters, c returns to original slot.
      clickContainer()
      await wait(100)

      const b2 = document.getElementById('b') as HTMLElement
      const c2 = document.getElementById('c') as HTMLElement
      expect(relBbox(b2)).toEqual({
        top: padding + 100,
        left: padding,
        width: 100,
        height: 100,
      })
      expect(relBbox(c2)).toEqual({
        top: padding + 200,
        left: padding,
        width: 100,
        height: 100,
      })
    })

    it('correctly pops exiting elements when they have explicit top/left', async () => {
      render(() => <PopApp layoutContainer={layoutContainer} position="relative" />)

      await wait(50)

      const padding = layoutContainer ? 80 : 100
      // position: relative with top/left adds 100px offset on top of flex slot.
      const b0 = document.getElementById('b') as HTMLElement
      const c0 = document.getElementById('c') as HTMLElement
      expect(relBbox(b0)).toEqual({
        top: padding + 100 + 100,
        left: padding + 100,
        width: 100,
        height: 100,
      })
      expect(relBbox(c0)).toEqual({
        top: padding + 200 + 100,
        left: padding + 100,
        width: 100,
        height: 100,
      })

      clickContainer()
      await wait(100)

      const b1 = document.getElementById('b') as HTMLElement
      const c1 = document.getElementById('c') as HTMLElement
      expect(relBbox(b1)).toEqual({
        top: padding + 200,
        left: padding + 100,
        width: 100,
        height: 100,
      })
      expect(relBbox(c1)).toEqual({
        top: padding + 200,
        left: padding + 100,
        width: 100,
        height: 100,
      })

      clickContainer()
      await wait(100)

      const b2 = document.getElementById('b') as HTMLElement
      const c2 = document.getElementById('c') as HTMLElement
      expect(relBbox(b2)).toEqual({
        top: padding + 200,
        left: padding + 100,
        width: 100,
        height: 100,
      })
      expect(relBbox(c2)).toEqual({
        top: padding + 300,
        left: padding + 100,
        width: 100,
        height: 100,
      })
    })

    it('correctly pops exiting elements when anchorX is right', async () => {
      render(() => <PopApp layoutContainer={layoutContainer} anchorX="right" />)

      await wait(50)

      const padding = layoutContainer ? 80 : 100
      const b0 = document.getElementById('b') as HTMLElement
      const c0 = document.getElementById('c') as HTMLElement
      expect(relBbox(b0)).toEqual({
        top: padding + 100,
        left: padding,
        width: 100,
        height: 100,
      })
      expect(relBbox(c0)).toEqual({
        top: padding + 200,
        left: padding,
        width: 100,
        height: 100,
      })

      clickContainer()
      await wait(100)

      const b1 = document.getElementById('b') as HTMLElement
      const c1 = document.getElementById('c') as HTMLElement
      expect(relBbox(b1)).toEqual({
        top: padding + 100,
        left: padding,
        width: 100,
        height: 100,
      })
      expect(relBbox(c1)).toEqual({
        top: padding + 100,
        left: padding,
        width: 100,
        height: 100,
      })

      clickContainer()
      await wait(100)

      const b2 = document.getElementById('b') as HTMLElement
      const c2 = document.getElementById('c') as HTMLElement
      expect(relBbox(b2)).toEqual({
        top: padding + 100,
        left: padding,
        width: 100,
        height: 100,
      })
      expect(relBbox(c2)).toEqual({
        top: padding + 200,
        left: padding,
        width: 100,
        height: 100,
      })
    })
  })
}

// Silence unused-helper warning for upstream parity helper.
void expectBbox

runTests(false)
runTests(true)
