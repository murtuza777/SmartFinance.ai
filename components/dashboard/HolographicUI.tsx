import { motion } from 'framer-motion'
import { ReactNode } from 'react'

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
    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/75 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-cyan-400/45 hover:bg-slate-800/80 hover:text-cyan-100 ${className}`}
    whileHover={{ scale: 1.02 }}
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
      className={`relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/85 via-slate-950/90 to-slate-950/95 p-6 shadow-[0_14px_45px_rgba(2,6,23,0.45)] ring-1 ring-white/[0.04] ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(6,182,212,0.08),transparent_45%,rgba(56,189,248,0.05))]" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
} 