import { cleanup, render } from '@solidjs/testing-library'
import { frame } from 'motion-dom'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'

afterEach(() => cleanup())

const nextPostRender = () => new Promise<void>((resolve) => frame.postRender(() => resolve()))
const nextMicrotask = () => Promise.resolve()

function getFirstHTMLElement(container: HTMLElement): HTMLElement {
  const element = container.firstElementChild
  if (!(element instanceof HTMLElement)) throw new Error('Expected first child HTMLElement')
  return element
}

// Ported from framer-motion's src/motion/__tests__/transformTemplate.test.tsx.
describe('framer parity — transformTemplate', () => {
  it('applies transformTemplate on initial render', () => {
    const wrapper = render(() => (
      <motion.div
        initial={{ x: 10 }}
        transformTemplate={({ x }, generated) => `translateY(${x}) ${generated}`}
      />
    ))

    expect(getFirstHTMLElement(wrapper.container).style.transform).toBe(
      'translateY(10px) translateX(10px)',
    )
  })

  it('applies updated transformTemplate', async () => {
    const [double, setDouble] = createSignal(false)
    const wrapper = render(() => (
      <motion.div
        initial={{ x: 10 }}
        transformTemplate={({ x }, generated) => {
          const value = typeof x === 'string' ? parseFloat(x) : Number(x)
          return `translateY(${double() ? value * 2 : value}px) ${generated}`
        }}
      />
    ))

    expect(getFirstHTMLElement(wrapper.container).style.transform).toBe(
      'translateY(10px) translateX(10px)',
    )

    setDouble(true)
    await nextMicrotask()

    expect(getFirstHTMLElement(wrapper.container).style.transform).toBe(
      'translateY(20px) translateX(10px)',
    )
  })

  it('renders transform with transformTemplate', () => {
    const wrapper = render(() => (
      <motion.div
        transformTemplate={(_, generated) => `translateY(20px) ${generated}`}
        style={{ x: 10 }}
      />
    ))

    expect(getFirstHTMLElement(wrapper.container).style.transform).toBe(
      'translateY(20px) translateX(10px)',
    )
  })

  it('renders transformTemplate without any transform', () => {
    const wrapper = render(() => <motion.div transformTemplate={() => 'translateY(20px)'} />)

    expect(getFirstHTMLElement(wrapper.container).style.transform).toBe('translateY(20px)')
  })

  it('removes transformTemplate if prop is removed and transform is changed', async () => {
    const [withTemplate, setWithTemplate] = createSignal(true)
    const [x, setX] = createSignal(10)
    const wrapper = render(() => (
      <motion.div
        transformTemplate={withTemplate() ? () => 'translateY(20px)' : undefined}
        style={{ x: x() }}
      />
    ))

    expect(getFirstHTMLElement(wrapper.container).style.transform).toBe('translateY(20px)')

    setWithTemplate(false)
    setX(20)
    await nextPostRender()

    expect(getFirstHTMLElement(wrapper.container).style.transform).toBe('translateX(20px)')
  })

  it('removes transformTemplate if prop is removed and transform is not changed', async () => {
    const [withTemplate, setWithTemplate] = createSignal(true)
    const wrapper = render(() => (
      <motion.div
        transformTemplate={withTemplate() ? () => 'translateY(20px)' : undefined}
        style={{ x: 10 }}
      />
    ))

    expect(getFirstHTMLElement(wrapper.container).style.transform).toBe('translateY(20px)')

    setWithTemplate(false)
    await nextPostRender()

    expect(getFirstHTMLElement(wrapper.container).style.transform).toBe('translateX(10px)')
  })

  it('removes transformTemplate if prop is removed', async () => {
    const [withTemplate, setWithTemplate] = createSignal(true)
    const wrapper = render(() => (
      <motion.div transformTemplate={withTemplate() ? () => 'translateY(20px)' : undefined} />
    ))

    expect(getFirstHTMLElement(wrapper.container).style.transform).toBe('translateY(20px)')

    setWithTemplate(false)
    await nextPostRender()

    expect(getFirstHTMLElement(wrapper.container).style.transform || 'none').toBe('none')
  })
})
