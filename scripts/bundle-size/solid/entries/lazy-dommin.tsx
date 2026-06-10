import { render } from 'solid-js/web'
import { LazyMotion, domMin, m } from 'motion-solidjs'

render(
  () => (
    <LazyMotion features={domMin}>
      <m.div animate={{ opacity: 1 }} />
    </LazyMotion>
  ),
  document.getElementById('root')!,
)
