import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';

export interface SkirtParams {
  waistRadius: number;
  length: number;
  /** 0 = ストレート/ペンシルスカート、値が大きいほど裾が広がる。 */
  flare: number;
  segments: number;
}

const PROFILE_STEPS = 12;

/** ウエストから裾までのプロファイルを回転体(Lathe)で構築する。 */
export function buildSkirtGeometry(params: SkirtParams): THREE.BufferGeometry {
  const { waistRadius, length, flare, segments } = params;
  const hemRadius = waistRadius * (1 + Math.max(0, flare));
  const points = buildEasedLatheProfile(waistRadius, hemRadius, length, 'down', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments);
}
