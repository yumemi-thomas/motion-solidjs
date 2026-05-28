// Ported from motion/react: packages/framer-motion/src/motion/__tests__/custom.test.tsx
// `React.forwardRef((props, ref) => ...)` → a Solid component reading
// `props.ref`; `useMotionValue` → `motionValue`. motion.create(Component, opts)
// and the forwardMotionProps / type:'svg' options exist in the Solid port.
import { cleanup, render } from '@solidjs/testing-library'
import { motionValue } from 'motion-dom'
import { createRenderEffect, Show, type JSX } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { nextFrame } from '../../features/gestures/drag-test-utils'

afterEach(() => cleanup())

interface Props {
  foo: boolean
}

describe('motion.create()', () => {
  it('accepts custom types', () => {
    const BaseComponent = (props: Props & { ref?: (el: HTMLDivElement) => void }) => (
      <div ref={props.ref} />
    )
    const MotionComponent = motion.create(BaseComponent)
    render(() => <MotionComponent foo />)
  })

  it('accepts normal component', () => {
    const MotionComponent = motion.create((props: Props) => (
      <Show when={props.foo} fallback={null}>
        <div />
      </Show>
    ))
    render(() => <MotionComponent foo />)
  })

  it("doesn't forward motion props but does forward custom props", () => {
    let animate: unknown
    let foo = false
    const BaseComponent = (
      props: Props & { animate?: unknown; ref?: (el: HTMLDivElement) => void },
    ) => {
      createRenderEffect(() => {
        animate = props.animate
        foo = props.foo
      })
      return <div ref={props.ref} />
    }
    const MotionComponent = motion.create(BaseComponent)
    render(() => <MotionComponent foo animate={{ x: 100 }} />)
    expect(animate).toBeUndefined()
    expect(foo).toBe(true)
  })

  it('forwards MotionProps if forwardMotionProps is defined', () => {
    let animate: unknown
    let foo = false
    const BaseComponent = (
      props: Props & { animate?: unknown; ref?: (el: HTMLDivElement) => void },
    ) => {
      createRenderEffect(() => {
        animate = props.animate
        foo = props.foo
      })
      return <div ref={props.ref} />
    }
    const MotionComponent = motion.create(BaseComponent, { forwardMotionProps: true })
    render(() => <MotionComponent foo animate={{ x: 100 }} />)
    expect(animate).toEqual({ x: 100 })
    expect(foo).toBe(true)
  })

  it('forwards MotionValue children as raw values', () => {
    let children: unknown
    const BaseComponent = (
      props: Props & { children?: unknown; ref?: (el: HTMLDivElement) => void },
    ) => {
      createRenderEffect(() => {
        children = props.children
      })
      return <div ref={props.ref} />
    }
    const MotionComponent = motion.create(BaseComponent)
    render(() => <MotionComponent foo>{motionValue(5) as unknown as JSX.Element}</MotionComponent>)
    expect(children).toEqual(5)
  })

  it('Accepts children as a function if original component accepts children as a function', () => {
    const BaseComponent = (props: {
      foo: boolean
      children?: unknown
      ref?: (el: HTMLDivElement) => void
    }) => (
      <div ref={props.ref}>
        {typeof props.children === 'function'
          ? (props.children as (a: { isServer: boolean }) => JSX.Element)({ isServer: false })
          : (props.children as JSX.Element)}
      </div>
    )
    const MotionComponent = motion.create(BaseComponent)
    render(() => <MotionComponent foo>{(() => <div />) as unknown as JSX.Element}</MotionComponent>)
  })
})

describe("motion.create() with type: 'svg'", () => {
  it("animates SVG-specific attributes like viewBox when type is 'svg'", async () => {
    const CustomSVG = (
      props: JSX.SvgSVGAttributes<SVGSVGElement> & { ref?: (el: SVGSVGElement) => void },
    ) => <svg ref={props.ref} {...props} />

    const MotionCustomSVG = motion.create(CustomSVG, { type: 'svg' })
    const wrapper = render(() => (
      <MotionCustomSVG
        data-testid="custom-svg"
        viewBox="0 0 100 100"
        transition={{ type: false }}
        animate={{ viewBox: '100 100 200 200' }}
      />
    ))
    await nextFrame()
    expect(wrapper.getByTestId('custom-svg')).toHaveAttribute('viewBox', '100 100 200 200')
  })
})
