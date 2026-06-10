import { render } from 'solid-js/web'
import { LazyMotion, domAnimation, m } from 'motion-solidjs'

render(
  () => (
    <LazyMotion features={domAnimation}>
      <m.div animate={{ opacity: 1 }} />
    </LazyMotion>
  ),
  document.getElementById('root')!,
)
