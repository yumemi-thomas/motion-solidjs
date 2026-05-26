import { render } from '@solidjs/testing-library'
import { createRoot, createSignal } from 'solid-js'
import type { MotionValue } from 'motion-dom'
import { cancelFrame, frame, motionValue } from 'motion-dom'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { Motion } from '@/components'
import { createTransform } from '@/primitives/create-transform'

describe('createTransform', () => {
  it('maps a motion value through input and output ranges', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(0)
      const opacity = createTransform(x, [0, 100], [0, 1])

      expect(opacity.get()).toBe(0)
      x.set(50)
      await nextFrame()
      expect(opacity.get()).toBe(0.5)

      dispose()
    })
  })

  it('maps through multi-stop input and output ranges', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(-150)
      const opacity = createTransform(x, [-200, -100, 100, 200], [0, 1, 1, 0])

      expect(opacity.get()).toBe(0.5)

      x.set(0)
      await nextFrame()
      expect(opacity.get()).toBe(1)

      x.set(150)
      await nextFrame()
      expect(opacity.get()).toBe(0.5)

      dispose()
    })
  })

  it('supports decreasing input ranges', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(75)
      const opacity = createTransform(x, [100, 0], [0, 1])

      expect(opacity.get()).toBe(0.25)

      x.set(25)
      await nextFrame()
      expect(opacity.get()).toBe(0.75)

      dispose()
    })
  })

  it('clamps output by default and extrapolates when clamp is false', () => {
    const x = motionValue(200)
    const clamped = createTransform(x, [0, 100], [0, 1])
    const unclamped = createTransform(x, [0, 100], [0, 1], { clamp: false })

    expect(clamped.get()).toBe(1)
    expect(unclamped.get()).toBe(2)
  })

  it('supports easing value mapping', () => {
    const x = motionValue(0.5)
    const opacity = createTransform(x, [0, 1], [0, 1], { ease: (progress) => progress ** 2 })

    expect(opacity.get()).toBe(0.25)
  })

  it('supports a custom mixer', () => {
    const x = motionValue(0.5)
    const mixed = createTransform(x, [0, 1], [0, 1], {
      mixer: (from, to) => (progress) => `${from}-${to}-${progress}`,
    })

    expect(mixed.get()).toBe('0-1-0.5')
  })

  it('updates when a reactive input range changes', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(50)
      const [inputRange, setInputRange] = createSignal([0, 100])
      const opacity = createTransform(x, inputRange, [0, 1])

      expect(opacity.get()).toBe(0.5)
      setInputRange([0, 50])
      x.set(25)
      await nextFrame()
      expect(opacity.get()).toBe(0.5)

      dispose()
    })
  })

  it('updates when a reactive input range changes without changing the input value', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(50)
      const [inputRange, setInputRange] = createSignal([0, 100])
      const opacity = createTransform(x, inputRange, [0, 1])

      expect(opacity.get()).toBe(0.5)

      setInputRange([0, 50])
      await nextFrame()
      expect(opacity.get()).toBe(1)

      dispose()
    })
  })

  it('supports transformer functions', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(2)
      const doubled = createTransform(x, (value) => value * 2)

      expect(doubled.get()).toBe(4)
      x.set(4)
      await nextFrame()
      expect(doubled.get()).toBe(8)

      dispose()
    })
  })

  it('supports transformer functions with multiple motion values', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(4)
      const y = motionValue('5px')
      const z = createTransform([x, y], ([latestX, latestY]) => latestX * parseFloat(latestY))

      expect(z.get()).toBe(20)

      x.set(5)
      await nextFrame()
      expect(z.get()).toBe(25)

      y.set('6px')
      await nextFrame()
      expect(z.get()).toBe(30)

      dispose()
    })
  })

  it('supports computed transformer functions with collected motion values', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(4)
      const y = motionValue('5px')
      const z = createTransform(() => x.get() * parseFloat(y.get()))

      expect(z.get()).toBe(20)

      x.set(5)
      await nextFrame()
      expect(z.get()).toBe(25)

      y.set('6px')
      await nextFrame()
      expect(z.get()).toBe(30)

      dispose()
    })
  })

  it('is strongly typed', () => {
    const x = motionValue(0)
    const y = motionValue('5px')

    const output = createTransform(x, [0, 1], ['0px', '1px'])
    expectTypeOf(output).toEqualTypeOf<MotionValue<string>>()

    const doubled = createTransform(x, (value) => {
      expectTypeOf(value).toEqualTypeOf<number>()
      return value * 2
    })
    expectTypeOf(doubled).toEqualTypeOf<MotionValue<number>>()

    const combined = createTransform([x, y] as const, ([latestX, latestY]: [number, string]) => {
      expectTypeOf(latestX).toEqualTypeOf<number>()
      expectTypeOf(latestY).toEqualTypeOf<string>()
      return latestX * parseFloat(latestY)
    })
    expectTypeOf(combined).toEqualTypeOf<MotionValue<number>>()

    const mapped = createTransform(x, [0, 1], {
      filter: ['blur(10px)', 'blur(0px)'],
      opacity: [0, 1],
    })
    expectTypeOf(mapped.filter).toEqualTypeOf<MotionValue<string>>()
    expectTypeOf(mapped.opacity).toEqualTypeOf<MotionValue<number>>()

    expect(() => {
      // @ts-expect-error range transforms require a numeric MotionValue
      createTransform(y, [0, 1], [0, 1])
    }).toThrow('createTransform range transforms require a numeric MotionValue')

    expect(() => {
      // @ts-expect-error MotionValue arrays require a transformer function
      createTransform([x, y] as const, [0, 1], [0, 1])
    }).toThrow('createTransform requires a transformer function when input is a MotionValue array')

    expect(() => {
      // @ts-expect-error output maps must contain output range arrays
      createTransform(x, [0, 1], { opacity: 1 })
    }).toThrow('createTransform output maps require output range arrays')
  })

  it('updates computed transformer functions with frame scheduling', async () => {
    await createRoot(async (dispose) => {
      const x = motionValue(0)
      const y = motionValue(0)
      const z = createTransform(() => x.get() + y.get())

      const setY = () => y.set(2)
      const setX = () => {
        x.set(1)
        frame.update(setY)
      }
      const checkFrame = () => {
        expect(z.get()).toBe(3)
      }

      try {
        await new Promise<void>((resolve) => {
          frame.read(setX)
          frame.postRender(() => {
            checkFrame()
            resolve()
          })
        })
      } finally {
        cancelFrame(setY)
        cancelFrame(checkFrame)
        dispose()
      }
    })
  })

  describe('accelerate propagation', () => {
    it('propagates accelerate config from input to output for range transforms', () => {
      const x = motionValue(0)
      const mockAccelerate = {
        factory: () => ({ stop: () => {} }) as any,
        times: [0, 1],
        keyframes: [0, 1],
        ease: (v: number) => v,
        duration: 1,
      }
      x.accelerate = mockAccelerate

      const opacity = createTransform(x, [0, 1], [0, 1])

      expect(opacity.accelerate).toBeDefined()
      expect(opacity.accelerate!.times).toEqual([0, 1])
      expect(opacity.accelerate!.keyframes).toEqual([0, 1])
      expect(opacity.accelerate!.isTransformed).toBe(true)
      expect(opacity.accelerate!.factory).toBe(mockAccelerate.factory)
    })

    it('does not propagate accelerate when transformer is a function', () => {
      const x = motionValue(0)
      x.accelerate = createAccelerateConfig()

      const doubled = createTransform(x, (value) => value * 2)

      expect(doubled.accelerate).toBeUndefined()
    })

    it('does not propagate accelerate when clamp is false', () => {
      const x = motionValue(0)
      x.accelerate = createAccelerateConfig()

      const opacity = createTransform(x, [0, 1], [0, 1], { clamp: false })

      expect(opacity.accelerate).toBeUndefined()
    })

    it('does not propagate accelerate when already transformed', () => {
      const x = motionValue(0)
      x.accelerate = {
        ...createAccelerateConfig(),
        isTransformed: true,
      }

      const opacity = createTransform(x, [0, 1], [0, 1])

      expect(opacity.accelerate).toBeUndefined()
    })

    it('uses resolved inputRange value when inputRange is reactive', async () => {
      await createRoot(async (dispose) => {
        const x = motionValue(0)
        const [inputRange] = createSignal([0, 100])
        x.accelerate = createAccelerateConfig()

        const opacity = createTransform(x, inputRange, [0, 1])

        expect(opacity.accelerate).toBeDefined()
        expect(opacity.accelerate!.times).toEqual([0, 100])

        dispose()
      })
    })
  })

  describe('multi-output transform', () => {
    it('transforms a single input to multiple outputs', () => {
      const x = motionValue(0)
      const result = createTransform(x, [0, 100], {
        opacity: [0, 1],
        scale: [0.5, 1],
      })

      expect(result).toHaveProperty('opacity')
      expect(result).toHaveProperty('scale')
      expect(result.opacity.get()).toBe(0)
      expect(result.scale.get()).toBe(0.5)
    })

    it('updates multiple outputs when input changes', async () => {
      const x = motionValue(0)
      const result = createTransform(x, [0, 100], {
        opacity: [0, 1],
        scale: [0.5, 1],
      })

      x.set(50)
      await nextFrame()
      expect(result.opacity.get()).toBe(0.5)
      expect(result.scale.get()).toBe(0.75)

      x.set(100)
      await nextFrame()
      expect(result.opacity.get()).toBe(1)
      expect(result.scale.get()).toBe(1)
    })

    it('supports reactive inputRange with multi-output transforms', async () => {
      await createRoot(async (dispose) => {
        const x = motionValue(50)
        const [inputRange, setInputRange] = createSignal([0, 100])
        const result = createTransform(x, inputRange, {
          opacity: [0, 1],
          scale: [0.5, 1],
        })

        expect(result.opacity.get()).toBe(0.5)
        expect(result.scale.get()).toBe(0.75)

        setInputRange([0, 50])
        await nextFrame()
        expect(result.opacity.get()).toBe(1)
        expect(result.scale.get()).toBe(1)

        dispose()
      })
    })

    it('supports transform options with clamp enabled', () => {
      const x = motionValue(150)
      const result = createTransform(
        x,
        [0, 100],
        {
          opacity: [0, 1],
          scale: [0.5, 1],
        },
        { clamp: true },
      )

      expect(result.opacity.get()).toBe(1)
      expect(result.scale.get()).toBe(1)
    })

    it('supports transform options with clamp disabled', () => {
      const x = motionValue(150)
      const result = createTransform(
        x,
        [0, 100],
        {
          opacity: [0, 1],
          scale: [0.5, 1],
        },
        { clamp: false },
      )

      expect(result.opacity.get()).toBeGreaterThan(1)
      expect(result.scale.get()).toBeGreaterThan(1)
    })

    it('applies transform options to each output map value', () => {
      const x = motionValue(250)
      const result = createTransform(
        x,
        [0, 200],
        {
          opacity: [0, 0.5],
        },
        { clamp: false },
      )

      expect(result.opacity.get()).toBe(0.625)
    })

    it('applies easing to each output map value', () => {
      const x = motionValue(0.5)
      const result = createTransform(
        x,
        [0, 1],
        {
          opacity: [0, 1],
          scale: [1, 2],
        },
        { ease: (progress) => progress ** 2 },
      )

      expect(result.opacity.get()).toBe(0.25)
      expect(result.scale.get()).toBe(1.25)
    })

    it('applies a custom mixer to each output map value', () => {
      const x = motionValue(0.5)
      const result = createTransform(
        x,
        [0, 1],
        {
          opacity: [0, 1],
          scale: [1, 2],
        },
        { mixer: () => () => 42 },
      )

      expect(result.opacity.get()).toBe(42)
      expect(result.scale.get()).toBe(42)
    })

    it('works in Motion component styles', async () => {
      const x = motionValue(0)
      const transformed = createTransform(x, [0, 100], {
        opacity: [0, 1],
        scale: [0.5, 1],
      })

      const { container } = render(() => (
        <Motion
          style={{
            opacity: transformed.opacity,
            scale: transformed.scale,
            x,
          }}
        />
      ))

      x.set(100)
      await nextFrame()

      const element = container.firstElementChild as HTMLElement
      expect(element.style.opacity).toBe('1')
    })

    it('handles non-numeric output ranges', async () => {
      const x = motionValue(0)
      const result = createTransform(x, [0, 100], {
        backgroundColor: ['#000000', '#ffffff'],
        borderRadius: ['0px', '10px'],
      })

      expect(result.backgroundColor.get()).toBe('rgba(0, 0, 0, 1)')
      expect(result.borderRadius.get()).toBe('0px')

      x.set(50)
      await nextFrame()
      expect(result.backgroundColor.get()).toBe('rgba(180, 180, 180, 1)')
      expect(result.borderRadius.get()).toBe('5px')
    })
  })

  describe('CSS logical properties', () => {
    it('supports paddingBlock with numeric values', async () => {
      const scrollY = motionValue(0)
      const paddingBlock = createTransform(scrollY, [0, 100], [0, 100])

      const { container } = render(() => <Motion style={{ paddingBlock }} />)
      const element = container.firstElementChild as HTMLElement

      await nextFrame()
      expect(element.style.paddingBlock).toBe('0px')

      scrollY.set(50)
      await nextFrame()
      expect(element.style.paddingBlock).toBe('50px')
    })

    it('supports inset shorthand with numeric values', async () => {
      const scrollY = motionValue(0)
      const inset = createTransform(scrollY, [0, 100], [0, 100])

      const { container } = render(() => <Motion style={{ inset }} />)
      const element = container.firstElementChild as HTMLElement

      await nextFrame()
      expect(element.style.inset).toBe('0px')

      scrollY.set(50)
      await nextFrame()
      expect(element.style.inset).toBe('50px')
    })

    it('supports other logical inset and spacing properties', () => {
      const progress = motionValue(25)

      const { container } = render(() => (
        <Motion
          style={{
            insetBlock: createTransform(progress, [0, 100], [0, 100]),
            insetInline: createTransform(progress, [0, 100], [0, 100]),
            marginBlock: createTransform(progress, [0, 100], [0, 100]),
            paddingInline: createTransform(progress, [0, 100], [0, 100]),
          }}
        />
      ))
      const element = container.firstElementChild as HTMLElement

      expect(element.style.insetBlock).toBe('25px')
      expect(element.style.insetInline).toBe('25px')
      expect(element.style.marginBlock).toBe('25px')
      expect(element.style.paddingInline).toBe('25px')
    })
  })
})

function nextFrame() {
  return new Promise((resolve) => setTimeout(resolve, 20))
}

function createAccelerateConfig() {
  return {
    factory: () => ({ stop: () => {} }) as any,
    times: [0, 1],
    keyframes: [0, 1],
    ease: (v: number) => v,
    duration: 1,
  }
}
