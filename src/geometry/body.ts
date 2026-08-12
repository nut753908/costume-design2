import * as THREE from 'three';

export interface BodyScaleParams {
  /** 縦方向の長さ(脚、胴体、腕)をスケールする — 全体の身長。 */
  heightScale: number;
  /** 半径/間隔(胴体、四肢、肩幅)をスケールする — 全体の体格/横幅。 */
  buildScale: number;
}

export const DEFAULT_BODY_SCALE: BodyScaleParams = { heightScale: 1, buildScale: 1 };

export interface BodyDimensions {
  legHeight: number;
  legRadius: number;
  legSpacing: number;
  torsoLength: number;
  torsoRadius: number;
  headRadius: number;
  armLength: number;
  armRadius: number;
  shoulderSpacing: number;
}

const BASE_DIMENSIONS: BodyDimensions = {
  legHeight: 0.85,
  legRadius: 0.11,
  legSpacing: 0.14,
  torsoLength: 0.55,
  torsoRadius: 0.26,
  headRadius: 0.16,
  armLength: 0.62,
  armRadius: 0.075,
  shoulderSpacing: 0.34,
};

export function computeBodyDimensions({ heightScale, buildScale }: BodyScaleParams): BodyDimensions {
  return {
    legHeight: BASE_DIMENSIONS.legHeight * heightScale,
    legRadius: BASE_DIMENSIONS.legRadius * buildScale,
    legSpacing: BASE_DIMENSIONS.legSpacing * buildScale,
    torsoLength: BASE_DIMENSIONS.torsoLength * heightScale,
    torsoRadius: BASE_DIMENSIONS.torsoRadius * buildScale,
    headRadius: BASE_DIMENSIONS.headRadius,
    armLength: BASE_DIMENSIONS.armLength * heightScale,
    armRadius: BASE_DIMENSIONS.armRadius * buildScale,
    shoulderSpacing: BASE_DIMENSIONS.shoulderSpacing * buildScale,
  };
}

export interface BodyLayout {
  feetY: number;
  legCenterY: number;
  waistY: number;
  torsoCenterY: number;
  shoulderY: number;
  headCenterY: number;
  armCenterY: number;
}

export function computeBodyLayout(d: BodyDimensions): BodyLayout {
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

export function computeBodyAnchors(layout: BodyLayout): Record<'waist' | 'shoulder' | 'feet', THREE.Vector3> {
  return {
    waist: new THREE.Vector3(0, layout.waistY, 0),
    shoulder: new THREE.Vector3(0, layout.shoulderY, 0),
    feet: new THREE.Vector3(0, layout.feetY, 0),
  };
}
