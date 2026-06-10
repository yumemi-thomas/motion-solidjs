import { createRoot } from 'react-dom/client'
import { LazyMotion, domAnimation, m } from 'motion/react'
createRoot(document.getElementById('root')).render(
  <LazyMotion features={domAnimation}>
    <m.div animate={{ opacity: 1 }} />
  </LazyMotion>,
)
