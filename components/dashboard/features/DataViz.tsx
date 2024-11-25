import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { DataMesh } from '../DataMesh'

interface VolumetricChartProps {
  data: number[];
}

export const VolumetricChart: React.FC<VolumetricChartProps> = ({ data }) => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <DataMesh data={data} />
      <EffectComposer>
        <Bloom 
          intensity={1.5}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </Canvas>
  )
} 