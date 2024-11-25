import { useGesture } from '@use-gesture/react'
import { motion, MotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface GestureControllerProps {
  children: ReactNode;
}

export const GestureController: React.FC<GestureControllerProps> = ({ children }) => {
  const bind = useGesture({
    onHover: ({ active }) => {
      // Trigger proximity effects
    },
    onMove: ({ xy: [x, y], movement: [mx, my] }) => {
      // Create parallax and depth effects
    },
    onPinch: ({ offset: [d] }) => {
      // Handle zoom interactions
    }
  })

  const gestureProps = bind() as unknown as MotionProps

  return (
    <motion.div 
      {...gestureProps} 
      className="gesture-container"
    >
      {children}
    </motion.div>
  )
} 