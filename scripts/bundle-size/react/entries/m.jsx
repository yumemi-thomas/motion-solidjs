import { createRoot } from 'react-dom/client'
import { m } from 'motion/react'
createRoot(document.getElementById('root')).render(<m.div animate={{ opacity: 1 }} />)
