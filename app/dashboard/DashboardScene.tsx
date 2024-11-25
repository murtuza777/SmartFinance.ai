'use client'

import { Canvas } from '@react-three/fiber'
import { Stars, Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { QuantumCore } from './3d/QuantumCore'
import { DataViz } from './3d/DataViz'

export default function DashboardScene() {
  return (
    <div className="fixed inset-0">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <QuantumCore />
        <DataViz />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} />
        <EffectComposer>
          <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
        </EffectComposer>
      </Canvas>
    </div>
  )
} 