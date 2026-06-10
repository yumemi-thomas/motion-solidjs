import { createRoot } from 'react-dom/client'
import { motion } from 'motion/react'
createRoot(document.getElementById('root')).render(<motion.div animate={{ opacity: 1 }} />)
