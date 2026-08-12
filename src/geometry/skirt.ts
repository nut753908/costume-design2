import * as THREE from 'three';

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

  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= PROFILE_STEPS; i++) {
    const t = i / PROFILE_STEPS; // ウエストで0、裾で1
    const eased = t * t * (3 - 2 * t); // なだらかなAラインカーブのためのsmoothstep
    const radius = waistRadius + (hemRadius - waistRadius) * eased;
    const y = -t * length;
    points.push(new THREE.Vector2(radius, y));
  }
  // LatheGeometry は外向きの巻き順/法線を得るために、プロファイルが下→上の順であることを
  // 期待する。そのため、上(ウエスト)→下(裾)の順で構築した上記の配列を反転する。
  points.reverse();

  return new THREE.LatheGeometry(points, segments);
}
