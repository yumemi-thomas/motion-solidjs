import { cleanup, render } from '@solidjs/testing-library'
import { motionValue, stagger } from 'motion-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { createSignal, For, onMount } from 'solid-js'
import { Motion } from '@/components'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

afterEach(() => {
  cleanup()
})

describe('animate prop as variant', () => {
  it('when: beforeChildren works correctly', async () => {
    const promise = new Promise((resolve) => {
      const opacity = motionValue(0.1)
      const variants = {
        visible: {
          opacity: 1,
          transition: { duration: 1, when: 'beforeChildren' },
        },
        hidden: {
          opacity: 0.1,
        },
      }

      render(() => (
        <Motion variants={variants} initial="hidden" animate="visible">
          <Motion>
            <Motion variants={variants} style={{ opacity }} />
          </Motion>
        </Motion>
      ))

      setTimeout(() => resolve(opacity.get()), 200)
    })

    await expect(promise).resolves.toBe(0.1)
  })

  it('components without variants are transparent to stagger order', async () => {
    const [recordedOrder, staggeredEqually] = await new Promise<[number[], boolean]>((resolve) => {
      const order: number[] = []
      const delayedBy: number[] = []
      const staggerDuration = 0.1

      const updateDelayedBy = (i: number) => {
        if (delayedBy[i]) return
        delayedBy[i] = performance.now()
      }

      const checkStaggerEquidistance = () => {
        let isEquidistant = true
        let prev = 0
        for (let i = 0; i < delayedBy.length; i++) {
          if (prev) {
            const timeSincePrev = prev - delayedBy[i]
            if (Math.round(timeSincePrev / 100) * 100 !== staggerDuration * 1000) {
              isEquidistant = false
            }
          }
          prev = delayedBy[i]
        }
        return isEquidistant
      }

      const parentVariants = {
        visible: {
          transition: {
            staggerChildren: staggerDuration,
            staggerDirection: -1,
          },
        },
      }

      const variants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.000001 },
        },
      }

      render(() => (
        <Motion
          initial="hidden"
          animate="visible"
          variants={parentVariants}
          onAnimationComplete={() =>
            requestAnimationFrame(() => resolve([order, checkStaggerEquidistance()]))
          }
        >
          <Motion>
            <Motion />
            <Motion
              variants={variants}
              onUpdate={() => {
                updateDelayedBy(0)
                order.push(1)
              }}
              style={{ 'will-change': 'auto' }}
            />
            <Motion
              variants={variants}
              onUpdate={() => {
                updateDelayedBy(1)
                order.push(2)
              }}
              style={{ 'will-change': 'auto' }}
            />
          </Motion>
          <Motion>
            <Motion
              variants={variants}
              onUpdate={() => {
                updateDelayedBy(2)
                order.push(3)
              }}
              style={{ 'will-change': 'auto' }}
            />
            <Motion
              variants={variants}
              onUpdate={() => {
                updateDelayedBy(3)
                order.push(4)
              }}
              style={{ 'will-change': 'auto' }}
            />
          </Motion>
        </Motion>
      ))
    })

    expect(recordedOrder).toEqual([4, 3, 2, 1])
    expect(staggeredEqually).toEqual(true)
  })

  it('child variants with value-specific transitions correctly calculate delay based on staggerChildren (deprecated)', async () => {
    const isCorrectlyStaggered = await new Promise((resolve) => {
      const childVariants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { opacity: { duration: 0.1 } },
        },
      }

      function Component() {
        const a = motionValue(0)
        const b = motionValue(0)

        onMount(() => {
          a.on('change', (latest) => {
            if (latest >= 1 && b.get() === 0) {
              resolve(true)
            }
          })
        })

        return (
          <Motion
            variants={{
              hidden: {},
              visible: {
                x: 100,
                transition: { staggerChildren: 0.15 },
              },
            }}
            initial="hidden"
            animate="visible"
          >
            <Motion variants={childVariants} style={{ opacity: a }} />
            <Motion variants={childVariants} style={{ opacity: b }} />
          </Motion>
        )
      }

      render(() => <Component />)
    })

    expect(isCorrectlyStaggered).toBe(true)
  })

  it('child variants with stagger function passed to delayChildren work correctly', async () => {
    const [recordedOrder, staggeredEqually] = await new Promise<[number[], boolean]>((resolve) => {
      const order: number[] = []
      const delayedBy: number[] = []
      const staggerDuration = 0.1

      const updateDelayedBy = (i: number) => {
        if (delayedBy[i]) return
        delayedBy[i] = performance.now()
      }

      const checkStaggerEquidistance = () => {
        let isEquidistant = true
        let prev = 0
        for (let i = 0; i < delayedBy.length; i++) {
          if (prev) {
            const timeSincePrev = prev - delayedBy[i]
            if (Math.round(timeSincePrev / 100) * 100 !== staggerDuration * 1000) {
              isEquidistant = false
            }
          }
          prev = delayedBy[i]
        }
        return isEquidistant
      }

      const parentVariants = {
        visible: {
          transition: {
            delayChildren: stagger(staggerDuration, { from: 'last' }),
          },
        },
      }

      const variants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.000001 },
        },
      }

      render(() => (
        <Motion
          initial="hidden"
          animate="visible"
          variants={parentVariants}
          onAnimationComplete={() =>
            requestAnimationFrame(() => resolve([order, checkStaggerEquidistance()]))
          }
        >
          <Motion
            variants={variants}
            onUpdate={() => {
              updateDelayedBy(0)
              order.push(1)
            }}
            style={{ 'will-change': 'auto' }}
          />
          <Motion
            variants={variants}
            onUpdate={() => {
              updateDelayedBy(1)
              order.push(2)
            }}
            style={{ 'will-change': 'auto' }}
          />
          <Motion
            variants={variants}
            onUpdate={() => {
              updateDelayedBy(2)
              order.push(3)
            }}
            style={{ 'will-change': 'auto' }}
          />
          <Motion
            variants={variants}
            onUpdate={() => {
              updateDelayedBy(3)
              order.push(4)
            }}
            style={{ 'will-change': 'auto' }}
          />
        </Motion>
      ))
    })

    expect(recordedOrder).toEqual([4, 3, 2, 1])
    expect(staggeredEqually).toEqual(true)
  })

  it('stagger function with different "from" options work correctly', async () => {
    const [centerOrder, firstOrder] = await new Promise<[number[], number[]]>((resolve) => {
      const centerOrder: number[] = []
      const firstOrder: number[] = []
      let centerComplete = false
      let firstComplete = false

      const checkComplete = () => {
        if (centerComplete && firstComplete) {
          resolve([centerOrder, firstOrder])
        }
      }

      const centerVariants = {
        visible: {
          transition: {
            delayChildren: stagger(0.1, { from: 'center' }),
          },
        },
      }

      const firstVariants = {
        visible: {
          transition: {
            delayChildren: stagger(0.1, { from: 'first' }),
          },
        },
      }

      const variants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.000001 },
        },
      }

      render(() => (
        <Motion
          initial="hidden"
          animate="visible"
          variants={centerVariants}
          onAnimationComplete={() => {
            centerComplete = true
            checkComplete()
          }}
        >
          <Motion
            variants={variants}
            onUpdate={() => centerOrder.push(1)}
            style={{ 'will-change': 'auto' }}
          />
          <Motion
            variants={variants}
            onUpdate={() => centerOrder.push(2)}
            style={{ 'will-change': 'auto' }}
          />
          <Motion
            variants={variants}
            onUpdate={() => centerOrder.push(3)}
            style={{ 'will-change': 'auto' }}
          />
          <Motion
            variants={variants}
            onUpdate={() => centerOrder.push(4)}
            style={{ 'will-change': 'auto' }}
          />
        </Motion>
      ))

      render(() => (
        <Motion
          initial="hidden"
          animate="visible"
          variants={firstVariants}
          onAnimationComplete={() => {
            firstComplete = true
            checkComplete()
          }}
        >
          <Motion
            variants={variants}
            onUpdate={() => firstOrder.push(1)}
            style={{ 'will-change': 'auto' }}
          />
          <Motion
            variants={variants}
            onUpdate={() => firstOrder.push(2)}
            style={{ 'will-change': 'auto' }}
          />
          <Motion
            variants={variants}
            onUpdate={() => firstOrder.push(3)}
            style={{ 'will-change': 'auto' }}
          />
          <Motion
            variants={variants}
            onUpdate={() => firstOrder.push(4)}
            style={{ 'will-change': 'auto' }}
          />
        </Motion>
      ))
    })

    expect(centerOrder).toEqual([2, 3, 1, 4])
    expect(firstOrder).toEqual([1, 2, 3, 4])
  })

  it('staggerChildren is calculated correctly for new children', async () => {
    const [items, setItems] = createSignal(['1', '2'])

    function Component() {
      return (
        <Motion
          animate="enter"
          variants={{
            enter: { transition: { delayChildren: stagger(0.1) } },
          }}
        >
          <For each={items()}>
            {(item) => (
              <Motion
                id={item}
                class="item"
                variants={{ enter: { opacity: 1 } }}
                initial={{ opacity: 0 }}
              />
            )}
          </For>
        </Motion>
      )
    }

    render(() => <Component />, { container: document.createElement('div') })

    await delay(0)

    setItems(['1', '2', '3', '4', '5'])

    await delay(1000)

    const elements = document.querySelectorAll('.item')
    const opacities = Array.from(elements).map((el) =>
      parseFloat(window.getComputedStyle(el).opacity),
    )

    const uniqueOpacities = new Set(opacities)
    expect(uniqueOpacities.size).toBe(opacities.length)
  })

  it('staggerChildren is calculated correctly for inserted Solid children', async () => {
    const [items, setItems] = createSignal(['1', '2'])
    const firstNonZero = new Map<string, number>()
    let setItemsAt = 0

    function Component() {
      return (
        <Motion
          animate="enter"
          variants={{
            enter: { transition: { delayChildren: stagger(0.1) } },
          }}
        >
          <For each={items()}>
            {(item) => (
              <Motion
                id={item}
                class="item"
                variants={{ enter: { opacity: 1 } }}
                initial={{ opacity: 0 }}
                onUpdate={(latest: any) => {
                  if (
                    !firstNonZero.has(item) &&
                    typeof latest.opacity === 'number' &&
                    latest.opacity > 0
                  ) {
                    firstNonZero.set(item, performance.now())
                  }
                }}
              />
            )}
          </For>
        </Motion>
      )
    }

    const { container } = render(() => <Component />)

    await delay(0)

    setItemsAt = performance.now()
    setItems(['1', '2', '3', '4', '5'])

    await delay(800)

    // The three newly-inserted children should each have started animating
    // at a distinct, staggered time after insertion.
    const starts = ['3', '4', '5'].map((id) => {
      const t = firstNonZero.get(id)
      expect(t).toBeDefined()
      return (t as number) - setItemsAt
    })

    expect(starts[1]).toBeGreaterThan(starts[0])
    expect(starts[2]).toBeGreaterThan(starts[1])

    // And all should have settled at opacity 1 once their animations complete.
    const settled = Array.from(container.querySelectorAll('.item'))
      .slice(2)
      .map((el) => parseFloat(window.getComputedStyle(el).opacity))
    expect(settled.every((o) => o === 1)).toBe(true)
  })
})
