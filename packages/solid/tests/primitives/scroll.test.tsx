import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { delay } from '#tests/utils'
import { createScroll } from '@/primitives/create-scroll'

const scrollMocks = vi.hoisted(() => {
  const cleanup = vi.fn<() => void>()
  const scroll = vi.fn((callback: (...args: any[]) => any, _options?: any) => {
    if (typeof callback === 'function') {
      callback(0.5, {
        x: { current: 10, progress: 0.25 },
        y: { current: 20, progress: 0.5 },
      })
    }
    return cleanup
  })

  return {
    cleanup,
    scroll,
    supportsScrollTimeline: vi.fn(() => false),
    supportsViewTimeline: vi.fn(() => false),
  }
})

vi.mock('motion', async () => {
  const actual = await vi.importActual<typeof import('motion')>('motion')

  return {
    ...actual,
    scroll: scrollMocks.scroll,
  }
})

vi.mock('motion-dom', async () => {
  const actual = await vi.importActual<typeof import('motion-dom')>('motion-dom')

  return {
    ...actual,
    supportsScrollTimeline: scrollMocks.supportsScrollTimeline,
    supportsViewTimeline: scrollMocks.supportsViewTimeline,
  }
})

describe('createScroll', () => {
  beforeEach(() => {
    scrollMocks.cleanup.mockClear()
    scrollMocks.scroll.mockClear()
    scrollMocks.supportsScrollTimeline.mockReset()
    scrollMocks.supportsScrollTimeline.mockReturnValue(false)
    scrollMocks.supportsViewTimeline.mockReset()
    scrollMocks.supportsViewTimeline.mockReturnValue(false)
  })

  afterEach(() => {
    cleanup()
  })

  it('returns four motion values', () => {
    let values: ReturnType<typeof createScroll> | undefined

    render(() => {
      values = createScroll()
      return <div />
    })

    expect(values!.scrollX.get()).toBe(10)
    expect(values!.scrollY.get()).toBe(20)
    expect(values!.scrollXProgress.get()).toBe(0.25)
    expect(values!.scrollYProgress.get()).toBe(0.5)
  })

  it('calls scroll with default options when no options are provided', () => {
    render(() => {
      createScroll()
      return <div />
    })

    expect(scrollMocks.scroll).toHaveBeenCalledTimes(1)
    const [, options] = scrollMocks.scroll.mock.calls[0]
    expect(options.axis).toBeUndefined()
    expect(options.offset).toBeUndefined()
    expect(options.container).toBeUndefined()
    expect(options.target).toBeUndefined()
  })

  it('passes static axis and offset options', () => {
    const offset = ['start end', 'end start'] as any

    render(() => {
      createScroll({ axis: 'x', offset })
      return <div />
    })

    const [, options] = scrollMocks.scroll.mock.calls[0]
    expect(options.axis).toBe('x')
    expect(options.offset).toEqual(offset)
  })

  it('supports whole-options accessors for reactivity', async () => {
    const [axis, setAxis] = createSignal<'x' | 'y'>('x')

    render(() => {
      createScroll(() => ({ axis: axis() }))
      return <div />
    })

    expect(scrollMocks.scroll).toHaveBeenCalledTimes(1)
    expect(scrollMocks.scroll.mock.calls[0][1].axis).toBe('x')

    setAxis('y')
    await Promise.resolve()

    expect(scrollMocks.cleanup).toHaveBeenCalled()
    expect(scrollMocks.scroll).toHaveBeenCalledTimes(2)
    expect(scrollMocks.scroll.mock.calls[1][1].axis).toBe('y')
  })

  it('resolves container and target element accessors', () => {
    let container: HTMLDivElement | undefined
    let target: HTMLDivElement | undefined

    render(() => {
      createScroll(() => ({ container: () => container, target: () => target }))
      return (
        <div ref={(element) => (container = element)}>
          <div ref={(element) => (target = element)} />
        </div>
      )
    })

    const [, options] = scrollMocks.scroll.mock.calls[0]
    expect(options.container).toBe(container)
    expect(options.target).toBe(target)
  })

  it('passes trackContentSize through to scroll', () => {
    render(() => {
      createScroll({ trackContentSize: true })
      return <div />
    })

    expect(scrollMocks.scroll.mock.calls[0][1].trackContentSize).toBe(true)
  })

  it('updates motion values from the scroll callback', () => {
    let values: ReturnType<typeof createScroll> | undefined

    render(() => {
      values = createScroll()
      return <div />
    })

    const callback = scrollMocks.scroll.mock.calls[0][0]
    callback(0.5, {
      x: { current: 100, progress: 0.75 },
      y: { current: 200, progress: 0.9 },
    })

    expect(values!.scrollX.get()).toBe(100)
    expect(values!.scrollXProgress.get()).toBe(0.75)
    expect(values!.scrollY.get()).toBe(200)
    expect(values!.scrollYProgress.get()).toBe(0.9)
  })

  it('cleans up the scroll listener on unmount', () => {
    const result = render(() => {
      createScroll()
      return <div />
    })

    expect(scrollMocks.cleanup).not.toHaveBeenCalled()

    result.unmount()
    expect(scrollMocks.cleanup).toHaveBeenCalledTimes(1)
  })

  it('handles an undefined container gracefully', () => {
    render(() => {
      createScroll({ container: () => undefined })
      return <div />
    })

    expect(scrollMocks.scroll.mock.calls[0][1].container).toBeUndefined()
  })

  it('re-subscribes when reactive options change offset', async () => {
    const [offset, setOffset] = createSignal<any>(['start end', 'end start'])

    render(() => {
      createScroll(() => ({ offset: offset() }))
      return <div />
    })

    expect(scrollMocks.scroll).toHaveBeenCalledTimes(1)

    setOffset(['start start', 'end end'])
    await Promise.resolve()

    expect(scrollMocks.cleanup).toHaveBeenCalled()
    expect(scrollMocks.scroll).toHaveBeenCalledTimes(2)
    expect(scrollMocks.scroll.mock.calls[1][1].offset).toEqual(['start start', 'end end'])
  })

  describe('scroll timeline acceleration', () => {
    it('sets accelerate on progress values when ScrollTimeline is supported without a target', () => {
      scrollMocks.supportsScrollTimeline.mockReturnValue(true)
      let values: ReturnType<typeof createScroll> | undefined

      render(() => {
        values = createScroll()
        return <div />
      })

      expect(values!.scrollXProgress.accelerate).toBeDefined()
      expect(values!.scrollYProgress.accelerate).toBeDefined()
      expect(values!.scrollX.accelerate).toBeUndefined()
      expect(values!.scrollY.accelerate).toBeUndefined()
    })

    it('does not set accelerate when ScrollTimeline is not supported', () => {
      let values: ReturnType<typeof createScroll> | undefined

      render(() => {
        values = createScroll()
        return <div />
      })

      expect(values!.scrollXProgress.accelerate).toBeUndefined()
      expect(values!.scrollYProgress.accelerate).toBeUndefined()
    })

    it('sets accelerate when ViewTimeline is supported and target uses recognised offset', () => {
      scrollMocks.supportsViewTimeline.mockReturnValue(true)
      let values: ReturnType<typeof createScroll> | undefined
      let target: HTMLDivElement | undefined

      render(() => {
        values = createScroll({
          target: () => target,
          offset: [
            [0, 1],
            [1, 1],
          ] as any,
        })
        return <div ref={(element) => (target = element)} />
      })

      expect(values!.scrollXProgress.accelerate).toBeDefined()
      expect(values!.scrollYProgress.accelerate).toBeDefined()
    })

    it('does not set accelerate when target uses unrecognised offset', () => {
      scrollMocks.supportsViewTimeline.mockReturnValue(true)
      let values: ReturnType<typeof createScroll> | undefined
      let target: HTMLDivElement | undefined

      render(() => {
        values = createScroll({
          target: () => target,
          offset: ['start center', 'end start'] as any,
        })
        return <div ref={(element) => (target = element)} />
      })

      expect(values!.scrollXProgress.accelerate).toBeUndefined()
      expect(values!.scrollYProgress.accelerate).toBeUndefined()
    })

    it('accelerate factory calls scroll with resolved options', () => {
      scrollMocks.supportsScrollTimeline.mockReturnValue(true)
      let values: ReturnType<typeof createScroll> | undefined

      render(() => {
        values = createScroll({ axis: 'x' })
        return <div />
      })

      const mockAnimation = {} as any
      values!.scrollXProgress.accelerate!.factory(mockAnimation)

      expect(scrollMocks.scroll).toHaveBeenCalledWith(
        mockAnimation,
        expect.objectContaining({ axis: 'x' }),
      )
    })
  })
})
