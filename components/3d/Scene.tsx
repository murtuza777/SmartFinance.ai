'use client'

import React, { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Float, Sphere, Torus, MeshDistortMaterial, Html, useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Types
interface FloatingCardProps {
  children: React.ReactNode
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  scrollY: number
  targetY: number
}

// Add this new hook for scroll animations
const useCardAnimation = (scrollY: number, targetY: number) => {
  const scale = THREE.MathUtils.lerp(
    0.5,
    1.2,
    1 - Math.abs(scrollY - targetY) * 2
  )
  const opacity = THREE.MathUtils.lerp(
    0.3,
    1,
    1 - Math.abs(scrollY - targetY) * 2
  )
  return { scale, opacity }
}

// Core visualization component representing data clusters
const DataSphere = () => {
  const meshRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2
      meshRef.current.rotation.y += 0.002
      meshRef.current.rotation.z = Math.cos(clock.getElapsedTime() * 0.2) * 0.15
    }
  })

  return (
    <group ref={meshRef}>
      {/* Main data sphere */}
      <Sphere args={[2, 64, 64]}>
        <MeshDistortMaterial
          color="#00ffff"
          attach="material"
          distort={0.4}
          speed={3}
          roughness={0}
          metalness={1}
        />
      </Sphere>
      
      {/* Data flow rings */}
      <Torus args={[3, 0.2, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#00ffff" opacity={0.5} transparent />
      </Torus>
      <Torus args={[3.5, 0.1, 16, 100]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <meshStandardMaterial color="#00ffff" opacity={0.3} transparent />
      </Torus>
    </group>
  )
}

// Floating card for displaying data insights
const FloatingCard: React.FC<FloatingCardProps> = ({ children, position, rotation = [0, 0, 0], scale = [1, 1, 1], scrollY, targetY }) => {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime()) * 0.1
      meshRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1
    }
  })

  return (
    <group 
      ref={meshRef} 
      position={new THREE.Vector3(...position)}
      rotation={new THREE.Euler(...rotation)}
      scale={new THREE.Vector3(...scale)}
    >
      <Html transform distanceFactor={1.5}>
        <div className="w-[350px]">
          {children}
        </div>
      </Html>
    </group>
  )
}

// Add statistics cards
const StatsCard = ({ title, value, description, position, scrollY, targetY }: { 
  title: string
  value: string
  description: string
  position: [number, number, number]
  scrollY: number
  targetY: number
}) => {
  const { scale, opacity } = useCardAnimation(scrollY, targetY)

  return (
    <FloatingCard position={position} scrollY={scrollY} targetY={targetY}>
      <Card className="bg-black/50 backdrop-blur-md border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-500">{title}</CardTitle>
          <div className="text-2xl font-bold text-white">{value}</div>
          <CardDescription className="text-gray-300">{description}</CardDescription>
        </CardHeader>
      </Card>
    </FloatingCard>
  )
}

// Main Scene Component
export const Scene: React.FC = () => {
  const scroll = useScroll()
  const [scrollY, setScrollY] = useState(0)

  useFrame(() => {
    // Get the current scroll progress (0 to 1)
    const current = scroll.offset
    setScrollY(current)
  })

  return (
    <>
      <DataSphere />

      {/* Statistics Cards with scroll animations */}
      <group position-y={-scrollY * 10}>
        <StatsCard 
          title="Global Impact"
          value="300M+"
          description="Students worldwide managing educational loans"
          position={[4, 2, 0]}
          scrollY={scrollY}
          targetY={0.2}
        />

        <StatsCard 
          title="Total Debt"
          value="$2T+"
          description="Global student loan debt"
          position={[-4, 0, 0]}
          scrollY={scrollY}
          targetY={0.4}
        />

        <StatsCard 
          title="AI Insights"
          value="24/7"
          description="Personalized financial guidance and predictions"
          position={[4, -2, 0]}
          scrollY={scrollY}
          targetY={0.6}
        />

        <FloatingCard 
          position={[0, -4, 0]}
          scrollY={scrollY}
          targetY={0.8}
        >
          <Card className="bg-black/50 backdrop-blur-md border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-500">Key Features</CardTitle>
              <ul className="text-white space-y-2 mt-4">
                <li>• AI-Powered Loan Repayment Strategies</li>
                <li>• Real-time Financial Analytics</li>
                <li>• Personalized Budget Planning</li>
                <li>• Educational Resource Access</li>
              </ul>
            </CardHeader>
          </Card>
        </FloatingCard>
      </group>
    </>
  )
} 