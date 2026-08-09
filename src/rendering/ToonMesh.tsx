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

/** A toon-shaded mesh paired with its inverted-hull outline. */
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
