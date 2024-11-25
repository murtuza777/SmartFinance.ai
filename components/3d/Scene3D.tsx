'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls, Stars, Environment, ScrollControls } from '@react-three/drei'
import * as THREE from 'three'
import { Scene } from './Scene'

const Scene3D = () => {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 15]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <ScrollControls pages={3} damping={0.25} distance={1}>
          <Scene />
        </ScrollControls>
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="night" />
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.75}
        />
      </Suspense>
    </Canvas>
  )
}

export default Scene3D 