import { cleanup, render } from '@solidjs/testing-library'
import { frame } from 'motion-dom'
import type { VisualElement } from 'motion-dom'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { domAnimation, domMin } from '@/features/dom-animation'
import { domMax } from '@/features/dom-max'
import { mountedStates } from '@/core/create-motion'
import { pointerEnter, pointerLeave } from '#tests/features/gestures/drag-test-utils'

afterEach(() => cleanup())

const nextFrame = () =>
  new Promise<void>((resolve) => {
    frame.postRender(() => resolve())
  })

/**
 * `VisualElement.features` is TS-private but runtime-observable; read it
 * without a type assertion and narrow at runtime.
 */
function featuresOf(ve: VisualElement<Element>): Record<string, unknown> {
  const features: unknown = Reflect.get(ve, 'features')
  if (typeof features !== 'object' || features === null) return {}
  return Object.fromEntries(Object.entries(features))
}

// Regression pins for the Feature-system migration: features are
// instantiated per node by VisualElement.updateFeatures when
// isEnabled(props) matches — not bound wholesale to every node.
describe('feature gating', () => {
  it('instantiates no features on a node without motion props', () => {
    const wrapper = render(() => <motion.div data-testid="m" />)
    const handle = mountedStates.get(wrapper.getByTestId('m'))!
    const features = featuresOf(handle.visualElement!)
    expect(Object.values(features).filter(Boolean)).toEqual([])
    expect(handle.visualElement!.animationState).toBeUndefined()
  })

  it('instantiates only the features whose props are present', () => {
    const wrapper = render(() => (
      <motion.div data-testid="m" animate={{ opacity: 1 }} whileHover={{ opacity: 0.5 }} />
    ))
    const features = featuresOf(mountedStates.get(wrapper.getByTestId('m'))!.visualElement!)
    expect(features.animation).toBeDefined()
    expect(features.hover).toBeDefined()
    expect(features.drag).toBeUndefined()
    expect(features.pan).toBeUndefined()
    expect(features.layout).toBeUndefined()
    expect(features.inView).toBeUndefined()
  })

  it('instantiates a feature when its prop appears after mount', async () => {
    const [hover, setHover] = createSignal<{ opacity: number } | undefined>(undefined)
    const wrapper = render(() => <motion.div data-testid="m" whileHover={hover()} />)
    const ve = mountedStates.get(wrapper.getByTestId('m'))!.visualElement!
    expect(featuresOf(ve).hover).toBeUndefined()

    setHover({ opacity: 0.5 })
    await nextFrame()
    expect(featuresOf(ve).hover).toBeDefined()
  })
})

// Framer parity: a gesture mounts once and stays attached when its prop is
// later removed — dispatch becomes a no-op via the animation state's
// removed-value handling instead of listener teardown.
describe('gesture lifecycle after prop removal', () => {
  it('hover after whileHover removal restores the base value and does not crash', async () => {
    const [whileHover, setWhileHover] = createSignal<{ opacity: number } | undefined>({
      opacity: 0.5,
    })
    const wrapper = render(() => (
      <motion.div data-testid="m" whileHover={whileHover()} transition={{ type: false }} />
    ))
    const el = wrapper.getByTestId('m')
    await nextFrame()

    pointerEnter(el)
    await nextFrame()
    expect(el.style.opacity).toBe('0.5')
    pointerLeave(el)
    await nextFrame()

    setWhileHover(undefined)
    await nextFrame()

    // Listener is still mounted (framer parity); firing it must not
    // re-apply the removed target or throw.
    pointerEnter(el)
    await nextFrame()
    expect(el.style.opacity === '' || el.style.opacity === '1').toBe(true)
    pointerLeave(el)
    await nextFrame()
  })
})

// Bundle shapes: domMin must stay gesture-free (it lives in its own module
// because class heritage defeats tree-shaking — see dom-min.ts), and the
// larger bundles must include their advertised features.
describe('feature bundle shapes', () => {
  it('domMin carries animation only', () => {
    expect(Object.keys(domMin.features)).toEqual(['animation'])
    expect(domMin.projection).toBeUndefined()
  })

  it('domAnimation adds the gesture features', () => {
    expect(Object.keys(domAnimation.features).sort()).toEqual([
      'animation',
      'focus',
      'hover',
      'inView',
      'tap',
    ])
    expect(domAnimation.projection).toBeUndefined()
  })

  it('domMax adds pan, drag, layout and the projection initializer', () => {
    expect(Object.keys(domMax.features).sort()).toEqual([
      'animation',
      'drag',
      'focus',
      'hover',
      'inView',
      'layout',
      'pan',
      'tap',
    ])
    expect(typeof domMax.projection).toBe('function')
  })
})
