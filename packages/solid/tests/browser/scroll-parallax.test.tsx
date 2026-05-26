import { cleanup, render } from '@solidjs/testing-library'
import { onMount } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { animate, scroll } from 'motion'
import { wait } from './helpers'

afterEach(() => {
  window.scrollTo(0, 0)
  cleanup()
})

// Port of motion-upstream/packages/framer-motion/cypress/integration/scroll.ts
// — `scroll-parallax`. Upstream uses `cy.viewport(1000, 500)` to put the
// first container's sentinel at top=200 (= 500/2 - 50). We use the test
// viewport (660) so the expected center is 280 (= 660/2 - 50). Each
// sentinel is positioned at `top: calc(50% - 50px)` within a 100vh
// container, scrolled through a -distance..distance Y range so at the
// midpoint (initial load) y=0 and bounding.top equals the CSS top.
describe('scroll-parallax', () => {
  it('parallax sentinels track scroll position', async () => {
    render(() => {
      onMount(() => {
        const distance = 400
        document.querySelectorAll('.img-container').forEach((section) => {
          const mainThreadSentinel = section.querySelector(
            '.sentinel.main-thread',
          ) as HTMLElement | null
          const waapiSentinel = section.querySelector('.sentinel.waapi') as HTMLElement | null
          const miniSentinel = section.querySelector('.sentinel.mini') as HTMLElement | null

          if (!mainThreadSentinel || !waapiSentinel || !miniSentinel) return

          scroll(animate(mainThreadSentinel, { y: [-distance, distance] }), {
            target: mainThreadSentinel,
          })

          scroll(
            animate(waapiSentinel, {
              transform: [`translateY(-${distance}px)`, `translateY(${distance}px)`],
            }),
            { target: waapiSentinel },
          )

          scroll(
            animate(miniSentinel, {
              transform: [`translateY(-${distance}px)`, `translateY(${distance}px)`],
            }),
            { target: miniSentinel },
          )
        })
      })

      return (
        <>
          {[0, 1, 2, 3, 4].map(() => (
            <section class="img-container">
              <div>
                <div class="img-placeholder" />
                <div class="main-thread sentinel" />
                <div class="waapi sentinel" />
                <div class="mini sentinel" />
              </div>
            </section>
          ))}
          <style>{`
            html { scroll-snap-type: y mandatory; }
            .img-container {
              height: 100vh;
              scroll-snap-align: start;
              display: flex;
              justify-content: center;
              align-items: center;
              position: relative;
            }
            .img-container > div {
              width: 300px;
              height: 400px;
              margin: 20px;
              background: white;
              overflow: hidden;
            }
            .img-container .img-placeholder {
              width: 300px;
              height: 400px;
              background-color: #000;
            }
            .img-container .sentinel {
              position: absolute;
              top: calc(50% - 50px);
              left: 50%;
              width: 100px;
              height: 100px;
              background-color: blue;
            }
            .waapi.sentinel { background-color: red; }
            .mini.sentinel { background-color: green; }
          `}</style>
        </>
      )
    })

    await wait(300)
    const expectedTop = window.innerHeight / 2 - 50
    const first = document.querySelector('.img-container:first-child') as HTMLElement
    const main = first.querySelector('.main-thread.sentinel') as HTMLElement
    const waapi = first.querySelector('.waapi.sentinel') as HTMLElement
    const mini = first.querySelector('.mini.sentinel') as HTMLElement

    // Each parallax sentinel should sit at the center of the first
    // viewport (translated to y=0 at midpoint of its scroll range).
    expect(main.getBoundingClientRect().top).toBeCloseTo(expectedTop, 0)
    expect(waapi.getBoundingClientRect().top).toBeCloseTo(expectedTop, 0)
    expect(mini.getBoundingClientRect().top).toBeCloseTo(expectedTop, 0)
  })
})
