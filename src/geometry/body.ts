import * as THREE from 'three';

export const BODY_DIMENSIONS = {
  legHeight: 0.85,
  legRadius: 0.11,
  legSpacing: 0.14,
  torsoLength: 0.55,
  torsoRadius: 0.26,
  headRadius: 0.16,
  armLength: 0.62,
  armRadius: 0.075,
  shoulderSpacing: 0.34,
} as const;

function computeLayout() {
  const d = BODY_DIMENSIONS;
  const feetY = 0;
  const legCenterY = feetY + d.legHeight / 2;
  const waistY = feetY + d.legHeight;
  const torsoCapsuleHeight = d.torsoLength + d.torsoRadius * 2;
  const torsoCenterY = waistY + torsoCapsuleHeight / 2;
  const shoulderY = waistY + torsoCapsuleHeight;
  const headCenterY = shoulderY + d.headRadius;
  const armCenterY = shoulderY - d.armLength / 2 - d.torsoRadius * 0.4;

  return { feetY, legCenterY, waistY, torsoCenterY, shoulderY, headCenterY, armCenterY };
}

export const BODY_LAYOUT = computeLayout();

export const BODY_ANCHORS: Record<'waist' | 'shoulder', THREE.Vector3> = {
  waist: new THREE.Vector3(0, BODY_LAYOUT.waistY, 0),
  shoulder: new THREE.Vector3(0, BODY_LAYOUT.shoulderY, 0),
};
