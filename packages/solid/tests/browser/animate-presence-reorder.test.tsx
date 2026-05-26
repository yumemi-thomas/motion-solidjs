import { render } from '@solidjs/testing-library'
import { createSignal, For, Show } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { AnimatePresence, motion } from '@/components'
import { wait } from './helpers'

const color = ['red', 'green']
const poems = ['1', '2']

function ListItem(p: { color: string; poem: string; isOpen: boolean }) {
  const transition = { duration: 0.2 }
  return (
    <div class="item" style={{ 'background-color': p.color }}>
      <AnimatePresence mode="wait" initial={false}>
        <Show when={p.isOpen} fallback={<div style={{ height: '3rem' }} />}>
          <motion.div
            initial="hide"
            animate="show"
            exit="hide"
            variants={{
              show: { opacity: 1, transition },
              hide: { opacity: 0, transition },
            }}
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              color: 'white',
            }}
          >
            {p.poem}
          </motion.div>
        </Show>
      </AnimatePresence>
    </div>
  )
}

describe('AnimatePresence reorder', () => {
  it('Correct number of animations trigger', async () => {
    const [items, setItems] = createSignal(
      Array.from({ length: 2 }, (_, i) => ({
        color: color[i],
        poem: poems[i],
        key: i,
      })),
    )

    const { unmount } = render(() => (
      <>
        <button
          id="move"
          onClick={() => {
            setItems((prev) => {
              const next = [...prev]
              next.push(next.shift()!)
              return next
            })
          }}
        >
          Move
        </button>
        <For each={items()}>
          {(item, i) => <ListItem color={item.color} poem={item.poem} isOpen={i() === 0} />}
        </For>
      </>
    ))

    await wait(50)
    ;(document.getElementById('move') as HTMLButtonElement).click()
    await wait(300)
    const items_ = document.querySelectorAll('.item')
    // First item should now be poem '2'; second item's content is the spacer (no text)
    expect(items_[0].textContent).toBe('2')
    expect(items_[1].textContent).toBe('')
    unmount()
  })
})
