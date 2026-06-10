import { render } from 'solid-js/web'
import { motion } from 'motion-solidjs'

render(() => <motion.div animate={{ opacity: 1 }} />, document.getElementById('root')!)
