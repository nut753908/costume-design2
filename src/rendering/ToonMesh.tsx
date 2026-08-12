import * as THREE from 'three';
import { Outline } from './Outline';

interface ToonMeshProps {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position?: [number, number, number];
  rotation?: [number, number, number];
  outlineColor?: THREE.ColorRepresentation;
  outlineThickness?: number;
}

/** トゥーンシェーディングされたメッシュと、そのインバーテッドハル(法線を反転させた拡大複製)アウトラインをペアにしたもの。 */
export function ToonMesh({
  geometry,
  material,
  position,
  rotation,
  outlineColor,
  outlineThickness,
}: ToonMeshProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} material={material} />
      <Outline geometry={geometry} color={outlineColor} thickness={outlineThickness} />
    </group>
  );
}
