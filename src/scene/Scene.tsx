import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Lighting } from '../rendering/Lighting';
import { Garments } from './Garments';

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0.95, 3.2], fov: 40 }}
      gl={{ toneMapping: THREE.NoToneMapping }}
      frameloop="demand"
    >
      <color attach="background" args={['#f5f0e8']} />
      <Lighting />
      <Garments />
      <OrbitControls target={[0, 0.95, 0]} />
    </Canvas>
  );
}
