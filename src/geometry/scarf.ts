import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildBeltGeometry } from './belt';

export interface ScarfParams {
  neckRadius: number;
  bandThickness: number;
  tailWidth: number;
  tailLength: number;
  segments: number;
}

const BAND_BULGE = 1.05; // belt ほど強く膨らませず、布が首に軽く沿う程度に留める
const TAIL_FRONT_INSET = 0.9; // タイの付け根を首の輪の内側寄りに引き込み、浮かずに重なるようにする

/** 首元の輪(belt.ts の帯状 Lathe を再利用)の正面に、垂れ下がるタイ(平たい直方体)を
 * 重ねて1つのジオメトリにまとめる。belt/sleeve と同様、ブーリアン演算はせず意図的な
 * 交差のみで、mirrorPair.ts と同じ mergeGeometries + computeVertexNormals の手順を踏む。 */
export function buildScarfGeometry(params: ScarfParams): THREE.BufferGeometry {
  const { neckRadius, bandThickness, tailWidth, tailLength, segments } = params;

  const band = buildBeltGeometry({ radius: neckRadius, thickness: bandThickness, bulge: BAND_BULGE, segments });

  const tail = new THREE.BoxGeometry(tailWidth, tailLength, bandThickness);
  tail.translate(0, -bandThickness - tailLength / 2, neckRadius * TAIL_FRONT_INSET);

  const merged = mergeGeometries([band, tail])!;
  merged.computeVertexNormals();
  return merged;
}
