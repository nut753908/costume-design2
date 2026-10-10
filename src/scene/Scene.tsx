import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Lighting } from '../rendering/Lighting';
import { Garments } from './Garments';

// 注視点まわりの表示高さ(ワールド単位)。ズームをウィンドウ高さに比例させ、見かけの大きさが
// 高さにだけ比例する(App.tsx のシーン幅の計算が前提にしている)ようにする。
const VISIBLE_HEIGHT = 2.33;

function FitZoom() {
  const height = useThree((s) => s.size.height);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.zoom = height / VISIBLE_HEIGHT;
    camera.updateProjectionMatrix();
    invalidate();
  }, [height, camera, invalidate]);
  return null;
}

export function Scene() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0.95, 3.2] }}
      gl={{ toneMapping: THREE.NoToneMapping }}
      frameloop="demand"
    >
      <color attach="background" args={['#f5f0e8']} />
      <FitZoom />
      <Lighting />
      <Garments />
      <OrbitControls target={[0, 0.95, 0]} />
    </Canvas>
  );
}
