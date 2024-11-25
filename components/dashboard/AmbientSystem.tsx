import { motion } from 'framer-motion'
import { DataFlowParticles } from './DataFlowParticles'

export const AmbientBackground = () => {
  return (
    <motion.div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-black to-cyan-950/20" />
      <motion.div 
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, cyan 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, cyan 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <DataFlowParticles />
    </motion.div>
  )
} 