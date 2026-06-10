import { render } from 'solid-js/web'
import { m } from 'motion-solidjs'

render(() => <m.div animate={{ opacity: 1 }} />, document.getElementById('root')!)
