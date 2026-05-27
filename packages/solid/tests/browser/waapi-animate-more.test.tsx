import { cleanup, render } from '@solidjs/testing-library'
import { animateMini, stagger } from 'motion'
import { onCleanup, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { wait } from './helpers'

afterEach(() => cleanup())

function getHTMLElement(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLElement)) throw new Error(`Expected HTMLElement #${id}`)
  return element
}

function expectRef<T>(value: T | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name}`)
  return value
}

// Port of motion-upstream/packages/framer-motion/cypress/integration/animate-style.ts
// (describe("animateMini()")) from github.com/motiondivision/motion.
describe('WAAPI and animateMini additional upstream parity', () => {
  // animate-style.ts: it("autoplay correctly pauses the animation on creation")
  // + it("play correctly resumes the animation") (?test=animate-style-autoplay / -play).
  it('autoplay false starts paused and play resumes', async () => {
    let ref: HTMLDivElement | undefined
    render(() => {
      onMount(() => {
        const controls = animateMini(
          expectRef(ref, 'box'),
          { width: 200 },
          { duration: 0.1, autoplay: false },
        )
        setTimeout(() => controls.play(), 80)
        onCleanup(() => controls.cancel())
      })
      return <div id="box" ref={(el) => (ref = el)} style={{ width: '100px', height: '100px' }} />
    })

    await wait(40)
    expect(getHTMLElement('box').getBoundingClientRect().width).toBe(100)
    await wait(200)
    expect(getHTMLElement('box').getBoundingClientRect().width).toBe(200)
  })

  // animate-style.ts: it("complete() correctly finishes the animation") (?test=animate-style-complete).
  it('complete applies final values synchronously', async () => {
    let ref: HTMLDivElement | undefined
    render(() => {
      onMount(() => {
        const controls = animateMini(expectRef(ref, 'box'), { opacity: 0 }, { duration: 10 })
        controls.complete()
        onCleanup(() => controls.cancel())
      })
      return <div id="box" ref={(el) => (ref = el)} style={{ opacity: 1 }} />
    })

    await wait(50)
    expect(getHTMLElement('box').style.opacity).toBe('0')
  })

  // animate-style.ts: it("pause() correctly pauses the animation") (?test=animate-style-pause).
  it('pause holds an in-flight animation away from the final value', async () => {
    let ref: HTMLDivElement | undefined
    render(() => {
      onMount(() => {
        const controls = animateMini(expectRef(ref, 'box'), { width: 300 }, { duration: 1 })
        setTimeout(() => controls.pause(), 60)
        onCleanup(() => controls.cancel())
      })
      return <div id="box" ref={(el) => (ref = el)} style={{ width: '100px', height: '100px' }} />
    })

    await wait(200)
    expect(getHTMLElement('box').getBoundingClientRect().width).toBeLessThan(300)
  })

  // animate-style.ts: it("fires its promise on end") (?test=animate-style-promise).
  it('promise resolves on completion', async () => {
    let ref: HTMLDivElement | undefined
    render(() => {
      onMount(() => {
        const element = expectRef(ref, 'box')
        const controls = animateMini(element, { width: 200 }, { duration: 0.05 })
        controls.then(() => {
          element.dataset.done = 'true'
        })
        onCleanup(() => controls.cancel())
      })
      return <div id="box" ref={(el) => (ref = el)} style={{ width: '100px', height: '100px' }} />
    })

    await wait(150)
    expect(getHTMLElement('box').dataset.done).toBe('true')
  })

  // animate-style.ts: it("works correctly with stagger") (?test=animate-style-stagger).
  // Unit: motion-upstream/packages/motion-dom/src/utils/__tests__/stagger.test.ts.
  it('supports staggered element animations', async () => {
    render(() => {
      onMount(() => {
        animateMini('.item', { opacity: 1 }, { delay: stagger(0.05), duration: 0.05 })
      })
      return (
        <>
          <div class="item" id="a" style={{ opacity: 0 }} />
          <div class="item" id="b" style={{ opacity: 0 }} />
        </>
      )
    })

    await wait(200)
    expect(getHTMLElement('a').style.opacity).toBe('1')
    expect(getHTMLElement('b').style.opacity).toBe('1')
  })

  // animate-style.ts: it("works correctly with CSS variables") (?test=animate-style-css-var).
  // Unit: motion-upstream/packages/framer-motion/src/animation/animators/waapi/__tests__/css-variables.test.tsx.
  it('animates CSS variables', async () => {
    let ref: HTMLDivElement | undefined
    render(() => {
      onMount(() => {
        animateMini(expectRef(ref, 'box'), { '--x': '100px' }, { duration: 0.05 })
      })
      return <div id="box" ref={(el) => (ref = el)} style={{ '--x': '0px' }} />
    })

    await wait(150)
    expect(getHTMLElement('box').style.getPropertyValue('--x')).toBe('100px')
  })
})
