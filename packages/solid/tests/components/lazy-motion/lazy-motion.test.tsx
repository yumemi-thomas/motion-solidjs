import { render, waitFor } from '@solidjs/testing-library'
import { createEffect } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { domAnimation } from '@/features'
import { LazyMotion } from '@/components/lazy-motion/lazy-motion'
import { injectLazyMotionContext } from '@/components/lazy-motion/context'

describe('LazyMotion', () => {
  it('provides synchronously loaded features to descendants', () => {
    let hasRenderer = false

    function Consumer() {
      const context = injectLazyMotionContext()
      createEffect(() => {
        hasRenderer = Boolean(context.features().renderer)
      })
      return null
    }

    render(() => (
      <LazyMotion features={domAnimation}>
        <Consumer />
      </LazyMotion>
    ))

    expect(hasRenderer).toBe(true)
  })

  it('provides strict mode', () => {
    let strict = false

    function Consumer() {
      const context = injectLazyMotionContext()
      strict = context.strict()
      return null
    }

    render(() => (
      <LazyMotion features={domAnimation} strict>
        <Consumer />
      </LazyMotion>
    ))

    expect(strict).toBe(true)
  })

  it('loads async feature functions', async () => {
    let hasRenderer = false

    function Consumer() {
      const context = injectLazyMotionContext()
      createEffect(() => {
        hasRenderer = Boolean(context.features().renderer)
      })
      return null
    }

    render(() => (
      <LazyMotion features={() => Promise.resolve(domAnimation)}>
        <Consumer />
      </LazyMotion>
    ))

    await waitFor(() => expect(hasRenderer).toBe(true))
  })
})
