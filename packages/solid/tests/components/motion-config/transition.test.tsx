import { render } from '@solidjs/testing-library'
import type { Transition } from 'motion-dom'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import MotionConfig from '@/components/motion-config/motion-config'
import { createMotionConfig } from '@/components/motion-config/context'

// Port of upstream `MotionConfig.test.tsx`. Walks the transition-inheritance
// rules:
//   1. transition flows from parent → consumer
//   2. nested config without `inherit` fully replaces parent transition
//   3. nested config with `inherit: true` shallow-merges with parent and
//      strips the `inherit` key (delegated to motion-dom's
//      `resolveTransition`)
//
// `inherit` isn't on motion-dom's `Transition` type because it's a
// configuration directive, not a transition option — declared here so we
// can pass it to JSX without resorting to `as any` at every call site.
type InheritableTransition = Transition & { inherit?: boolean }

const consumerId = 'consumer'

function TypeConsumer() {
  const config = createMotionConfig()
  // `transition.type` is `AnimationGeneratorType = GeneratorFactory |
  // AnimationGeneratorName | false`. The `GeneratorFactory` branch is a
  // function, which Solid would treat as an accessor — narrow to a string
  // before rendering so the JSX child stays a plain text node.
  const typeText = () => {
    const t = config().transition?.type
    return typeof t === 'string' ? t : ''
  }
  return <div data-testid={consumerId}>{typeText()}</div>
}

function TransitionConsumer() {
  const config = createMotionConfig()
  return <div data-testid={consumerId}>{JSON.stringify(config().transition ?? null)}</div>
}

describe('MotionConfig transition propagation', () => {
  it('passes transition down to descendants', () => {
    const result = render(() => (
      <MotionConfig transition={{ type: 'spring' }}>
        <TypeConsumer />
      </MotionConfig>
    ))

    expect(result.getByTestId(consumerId).textContent).toBe('spring')
  })

  it('passes through transition updates reactively', () => {
    const [type, setType] = createSignal<'spring' | 'tween'>('spring')

    const result = render(() => (
      <MotionConfig transition={{ type: type() }}>
        <TypeConsumer />
      </MotionConfig>
    ))

    expect(result.getByTestId(consumerId).textContent).toBe('spring')

    setType('tween')
    expect(result.getByTestId(consumerId).textContent).toBe('tween')
  })

  it('nested MotionConfig fully replaces parent transition', () => {
    const result = render(() => (
      <MotionConfig transition={{ type: 'spring', duration: 1 }}>
        <MotionConfig transition={{ delay: 0.5 }}>
          <TransitionConsumer />
        </MotionConfig>
      </MotionConfig>
    ))

    const transition = JSON.parse(result.getByTestId(consumerId).textContent!)
    expect(transition.delay).toBe(0.5)
    expect(transition.type).toBeUndefined()
    expect(transition.duration).toBeUndefined()
  })
})

describe('MotionConfig transition `inherit` keyword', () => {
  // Delegates to motion-dom's `resolveTransition`: when a child config sets
  // `inherit: true`, the parent's transition is shallow-merged in (child
  // keys win) and the `inherit` key is stripped before consumers see it.
  it('nested MotionConfig with inherit shallow-merges with parent transition', () => {
    const result = render(() => (
      <MotionConfig transition={{ type: 'spring', duration: 1 }}>
        <MotionConfig transition={{ inherit: true, delay: 0.5 } satisfies InheritableTransition}>
          <TransitionConsumer />
        </MotionConfig>
      </MotionConfig>
    ))

    const transition = JSON.parse(result.getByTestId(consumerId).textContent!)
    expect(transition.type).toBe('spring')
    expect(transition.duration).toBe(1)
    expect(transition.delay).toBe(0.5)
  })

  it('inherit key is stripped from resulting transition', () => {
    const result = render(() => (
      <MotionConfig transition={{ type: 'spring' }}>
        <MotionConfig transition={{ inherit: true, delay: 0.5 } satisfies InheritableTransition}>
          <TransitionConsumer />
        </MotionConfig>
      </MotionConfig>
    ))

    const transition = JSON.parse(result.getByTestId(consumerId).textContent!)
    expect(transition).not.toHaveProperty('inherit')
  })

  it('inherit inner keys win over parent keys', () => {
    const result = render(() => (
      <MotionConfig transition={{ type: 'spring', duration: 1 }}>
        <MotionConfig
          transition={{ inherit: true, duration: 2, delay: 0.5 } satisfies InheritableTransition}
        >
          <TransitionConsumer />
        </MotionConfig>
      </MotionConfig>
    ))

    const transition = JSON.parse(result.getByTestId(consumerId).textContent!)
    expect(transition.type).toBe('spring')
    expect(transition.duration).toBe(2)
    expect(transition.delay).toBe(0.5)
  })

  it('inherit cascades through deeply nested MotionConfigs', () => {
    const result = render(() => (
      <MotionConfig transition={{ type: 'spring', duration: 1 }}>
        <MotionConfig transition={{ inherit: true, delay: 0.5 } satisfies InheritableTransition}>
          <MotionConfig
            transition={{ inherit: true, ease: 'easeIn' } satisfies InheritableTransition}
          >
            <TransitionConsumer />
          </MotionConfig>
        </MotionConfig>
      </MotionConfig>
    ))

    const transition = JSON.parse(result.getByTestId(consumerId).textContent!)
    expect(transition.type).toBe('spring')
    expect(transition.duration).toBe(1)
    expect(transition.delay).toBe(0.5)
    expect(transition.ease).toBe('easeIn')
  })
})
