/* app-baseline plus a single motion.div — the delta against app-baseline is
 * motion's marginal cost in a real app. */
import { render, Dynamic } from 'solid-js/web'
import { createContext, createSignal, useContext, For, Show, splitProps } from 'solid-js'
import { motion } from 'motion-solidjs'

const Ctx = createContext<{ theme: string }>({ theme: 'light' })

function Button(props: { label: string } & Record<string, unknown>) {
  const [own, rest] = splitProps(props, ['label'])
  const ctx = useContext(Ctx)
  return (
    <button {...rest} data-theme={ctx.theme}>
      {own.label}
    </button>
  )
}

function App() {
  const [items, setItems] = createSignal(['a', 'b'])
  const [tag, setTag] = createSignal<'div' | 'section'>('div')
  return (
    <Ctx.Provider value={{ theme: 'dark' }}>
      <Dynamic component={tag()}>
        <Show when={items().length > 0} fallback={<p>empty</p>}>
          <For each={items()}>{(item) => <Button label={item} />}</For>
        </Show>
        <Button label="add" onClick={() => setItems((l) => [...l, 'c'])} />
        <Button label="swap" onClick={() => setTag('section')} />
        <motion.div animate={{ opacity: 1 }} />
      </Dynamic>
    </Ctx.Provider>
  )
}

render(() => <App />, document.getElementById('root')!)
