// Ported from motion/react: packages/framer-motion/src/motion/__tests__/waapi.test.tsx
// Upstream mocks Element.prototype.animate (jsdom has no WAAPI) and asserts the
// exact arguments motion-dom hands to WAAPI. We replicate that mock with
// vi.spyOn, capturing the spy so assertions read it directly (upstream asserts
// on `ref.current.animate`; the prototype spy is equivalent). `useMotionValue`
// → `motionValue`. The two upstream `test.skip` cases stay `it.skip`.
import { cleanup, render } from '@solidjs/testing-library'
import { motionValue, supportsFlags } from 'motion-dom'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { motion } from '@/components'
import { nextFrame } from '../../features/gestures/drag-test-utils'

function setupWaapi() {
  ;(Element.prototype as unknown as { animate: unknown }).animate = (() => {}) as unknown
  return vi.spyOn(Element.prototype, 'animate').mockImplementation((() => {
    // Real resolved Promise rather than a hand-rolled thenable; these tests
    // assert the animate() arguments, not completion timing.
    const animation = {
      cancel: () => {},
      finished: Promise.resolve(),
    } as unknown as Animation & { onfinish?: VoidFunction }
    setTimeout(() => animation.onfinish?.(), 0)
    return animation
  }) as unknown as typeof Element.prototype.animate)
}

let animateSpy: ReturnType<typeof setupWaapi>
beforeEach(() => {
  animateSpy = setupWaapi()
})
afterEach(() => {
  ;(Element.prototype as unknown as { animate: unknown }).animate = undefined
  vi.restoreAllMocks()
  cleanup()
})

describe('WAAPI animations', () => {
  it('opacity animates with WAAPI at default settings', async () => {
    render(() => <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />)
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { opacity: [0, 1], offset: undefined },
      {
        delay: -0,
        duration: 300,
        easing: 'cubic-bezier(0.25, 0.1, 0.35, 1)',
        iterations: 1,
        direction: 'normal',
        fill: 'both',
      },
    )
  })

  it('filter animates with WAAPI at default settings', async () => {
    render(() => (
      <motion.div initial={{ filter: 'brightness(0%)' }} animate={{ filter: 'brightness(50%)' }} />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { filter: ['brightness(0%)', 'brightness(50%)'], offset: undefined },
      {
        delay: -0,
        duration: 300,
        easing: 'cubic-bezier(0.25, 0.1, 0.35, 1)',
        iterations: 1,
        direction: 'normal',
        fill: 'both',
      },
    )
  })

  it('clipPath animates with WAAPI at default settings', async () => {
    render(() => (
      <motion.div initial={{ clipPath: 'inset(100%)' }} animate={{ clipPath: 'inset(0%)' }} />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { clipPath: ['inset(100%)', 'inset(0%)'], offset: undefined },
      {
        delay: -0,
        duration: 300,
        easing: 'cubic-bezier(0.25, 0.1, 0.35, 1)',
        iterations: 1,
        direction: 'normal',
        fill: 'both',
      },
    )
  })

  it('Spring generates linear() easing', async () => {
    supportsFlags.linearEasing = true
    render(() => (
      <motion.div
        initial={{ clipPath: 'inset(100%)' }}
        animate={{ clipPath: 'inset(0%)' }}
        transition={{ type: 'spring' }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toHaveBeenCalled()
    expect(animateSpy).toHaveBeenCalledWith(
      { clipPath: ['inset(100%)', 'inset(0%)'], offset: undefined },
      {
        delay: -0,
        duration: 1050,
        easing:
          'linear(0, 0.0049, 0.019, 0.0413, 0.0707, 0.1062, 0.147, 0.1922, 0.2408, 0.2922, 0.3454, 0.3999, 0.455, 0.51, 0.5646, 0.6181, 0.6701, 0.7204, 0.7685, 0.8143, 0.8574, 0.8978, 0.9353, 0.9699, 1.0014, 1.0299, 1.0553, 1.0778, 1.0973, 1.1141, 1.1281, 1.1395, 1.1485, 1.1552, 1.1597, 1.1623, 1.163, 1.1621, 1.1597, 1.156, 1.1511, 1.1453, 1.1386, 1.1312, 1.1232, 1.1148, 1.1061, 1.0972, 1.0882, 1.0793, 1.0704, 1.0617, 1.0532, 1.045, 1.0372, 1.0298, 1.0228, 1.0162, 1.0101, 1.0045, 0.9994, 0.9948, 0.9907, 0.9871, 0.9839, 0.9812, 0.979, 0.9771, 0.9757, 0.9746, 0.9739, 0.9735, 0.9734, 0.9736, 0.974, 0.9746, 0.9754, 0.9764, 0.9775, 0.9787, 0.98, 0.9814, 0.9828, 0.9843, 0.9857, 0.9872, 0.9886, 0.99, 0.9914, 0.9927, 0.994, 0.9952, 0.9964, 0.9974, 0.9984, 0.9993, 1.0001, 1.0009, 1.0016, 1.0021, 1.0027, 1.0031, 1.0035, 1.0037, 1)',
        iterations: 1,
        direction: 'normal',
        fill: 'both',
      },
    )
    supportsFlags.linearEasing = undefined
  })

  it('Spring generates easeOut easing if linear() not supported', async () => {
    supportsFlags.linearEasing = false
    render(() => (
      <motion.div
        initial={{ clipPath: 'inset(100%)' }}
        animate={{ clipPath: 'inset(0%)' }}
        transition={{ type: 'spring' }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { clipPath: ['inset(100%)', 'inset(0%)'], offset: undefined },
      {
        delay: -0,
        duration: 300,
        easing: 'ease-out',
        iterations: 1,
        direction: 'normal',
        fill: 'both',
      },
    )
    supportsFlags.linearEasing = undefined
  })

  it('transform animates with WAAPI at default settings', async () => {
    render(() => (
      <motion.div
        initial={{ transform: 'translateX(0px)' }}
        animate={{ transform: 'translateX(100px)' }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { transform: ['translateX(0px)', 'translateX(100px)'], offset: undefined },
      {
        delay: -0,
        duration: 300,
        easing: 'cubic-bezier(0.25, 0.1, 0.35, 1)',
        iterations: 1,
        direction: 'normal',
        fill: 'both',
      },
    )
  })

  it('opacity animates with WAAPI when no value is originally provided via initial', async () => {
    render(() => <motion.div animate={{ opacity: 1 }} style={{ opacity: 0 }} />)
    await nextFrame()
    expect(animateSpy).toBeCalled()
  })

  it('opacity animates with WAAPI at default settings with no initial value set', async () => {
    render(() => <motion.div animate={{ opacity: 1 }} style={{ opacity: 0 }} />)
    await nextFrame()
    expect(animateSpy).toBeCalled()
  })

  it('opacity animates with WAAPI at default settings when layout is enabled', async () => {
    render(() => <motion.div animate={{ opacity: 1 }} style={{ opacity: 0 }} layout layoutId="a" />)
    await nextFrame()
    expect(animateSpy).toBeCalled()
  })

  it.skip('WAAPI only receives expected number of calls in Framer configuration with hover gestures enabled', async () => {
    const [isHovered, setIsHovered] = createSignal(false)
    const wrapper = render(() => (
      <motion.div
        initial="none"
        animate={isHovered() ? 'hover' : 'none'}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.div
          style={{ opacity: 0.5 }}
          variants={{ hover: { opacity: 1 } }}
          transition={{ duration: 0.001 }}
        />
      </motion.div>
    ))
    void wrapper.container
    await nextFrame()
    expect(animateSpy).toBeCalledTimes(2)
  })

  it.skip('WAAPI only receives expected number of calls in Framer configuration with tap gestures enabled', async () => {
    const [isPressed, setIsPressed] = createSignal(false)
    render(() => (
      <motion.div
        initial="none"
        animate={isPressed() ? 'press' : 'none'}
        onTapStart={() => setIsPressed(true)}
        onTap={() => setIsPressed(false)}
      >
        <motion.div style={{ opacity: 0.5 }} variants={{ press: { opacity: 1 } }} />
      </motion.div>
    ))
    await nextFrame()
    expect(animateSpy).toBeCalledTimes(2)
  })

  it('WAAPI is called with expected arguments', async () => {
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          repeat: 3,
          repeatType: 'reverse',
          duration: 1,
          delay: 2,
          ease: [0, 0.2, 0.7, 1],
          times: [0.2, 0.9],
        }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { opacity: [0, 1], offset: [0.2, 0.9] },
      {
        delay: 2000,
        duration: 1000,
        easing: 'cubic-bezier(0, 0.2, 0.7, 1)',
        iterations: 4,
        direction: 'alternate',
        fill: 'both',
      },
    )
  })

  it('WAAPI is called with easeOut easing if linear() not supported', async () => {
    supportsFlags.linearEasing = false
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.05, delay: 2, ease: (p: number) => p, times: [0, 1] }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { opacity: [0, 1], offset: [0, 1] },
      {
        delay: 2000,
        duration: 50,
        direction: 'normal',
        easing: 'ease-out',
        fill: 'both',
        iterations: 1,
      },
    )
    supportsFlags.linearEasing = undefined
  })

  it('WAAPI is called with generated linear() easing function when supported', async () => {
    supportsFlags.linearEasing = true
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.05, delay: 2, ease: (p: number) => p }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { opacity: [0, 1], offset: undefined },
      {
        delay: 2000,
        duration: 50,
        direction: 'normal',
        easing: 'linear(0, 0.25, 0.5, 0.75, 1)',
        fill: 'both',
        iterations: 1,
      },
    )
    supportsFlags.linearEasing = undefined
  })

  const easeMap = [
    ['easeIn', 'ease-in'],
    ['easeOut', 'ease-out'],
    ['easeInOut', 'ease-in-out'],
    ['circIn', 'cubic-bezier(0, 0.65, 0.55, 1)'],
    ['circOut', 'cubic-bezier(0.55, 0, 1, 0.45)'],
    ['backIn', 'cubic-bezier(0.31, 0.01, 0.66, -0.59)'],
    ['backOut', 'cubic-bezier(0.33, 1.53, 0.69, 0.99)'],
  ] as const
  for (const [ease, easing] of easeMap) {
    it(`Maps '${ease}' to '${easing}'`, async () => {
      render(() => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease }} />
      ))
      await nextFrame()
      expect(animateSpy).toBeCalled()
      expect(animateSpy).toBeCalledWith(
        { opacity: [0, 1], offset: undefined },
        { easing, delay: -0, duration: 300, direction: 'normal', fill: 'both', iterations: 1 },
      )
    })
  }

  it('WAAPI is called with linear() easing if ease is spring', async () => {
    supportsFlags.linearEasing = true
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', duration: 0.1, bounce: 0 }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { opacity: [0, 1], offset: undefined },
      {
        delay: -0,
        direction: 'normal',
        duration: 100,
        easing: 'linear(0, 0.2738, 0.6079, 0.8122, 0.9157, 0.9637, 0.9848, 0.9938, 0.9975, 1)',
        fill: 'both',
        iterations: 1,
      },
    )
    supportsFlags.linearEasing = undefined
  })

  it("Doesn't animate with WAAPI if repeatDelay is defined", async () => {
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ repeatDelay: 1 }}
      />
    ))
    await nextFrame()
    expect(animateSpy).not.toBeCalled()
  })

  it('Generates linear() easing if ease is anticipate', async () => {
    supportsFlags.linearEasing = true
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ ease: 'anticipate', duration: 0.05 }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { opacity: [0, 0.9], offset: undefined },
      {
        delay: -0,
        direction: 'normal',
        duration: 50,
        easing: 'linear(0, -0.0336, 0.5, 0.9844, 1)',
        fill: 'both',
        iterations: 1,
      },
    )
    supportsFlags.linearEasing = undefined
  })

  it('Generates linear() if ease is backInOut', async () => {
    supportsFlags.linearEasing = true
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ ease: 'backInOut', duration: 0.05 }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { opacity: [0, 0.7], offset: undefined },
      {
        delay: -0,
        direction: 'normal',
        duration: 50,
        easing: 'linear(0, -0.0336, 0.5, 1.0336, 1)',
        fill: 'both',
        iterations: 1,
      },
    )
    supportsFlags.linearEasing = undefined
  })

  it('Generates linear() if ease is circInOut', async () => {
    supportsFlags.linearEasing = true
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ ease: 'circInOut', duration: 0.05 }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { opacity: [0, 0.9], offset: undefined },
      {
        delay: -0,
        direction: 'normal',
        duration: 50,
        easing: 'linear(0, 0.067, 0.5, 0.933, 1)',
        fill: 'both',
        iterations: 1,
      },
    )
    supportsFlags.linearEasing = undefined
  })

  it("Doesn't animate with WAAPI if repeatType is defined as mirror", async () => {
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ repeatType: 'mirror' }}
      />
    ))
    await nextFrame()
    expect(animateSpy).not.toBeCalled()
  })

  it("Doesn't animate with WAAPI if onUpdate is defined", async () => {
    render(() => (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onUpdate={() => {}} />
    ))
    await nextFrame()
    expect(animateSpy).not.toBeCalled()
  })

  it("Doesn't animate transform values with WAAPI if transformTemplate is defined", async () => {
    render(() => (
      <motion.div
        initial={{ transform: 'translate(0px)' }}
        animate={{ transform: 'translate(100px)' }}
        transformTemplate={(_: unknown, t: string) => t}
      />
    ))
    await nextFrame()
    expect(animateSpy).not.toBeCalled()
  })

  it('Does animate non-transform values with WAAPI even if transformTemplate is defined', async () => {
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transformTemplate={(_: unknown, t: string) => t}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
  })

  it("Doesn't animate with WAAPI if external motion value is defined", async () => {
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        style={{ opacity: motionValue(0) }}
      />
    ))
    await nextFrame()
    expect(animateSpy).not.toBeCalled()
  })

  it('Animates with WAAPI if repeat is defined and we need to generate keyframes', async () => {
    supportsFlags.linearEasing = false
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ ease: 'backInOut', duration: 0.05, repeat: 2 }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { opacity: [0, 0.9], offset: undefined },
      {
        delay: -0,
        direction: 'normal',
        duration: 50,
        fill: 'both',
        iterations: 3,
        easing: 'ease-out',
      },
    )
    supportsFlags.linearEasing = undefined
  })

  it('Animates with WAAPI if repeat is Infinity and we need to generate keyframes', async () => {
    supportsFlags.linearEasing = false
    render(() => (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ ease: 'backInOut', duration: 0.05, repeat: Infinity }}
      />
    ))
    await nextFrame()
    expect(animateSpy).toBeCalled()
    expect(animateSpy).toBeCalledWith(
      { opacity: [0, 0.9] },
      {
        delay: -0,
        direction: 'normal',
        duration: 50,
        fill: 'both',
        iterations: Infinity,
        easing: 'ease-out',
      },
    )
    supportsFlags.linearEasing = undefined
  })
})
