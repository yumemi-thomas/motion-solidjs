// Ported from motion/react: packages/framer-motion/src/motion/__tests__/component.test.tsx
// React-isms translated to Solid: `React.useRef` → `let ref`;
// `React.useLayoutEffect`/`useEffect` → `onMount`; `React.forwardRef` custom
// component → a Solid component that spreads `props.ref`; jest-dom's
// `toHaveStyle`/`toHaveAttribute` → local helpers (colours normalised via the
// DOM, multi-declaration supported with jest-dom's all/any semantics).
// React `<StrictMode>` has no Solid equivalent, so those cases render normally.
import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { motion } from '@/components'
import { nextFrame } from '../../features/gestures/drag-test-utils'

afterEach(() => cleanup())

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()
function styleOf(el: Element, prop: string): string {
  const raw = (el as HTMLElement).style.getPropertyValue(prop)
  if (prop === 'transform' && raw === '') return 'none'
  return raw
}
function cssNormalize(prop: string, value: string): string {
  const d = document.createElement('div')
  d.style.setProperty(prop, value)
  const out = d.style.getPropertyValue(prop)
  return out === '' ? value : out
}
function declsMatch(el: Element, decls: string): boolean {
  for (const part of decls.split(';')) {
    const t = part.trim()
    if (!t) continue
    const idx = t.indexOf(':')
    const prop = t.slice(0, idx).trim()
    const expected = t.slice(idx + 1).trim()
    if (norm(cssNormalize(prop, styleOf(el, prop))) !== norm(cssNormalize(prop, expected))) {
      return false
    }
  }
  return true
}
function expectStyle(el: Element, decls: string) {
  expect(declsMatch(el, decls)).toBe(true)
}
function expectNotStyle(el: Element, decls: string) {
  expect(declsMatch(el, decls)).toBe(false)
}

describe('motion component rendering and styles', () => {
  it('renders', () => {
    const wrapper = render(() => <motion.div />)
    expect(wrapper.container.firstChild).toBeTruthy()
  })

  it('renders motion div component (using motion.create) without type errors', () => {
    const MotionDiv = motion.create('div')
    render(() => <MotionDiv id="myCreatedMotionDiv" onTap={() => {}} />)
    expect(true).toBe(true)
  })

  it('renders HTML and SVG attributes without type errors', () => {
    let ref!: HTMLButtonElement
    const Component = () => (
      <>
        <motion.button title="test" type="button" />
        <motion.button ref={(el) => (ref = el)} />
        <motion.button
          class="test"
          animate={{ rotate: 90 }}
          transition={{ velocity: 0 }}
          style={{ overflow: 'hidden' }}
          onClick={(event: MouseEvent) => event.stopPropagation()}
        />
        <motion.div
          class="test"
          animate={{ rotate: 90 }}
          transition={{ velocity: 0 }}
          style={{ overflow: 'hidden' }}
          onClick={(event: MouseEvent) => event.stopPropagation()}
        />
        <motion.img src="https://framer.com" alt="alternative tag" />
        <motion.a href="https://framer.com" />
        <motion.div role="progressbar" aria-valuemax={100} />
      </>
    )
    const wrapper = render(() => <Component />)
    expect(wrapper.container.firstChild).toBeTruthy()
  })

  it('hydrates a provided ref by the time onMount has fired', () => {
    let hasVanillaRef = false
    let hasMotionRef = false
    let vanillaRef!: HTMLDivElement
    let motionRef!: HTMLDivElement

    const Component = () => {
      onMount(() => {
        if (vanillaRef != null) hasVanillaRef = true
        if (motionRef != null) hasMotionRef = true
      })
      return (
        <>
          <div ref={(el) => (vanillaRef = el)} />
          <motion.div ref={(el) => (motionRef = el)} />
        </>
      )
    }
    render(() => <Component />)
    expect(hasVanillaRef).toBe(true)
    expect(hasMotionRef).toBe(true)
  })

  it('renders child', () => {
    const wrapper = render(() => (
      <motion.div>
        <div data-testid="child" />
      </motion.div>
    ))
    expect(wrapper.getByTestId('child')).toBeTruthy()
  })

  it('renders normal event listeners', () => {
    const onPointerEnter = vi.fn()
    const onPointerLeave = vi.fn()
    const wrapper = render(() => (
      <motion.div onPointerEnter={() => onPointerEnter()} onPointerLeave={() => onPointerLeave()} />
    ))

    fireEvent.pointerEnter(wrapper.container.firstChild as Element)
    fireEvent.pointerLeave(wrapper.container.firstChild as Element)

    expect(onPointerEnter).toBeCalled()
    expect(onPointerLeave).toBeCalled()
  })

  it('renders custom component', async () => {
    const Component = (props: { ref?: (el: HTMLButtonElement) => void }) => (
      <button type="submit" disabled ref={props.ref} />
    )
    const MotionComponent = motion.create(Component)

    const element = await new Promise<Element>((resolve) => {
      render(() => <MotionComponent ref={(r: Element) => resolve(r)} />)
    })
    expect(element).toHaveAttribute('disabled')
  })

  it('accepts ref', async () => {
    let ref!: HTMLButtonElement
    const element = await new Promise<Element>((resolve) => {
      const Component = () => {
        onMount(() => resolve(ref))
        return <motion.button type="submit" ref={(el) => (ref = el)} />
      }
      render(() => <Component />)
    })
    expect(element).toHaveAttribute('type', 'submit')
  })

  it('generates style attribute if passed a special transform style attr', () => {
    const wrapper = render(() => <motion.div style={{ x: 10, background: '#fff' }} />)
    expectStyle(
      wrapper.container.firstChild as Element,
      'transform: translateX(10px); background: #fff',
    )
    expectStyle(wrapper.container.firstChild as Element, 'background: #fff')
  })

  it('generates style attribute if passed initial', () => {
    const wrapper = render(() => <motion.div initial={{ x: 10, background: '#fff' }} />)
    expectStyle(
      wrapper.container.firstChild as Element,
      'transform: translateX(10px); background: rgb(255, 255, 255)',
    )
  })

  it('generates style attribute if passed initial as variant label', () => {
    const variants = { foo: { x: 10, background: '#fff' } }
    const wrapper = render(() => <motion.div initial="foo" variants={variants} />)
    expectStyle(
      wrapper.container.firstChild as Element,
      'transform: translateX(10px); background: rgb(255, 255, 255)',
    )
  })

  it('generates style attribute if passed initial as false', () => {
    const wrapper = render(() => <motion.div initial={false} animate={{ x: 100 }} />)
    expectStyle(wrapper.container.firstChild as Element, 'transform: translateX(100px)')
  })

  it('generates style attribute if passed initial as variant label is function', () => {
    const variants = { foo: (i: number) => ({ x: i * 10 }) }
    const childVariants = { foo: (i: number) => ({ x: i * 10 }) }
    const wrapper = render(() => (
      <motion.div initial="foo" custom={0} variants={variants}>
        <motion.div variants={childVariants} data-testid="a" custom={0} />
        <motion.div variants={childVariants} data-testid="b" custom={1} />
      </motion.div>
    ))
    expectStyle(wrapper.getByTestId('a'), 'transform: none')
    expectStyle(wrapper.getByTestId('b'), 'transform: translateX(10px)')
  })

  it('generates style attribute for children if passed initial as variant label', () => {
    const variants = { foo: { x: 10, background: '#fff' } }
    const childVariants = { foo: { opacity: 0, color: '#f00' } }
    const wrapper = render(() => (
      <motion.div initial="foo" variants={variants}>
        <motion.div variants={childVariants} data-testid="child" />
      </motion.div>
    ))
    expectStyle(wrapper.getByTestId('child'), 'opacity: 0; color: #f00')
  })

  it('generates style attribute for nested children if passed initial as variant label', () => {
    const variants = { foo: { x: 10, background: '#fff' } }
    const childVariants = { foo: { opacity: 0, color: '#f00' } }
    const wrapper = render(() => (
      <motion.div initial="foo" variants={variants}>
        <motion.div variants={childVariants} data-testid="child">
          <motion.div variants={childVariants} data-testid="nestedchild" />
        </motion.div>
      </motion.div>
    ))
    expectStyle(wrapper.getByTestId('nestedchild'), 'opacity: 0; color: #f00')
  })

  it('doesnt propagate style for children if passed initial as object', () => {
    const wrapper = render(() => (
      <motion.ul initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
        <motion.li data-testid="child" />
      </motion.ul>
    ))
    expectNotStyle(wrapper.getByTestId('child'), 'opacity: 0; transform: translateY(50px)')
  })

  it('renders styled component and overwrites style', () => {
    const wrapper = render(() => <motion.div style={{ 'background-color': '#f00' }} />)
    expectStyle(wrapper.container.firstChild as Element, 'background-color: #f00')
  })

  it('renders transform', () => {
    const wrapper = render(() => <motion.div style={{ transform: 'translateX(10px)' }} />)
    expectStyle(wrapper.container.firstChild as Element, 'transform: translateX(10px)')
  })

  it('filters MotionProps from the DOM', () => {
    const wrapper = render(() => <motion.div initial={{ opacity: 0 }} />)
    expect(wrapper.container.firstChild).not.toHaveAttribute('initial')
  })

  it('it can render (StrictMode has no Solid equivalent)', () => {
    const Test = () => <motion.div animate={{ x: 100 }} initial={{ x: 0 }} />
    const wrapper = render(() => <Test />)
    expect(wrapper.container.firstChild).toBeTruthy()
  })

  it('it can render nested components (StrictMode has no Solid equivalent)', () => {
    const Test = () => (
      <motion.div
        animate="visible"
        initial="parent"
        variants={{ visible: { y: 0 }, hidden: { y: 5 } }}
      >
        <motion.span initial="child" variants={{ visible: { y: 0 }, hidden: { y: 5 } }} />
      </motion.div>
    )
    const wrapper = render(() => <Test />)
    expect(wrapper.container.firstChild).toBeTruthy()
  })

  it('layout animations interrupt jump', async () => {
    const result = await new Promise<number>((r) => {
      const Component = () => {
        const [open, setOpen] = createSignal(false)
        let divRef!: HTMLDivElement
        onMount(async () => {
          setOpen(true)
          await new Promise((resolve) => setTimeout(resolve, 1500))
          const firstSize = divRef?.getBoundingClientRect().width || 0
          setOpen(false)
          const secondSize = divRef?.getBoundingClientRect().width || 0
          r(Math.abs(firstSize - secondSize))
        })
        return (
          <motion.div layout="size">
            <motion.div
              layout="size"
              ref={(el) => (divRef = el)}
              style={{ width: open() ? '200px' : '50px' }}
              transition={{ layout: { duration: 2, ease: 'linear' } }}
            />
          </motion.div>
        )
      }
      render(() => <Component />)
    })
    await nextFrame()
    expect(result).toBeLessThan(50)
  })
})
