import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';
import { buildMirroredPairGeometry } from './mirrorPair';

export interface PantsParams {
  waistRadius: number;
  hemRadius: number;
  inseam: number;
  legSpacing: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 1本の脚を、ウエストから裾までのプロファイルを回転体(Lathe)で構築する。 */
function buildLegGeometry(
  waistRadius: number,
  hemRadius: number,
  inseam: number,
  segments: number,
): THREE.BufferGeometry {
  const points = buildEasedLatheProfile(waistRadius, hemRadius, inseam, 'down', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments);
}

/** 左右2本の脚のジオメトリを1つの BufferGeometry にまとめる。 */
export function buildPantsGeometry(params: PantsParams): THREE.BufferGeometry {
  const { waistRadius, hemRadius, inseam, legSpacing, segments } = params;
  return buildMirroredPairGeometry(
    () => buildLegGeometry(waistRadius, hemRadius, inseam, segments),
    legSpacing,
  );
}
