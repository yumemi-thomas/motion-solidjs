import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { delay } from '#tests/utils'

afterEach(() => {
  cleanup()
})

function mockMatches(element: Element, matches: (selector: string) => boolean) {
  Object.defineProperty(element, 'matches', {
    configurable: true,
    value: matches,
  })
}

function getAnchor(wrapper: ReturnType<typeof render>) {
  const element = wrapper.getByTestId('myAnchorElement')
  if (!(element instanceof HTMLElement)) {
    throw new Error('Expected test element to be an HTMLElement')
  }
  return element
}

describe('focus Gesture', () => {
  it('whileFocus applied', async () => {
    const opacity = motionValue(1)
    const wrapper = render(() => (
      <motion.a
        data-testid="myAnchorElement"
        href="#"
        whileFocus={{ opacity: 0.1 }}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))

    const element = getAnchor(wrapper)
    mockMatches(element, () => true)
    await delay(0)
    element.focus()
    await delay(15)

    expect(opacity.get()).toBe(0.1)
  })

  it('whileFocus not applied when :focus-visible is false', async () => {
    const opacity = motionValue(1)
    const wrapper = render(() => (
      <motion.a
        data-testid="myAnchorElement"
        href="#"
        whileFocus={{ opacity: 0.1 }}
        transition={{ duration: 0 }}
        style={{ opacity }}
      />
    ))

    const element = getAnchor(wrapper)
    mockMatches(element, () => false)
    await delay(0)
    element.focus()
    await delay(0)

    expect(opacity.get()).toBe(1)
  })

  it('focus applied if focus-visible selector throws unsupported', async () => {
    const opacity = motionValue(1)
    const wrapper = render(() => (
      <motion.a
        data-testid="myAnchorElement"
        href="#"
        whileFocus={{ opacity: 0.1 }}
        transition={{ duration: 0 }}
        style={{ opacity }}
      />
    ))

    const element = getAnchor(wrapper)
    mockMatches(element, () => {
      /**
       * Explicitly throw as while Jest throws we want to ensure this
       * behaviour isn't silently fixed should it fix this in the future.
       */
      throw new Error('this selector not supported')
    })
    await delay(0)
    element.focus()
    await delay(0)

    expect(opacity.get()).toBe(0.1)
  })

  it('whileFocus applied as variant', async () => {
    const target = 0.5
    const variant = {
      hidden: { opacity: target },
    }
    const opacity = motionValue(1)
    const wrapper = render(() => (
      <motion.a
        data-testid="myAnchorElement"
        href="#"
        whileFocus="hidden"
        variants={variant}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))

    const element = getAnchor(wrapper)
    mockMatches(element, () => true)
    await delay(0)
    element.focus()
    await delay(15)

    expect(opacity.get()).toBe(target)
  })

  it('whileFocus is unapplied when blurred', async () => {
    const variant = {
      hidden: { opacity: 0.5, transitionEnd: { opacity: 0.75 } },
    }
    const opacity = motionValue(1)
    const wrapper = render(() => (
      <motion.a
        data-testid="myAnchorElement"
        href="#"
        whileFocus="hidden"
        variants={variant}
        transition={{ type: false }}
        style={{ opacity }}
      />
    ))

    const element = getAnchor(wrapper)
    mockMatches(element, () => true)

    await delay(0)
    element.focus()
    await delay(15)
    expect(opacity.get()).toBe(0.75)

    element.blur()
    await delay(15)

    expect(opacity.get()).toBe(1)
  })
})
