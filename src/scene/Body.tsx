import { useMemo } from 'react';
import * as THREE from 'three';
import { computeBodyDimensions, computeBodyLayout } from '../geometry/body';
import { createToonMaterial } from '../rendering/ToonMaterialFactory';
import { ToonMesh } from '../rendering/ToonMesh';
import { useBodyScale } from '../state/useBodyScale';
import { useBodySkinColor } from '../state/useBodySkinColor';

export function Body() {
  const bodyScale = useBodyScale();
  const skinColor = useBodySkinColor();
  const skinMaterial = useMemo(() => createToonMaterial(skinColor), [skinColor]);

  const D = useMemo(() => computeBodyDimensions(bodyScale), [bodyScale]);
  const L = useMemo(() => computeBodyLayout(D), [D]);

  const torsoGeometry = useMemo(
    () => new THREE.CapsuleGeometry(D.torsoRadius, D.torsoLength, 4, 16),
    [D],
  );
  const headGeometry = useMemo(() => new THREE.SphereGeometry(D.headRadius, 20, 16), [D]);
  const armGeometry = useMemo(
    () => new THREE.CylinderGeometry(D.armRadius, D.armRadius * 0.85, D.armLength, 12),
    [D],
  );
  const legGeometry = useMemo(
    () => new THREE.CylinderGeometry(D.legRadius, D.legRadius * 0.85, D.legHeight, 12),
    [D],
  );

  return (
    <group>
      <ToonMesh geometry={torsoGeometry} material={skinMaterial} position={[0, L.torsoCenterY, 0]} />
      <ToonMesh geometry={headGeometry} material={skinMaterial} position={[0, L.headCenterY, 0]} />
      {[-1, 1].map((side) => (
        <ToonMesh
          key={`arm-${side}`}
          geometry={armGeometry}
          material={skinMaterial}
          position={[side * D.shoulderSpacing, L.armCenterY, 0]}
        />
      ))}
      {[-1, 1].map((side) => (
        <ToonMesh
          key={`leg-${side}`}
          geometry={legGeometry}
          material={skinMaterial}
          position={[side * D.legSpacing, L.legCenterY, 0]}
        />
      ))}
    </group>
  );
}
