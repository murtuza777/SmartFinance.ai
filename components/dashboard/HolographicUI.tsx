import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { ParticleSystem } from './ParticleSystem'

interface HolographicButtonProps {
  children: ReactNode;
  onClick: () => void;
  icon?: React.ComponentType<any>;
  className?: string;
}

export const HolographicButton: React.FC<HolographicButtonProps> = ({ 
  children, 
  onClick, 
  icon: Icon, 
  className = '' 
}) => (
  <motion.button
    className={`px-4 py-2 bg-transparent border border-cyan-500 rounded-full text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all duration-300 flex items-center justify-center space-x-2 ${className}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
  >
    {Icon && <Icon className="w-4 h-4" />}
    <span>{children}</span>
  </motion.button>
)

interface HolographicCardProps {
  children: ReactNode;
  className?: string;
}

export const HolographicCard: React.FC<HolographicCardProps> = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      {...props}
    >
      {/* Floating particle system */}
      <div className="absolute inset-0 pointer-events-none">
        <ParticleSystem density={50} color="rgba(6, 182, 212, 0.1)" />
      </div>
      
      {/* Depth layers */}
      <div className="relative z-10 backdrop-blur-sm bg-black/30 border border-cyan-500/30 rounded-xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-xl" />
        <div className="relative z-20">{children}</div>
      </div>
      
      {/* Interactive glow effect */}
      <motion.div 
        className="absolute inset-0 bg-gradient-radial pointer-events-none"
        animate={{ 
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.05, 1] 
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  )
} 