import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, Match, Switch } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import { motion } from '@/components'
import { wait } from './helpers'

afterEach(() => cleanup())

// Port of motion-upstream/packages/framer-motion/cypress/integration/
// while-in-view-remount.ts — #3079: whileInView must re-trigger after
// soft navigation (re-mount).
function App() {
  const [page, setPage] = createSignal<'home' | 'projects'>('home')
  return (
    <div>
      <nav>
        <button id="go-home" onClick={() => setPage('home')}>
          Home
        </button>
        <button id="go-projects" onClick={() => setPage('projects')}>
          Projects
        </button>
      </nav>
      <Switch>
        <Match when={page() === 'home'}>
          <div id="home-page">Home</div>
        </Match>
        <Match when={page() === 'projects'}>
          <div id="projects-page">
            <Card id="card1" />
            <Card id="card2" />
          </div>
        </Match>
      </Switch>
    </div>
  )
}

function Card(p: { id: string }) {
  // `<article>` resolves to `HTMLElement`, so the ref must match — typing it
  // as `HTMLDivElement` would mismatch the callback-form ref argument.
  let scrollRef!: HTMLElement
  return (
    <article ref={(el) => (scrollRef = el)}>
      <motion.div
        id={p.id}
        data-in-view="false"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ root: scrollRef, once: true }}
        transition={{ duration: 0.01 }}
        onViewportEnter={() => {
          const el = document.getElementById(p.id)
          if (el) el.dataset.inView = 'true'
        }}
        style={{ width: '100px', height: '100px', background: 'red' }}
      />
    </article>
  )
}

describe('whileInView remount (#3079)', () => {
  it('triggers whileInView on initial mount', async () => {
    render(() => <App />)
    await wait(100)
    ;(document.getElementById('go-projects') as HTMLButtonElement).click()
    await wait(200)
    const card1 = document.getElementById('card1') as HTMLElement
    expect(parseFloat(getComputedStyle(card1).opacity)).toBe(1)
  })

  it('triggers whileInView after remount (soft navigation)', async () => {
    render(() => <App />)
    await wait(100)
    ;(document.getElementById('go-projects') as HTMLButtonElement).click()
    await wait(200)
    expect(parseFloat(getComputedStyle(document.getElementById('card1')!).opacity)).toBe(1)

    ;(document.getElementById('go-home') as HTMLButtonElement).click()
    await wait(100)

    ;(document.getElementById('go-projects') as HTMLButtonElement).click()
    await wait(200)

    expect(parseFloat(getComputedStyle(document.getElementById('card1')!).opacity)).toBe(1)
    expect(parseFloat(getComputedStyle(document.getElementById('card2')!).opacity)).toBe(1)
  })

  it('fires onViewportEnter after remount', async () => {
    render(() => <App />)
    await wait(100)
    ;(document.getElementById('go-projects') as HTMLButtonElement).click()
    await wait(200)
    expect(document.getElementById('card1')!.dataset.inView).toBe('true')

    ;(document.getElementById('go-home') as HTMLButtonElement).click()
    await wait(100)

    ;(document.getElementById('go-projects') as HTMLButtonElement).click()
    await wait(200)

    expect(document.getElementById('card1')!.dataset.inView).toBe('true')
  })
})
