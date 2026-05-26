import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, createUniqueId, Show } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { MotionConfig, motion } from '@/components'
import LayoutGroup from '@/components/layout-group'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/layout-group.ts
// Fixture: motion-upstream/dev/react/src/tests/layout-group.tsx
//
// React fixture renders two nested LayoutGroups (the inner one
// `inherit="id"`) so the `#button` element re-uses the outer
// expander/text-wrapper layout id and animates instead of jumping
// when a sibling spacer mounts. Three cypress assertions:
//   1) After clicking #expander, #button slides toward its new top
//      over ~300ms (200ms tween + render buffer). Upstream's absolute
//      `104` is the cypress 500x500 viewport's computed final; in the
//      Solid port's 1000x660 viewport (see `vitest.browser.config.ts`),
//      it resolves to `initialTop + 75` (= expander grow delta).
//   2) Same flow but #button was clicked first to play its own
//      layout animation; same `initialTop + 75` final.
//   3) Clicking #expander twice (with a 50ms gap) returns #button
//      to its original top.
//
// Notes on the Solid port translation:
// - `motion.create(Fragment)` (the `Variants` wrapper in the React
//   fixture) only exists to forward variants through a Fragment in
//   React. The Solid port's `motion.create` takes a string/component,
//   not a Fragment, and the fixture doesn't drive `Variants` props
//   so we render `<Expander />` directly — no behavior loss for this
//   test.
// - `useId()` → `createUniqueId()` from solid-js.

const transition = { layout: { type: 'tween' as const, duration: 0.2 } }

function App() {
  const [visible, setVisible] = createSignal(false)
  return (
    <div
      style={{
        display: 'flex',
        'justify-content': 'center',
        height: '100vh',
      }}
    >
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: '10px',
          'align-items': 'center',
          height: '100vh',
          width: '500px',
        }}
      >
        <Show when={visible()}>
          <div
            style={{
              'background-color': 'green',
              width: '100px',
              height: '100px',
            }}
          />
        </Show>
        <LayoutGroup>
          <MotionConfig transition={transition}>
            <motion.div id="expander-wrapper" layout="position">
              <Expander />
            </motion.div>
            <motion.div
              id="text-wrapper"
              layout="position"
              style={{
                display: 'flex',
                gap: '4px',
                'align-items': 'center',
              }}
            >
              some text
              <LayoutGroup inherit="id">
                <Button onClick={() => setVisible(!visible())} />
              </LayoutGroup>
            </motion.div>
          </MotionConfig>
        </LayoutGroup>
      </div>
    </div>
  )
}

function Expander() {
  const [expanded, setExpanded] = createSignal(false)
  const id = createUniqueId()
  return (
    <motion.div
      id="expander"
      layoutId={id}
      onClick={() => setExpanded(!expanded())}
      style={{
        height: expanded() ? '100px' : '25px',
        'background-color': 'red',
        'margin-bottom': '4px',
        cursor: 'pointer',
      }}
      transition={{ type: 'tween' }}
    >
      {expanded() ? 'collapse' : 'expand'} me
    </motion.div>
  )
}

function Button(props: { onClick?: () => void }) {
  const id = createUniqueId()
  return (
    <motion.div
      id="button"
      layoutId={id}
      style={{
        background: 'blue',
        color: 'white',
        'border-radius': '8px',
        padding: '10px',
        cursor: 'pointer',
      }}
      onClick={props.onClick}
    >
      Add child
    </motion.div>
  )
}

describe('LayoutGroup inherit="id"', () => {
  // Fixed in: LayoutGroup inherit propagation — the outer projection's
  // layout-position update is propagated to inner layoutId-keyed children,
  // so #button tweens to its new top instead of jumping.
  //
  // Upstream uses cypress's 500x500 viewport, where #button's final top
  // resolves to 104 / 204 by absolute math against the fixture's gaps and
  // margins. The Solid port uses playwright's 1000x660 viewport (see
  // `vitest.browser.config.ts`), where the same fixture lands #button 10px
  // lower because the inner flex column's `gap: 10px` between expander-wrapper
  // and text-wrapper resolves to a different rounded pixel offset. Expected
  // final = initialTop + (100 - 25) = initialTop + 75.
  it('relative children should not instantly jump to new layout', async () => {
    render(() => <App />)
    await wait(250)

    const initialTop = Math.round(
      (document.getElementById('button') as HTMLElement).getBoundingClientRect().top,
    )
    const expectedFinal = initialTop + 75
    ;(document.getElementById('expander') as HTMLElement).click()

    await wait(100)
    const top100ms = Math.round(
      (document.getElementById('button') as HTMLElement).getBoundingClientRect().top,
    )
    expect(top100ms).not.toBe(expectedFinal)
    expect(top100ms).not.toBe(initialTop)

    await wait(200)
    const top200ms = Math.round(
      (document.getElementById('button') as HTMLElement).getBoundingClientRect().top,
    )
    expect(top200ms).toBe(expectedFinal)
    expect(top200ms).not.toBe(initialTop)
    expect(top200ms).not.toBe(top100ms)
  })

  // Fixed in: LayoutGroup inherit propagation — running #button's own
  // layoutId animation first then expanding still tweens because the outer
  // layout-position update propagates through the inner LayoutGroup. Same
  // viewport-relative final position as above (initialTop + 75).
  it('relative children should not instantly jump to new layout, after performing their own layout animation', async () => {
    render(() => <App />)
    await wait(250)

    ;(document.getElementById('button') as HTMLElement).click()
    await wait(50)

    const initialTop = Math.round(
      (document.getElementById('button') as HTMLElement).getBoundingClientRect().top,
    )
    const expectedFinal = initialTop + 75

    await wait(300)
    ;(document.getElementById('expander') as HTMLElement).click()

    await wait(100)
    const top100ms = Math.round(
      (document.getElementById('button') as HTMLElement).getBoundingClientRect().top,
    )
    expect(top100ms).not.toBe(expectedFinal)
    expect(top100ms).not.toBe(initialTop)

    await wait(200)
    const top200ms = Math.round(
      (document.getElementById('button') as HTMLElement).getBoundingClientRect().top,
    )
    expect(top200ms).toBe(expectedFinal)
    expect(top200ms).not.toBe(initialTop)
    expect(top200ms).not.toBe(top100ms)
  })

  it('should return to original state when expander is clicked twice with delay', async () => {
    render(() => <App />)
    await wait(250)

    const initialTop = Math.round(
      (document.getElementById('button') as HTMLElement).getBoundingClientRect().top,
    )
    const expectedFinal = initialTop + 75
    ;(document.getElementById('expander') as HTMLElement).click()

    await wait(100)
    const top100ms = Math.round(
      (document.getElementById('button') as HTMLElement).getBoundingClientRect().top,
    )
    expect(top100ms).not.toBe(expectedFinal)
    expect(top100ms).not.toBe(initialTop)

    await wait(50)
    ;(document.getElementById('expander') as HTMLElement).click()

    await wait(300)
    const finalTop = Math.round(
      (document.getElementById('button') as HTMLElement).getBoundingClientRect().top,
    )
    expect(finalTop).toBe(initialTop)
  })
})
