import { motion } from 'framer-motion'

interface NeuralResponseProps {
  message: string;
}

export const NeuralResponse: React.FC<NeuralResponseProps> = ({ message }) => {
  return (
    <motion.div className="relative">
      <div className="neural-grid">
        {/* Generate dynamic neural pathways */}
        {Array(20).fill(0).map((_, i) => (
          <motion.div
            key={i}
            className="neural-node"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2,
              delay: i * 0.1,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
      <div className="message-content">{message}</div>
    </motion.div>
  )
} 