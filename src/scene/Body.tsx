import { useMemo } from 'react';
import * as THREE from 'three';
import { BODY_DIMENSIONS as D, BODY_LAYOUT as L } from '../geometry/body';
import { createToonMaterial } from '../rendering/ToonMaterialFactory';
import { ToonMesh } from '../rendering/ToonMesh';

export function Body() {
  const skinMaterial = useMemo(() => createToonMaterial('#f2c9a0'), []);

  const torsoGeometry = useMemo(
    () => new THREE.CapsuleGeometry(D.torsoRadius, D.torsoLength, 4, 16),
    [],
  );
  const headGeometry = useMemo(() => new THREE.SphereGeometry(D.headRadius, 20, 16), []);
  const armGeometry = useMemo(
    () => new THREE.CylinderGeometry(D.armRadius, D.armRadius * 0.85, D.armLength, 12),
    [],
  );
  const legGeometry = useMemo(
    () => new THREE.CylinderGeometry(D.legRadius, D.legRadius * 0.85, D.legHeight, 12),
    [],
  );

  return (
    <group>
      <ToonMesh geometry={torsoGeometry} material={skinMaterial} position={[0, L.torsoCenterY, 0]} />
      <ToonMesh geometry={headGeometry} material={skinMaterial} position={[0, L.headCenterY, 0]} />
      <ToonMesh
        geometry={armGeometry}
        material={skinMaterial}
        position={[-D.shoulderSpacing, L.armCenterY, 0]}
      />
      <ToonMesh
        geometry={armGeometry}
        material={skinMaterial}
        position={[D.shoulderSpacing, L.armCenterY, 0]}
      />
      <ToonMesh
        geometry={legGeometry}
        material={skinMaterial}
        position={[-D.legSpacing, L.legCenterY, 0]}
      />
      <ToonMesh
        geometry={legGeometry}
        material={skinMaterial}
        position={[D.legSpacing, L.legCenterY, 0]}
      />
    </group>
  );
}
