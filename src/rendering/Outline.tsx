import { useMemo } from 'react';
import * as THREE from 'three';

interface OutlineProps {
  geometry: THREE.BufferGeometry;
  color?: THREE.ColorRepresentation;
  /** Fractional scale added to the hull, e.g. 0.035 -> rendered at 1.035x scale. */
  thickness?: number;
}

/** Inverted-hull outline: a back-face-only duplicate of the mesh, scaled up slightly. */
export function Outline({ geometry, color = '#181818', thickness = 0.022 }: OutlineProps) {
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }),
    [color],
  );

  return <mesh geometry={geometry} material={material} scale={1 + thickness} />;
}
