import { useEffect } from 'react';
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

/** トゥーンシェーディングされたメッシュと、そのインバーテッドハル(法線を反転させた拡大複製)アウトラインをペアにしたもの。
 *
 * geometry/material は evaluateGraph が毎回新規に構築したオブジェクトを props 経由で
 * 受け取る(JSX 子要素としては所有していない)ため、R3F の自動 dispose(unmount 時のみ発火)
 * は効かない。差し替えられる/このコンポーネントが unmount される直前に手動で dispose する。 */
export function ToonMesh({
  geometry,
  material,
  position,
  rotation,
  outlineColor,
  outlineThickness,
}: ToonMeshProps) {
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} material={material} />
      <Outline geometry={geometry} color={outlineColor} thickness={outlineThickness} />
    </group>
  );
}
