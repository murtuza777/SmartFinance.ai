'use client'

import React, { useState, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { 
  Environment, 
  PerspectiveCamera,
  OrbitControls,
  ScrollControls,
  Stars
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Glitch, DepthOfField } from '@react-three/postprocessing'
import * as THREE from 'three'
import { GlitchMode } from 'postprocessing'

// Import your other components here
import { Scene } from './3d/Scene'

const Scene3D = () => {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 15]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <ScrollControls pages={3} damping={0.25}>
          <Scene />
        </ScrollControls>
        <Stars radius={300} depth={100} count={7000} factor={6} saturation={0} fade speed={1} />
        <Environment preset="night" />
      </Suspense>
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.75}
      />
      <EffectComposer>
        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={0.5} />
        <ChromaticAberration 
          offset={new THREE.Vector2(0.004, 0.004)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Glitch
          delay={new THREE.Vector2(1.5, 3.5)}
          duration={new THREE.Vector2(0.6, 1.0)}
          strength={new THREE.Vector2(0.3, 1.0)}
          mode={GlitchMode.CONSTANT_WILD}
          active
          ratio={0.85}
        />
        <DepthOfField
          focusDistance={0}
          focalLength={0.02}
          bokehScale={2}
          height={480}
        />
      </EffectComposer>
    </Canvas>
  )
}

export default Scene3D 