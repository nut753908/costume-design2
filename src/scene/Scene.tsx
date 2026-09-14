import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Lighting } from '../rendering/Lighting';
import { Garments } from './Garments';

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 1.3, 4.8], fov: 40 }}
      gl={{ toneMapping: THREE.NoToneMapping }}
      frameloop="demand"
    >
      <color attach="background" args={['#f5f0e8']} />
      <Lighting />
      <Garments />
      <OrbitControls target={[0, 1.3, 0]} />
    </Canvas>
  );
}
