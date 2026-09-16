import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';

export interface PantsLegParams {
  waistRadius: number;
  hemRadius: number;
  inseam: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 1本の脚を、ウエストから裾までのプロファイルを回転体(Lathe)で構築する。左右2本を
 * ±legSpacing だけ X方向に離してまとめる処理は、この関数の責務ではなく
 * `nodes/definitions/mirrorPair.ts`(グループノード)がノードグラフ側で担う —
 * `pantsGroupNode.ts` が `pantsLegGenerator`(このジオメトリのノードラッパー)の出力を
 * `mirrorPair` へ渡して左右対称ペアにする(`bodyLimbGroupNode.ts` が
 * `cylinderGenerator`→`mirrorPair` としているのと同じ形)。 */
export function buildPantsLegGeometry({ waistRadius, hemRadius, inseam, segments }: PantsLegParams): THREE.BufferGeometry {
  const points = buildEasedLatheProfile(waistRadius, hemRadius, inseam, 'down', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments);
}
