import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { LazyMotion, m } from '@/components'
import { domAnimation } from '@/features'
import { wait } from './helpers'

afterEach(() => cleanup())

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

describe('LazyMotion with fast state changes', () => {
  it('animates when state changes before features load', async () => {
    const [isVisible, setIsVisible] = createSignal(false)
    let boxRef!: HTMLDivElement

    render(() => {
      onMount(() => {
        setTimeout(() => setIsVisible(true), 5)
      })
      return (
        <LazyMotion
          features={() =>
            new Promise((resolve) => {
              setTimeout(() => resolve(domAnimation), 50)
            })
          }
        >
          <m.div
            id="box"
            ref={(el) => (boxRef = el)}
            initial={false}
            animate={isVisible() ? 'visible' : 'hidden'}
            variants={variants}
            transition={{ duration: 0.1 }}
            onAnimationComplete={() => {
              if (boxRef) boxRef.dataset.animationComplete = 'true'
            }}
            style={{ width: '100px', height: '100px', background: 'red' }}
          />
        </LazyMotion>
      )
    })

    await wait(300)
    const el = document.getElementById('box') as HTMLElement
    expect(el.dataset.animationComplete).toBe('true')
    expect(getComputedStyle(el).opacity).toBe('1')
  })
})
