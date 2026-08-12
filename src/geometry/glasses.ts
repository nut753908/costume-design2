import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildAlignedBox } from './alignedBox';

export interface GlassesParams {
  lensRadius: number;
  /** フレームの太さ(トーラスの管の半径)。 */
  frameThickness: number;
  /** 左右レンズの中心の、正面中央からの横方向オフセット。 */
  lensSpacing: number;
  bridgeThickness: number;
  templeLength: number;
  templeThickness: number;
}

/** head の輪郭(半径0.16程度)より前に出す深さ。bag.ts/necktie.ts の *_DEPTH と同じ理由 —
 * z=0(頭の中心)付近に置くと頭部の球に埋もれて見えなくなる。 */
const FORWARD_DEPTH = 0.14;
const TEMPLE_BACK_DEPTH = FORWARD_DEPTH - 0.02;

/** 丸メガネ。これまでのガーメントで使った回転体(Lathe)、手組みのリンググリッド、
 * BoxGeometry の整列とはまた別の、THREE.js 標準プリミティブ TorusGeometry(円環)を
 * レンズのフレームとして初めて使う。左右のレンズリムをブリッジ(内側の辺同士を結ぶ箱)で
 * つなぎ、外側の辺からテンプル(つる)を後方に伸ばす。ブリッジ/テンプルは bag.ts と
 * 共有する alignedBox.ts の「2点間に箱を整列させる」ヘルパーを再利用している。 */
export function buildGlassesGeometry(params: GlassesParams): THREE.BufferGeometry {
  const { lensRadius, frameThickness, lensSpacing, bridgeThickness, templeLength, templeThickness } = params;

  const leftCenter = new THREE.Vector3(lensSpacing, 0, FORWARD_DEPTH);
  const rightCenter = new THREE.Vector3(-lensSpacing, 0, FORWARD_DEPTH);

  const leftLens = new THREE.TorusGeometry(lensRadius, frameThickness / 2, 8, 16).translate(
    leftCenter.x,
    leftCenter.y,
    leftCenter.z,
  );
  const rightLens = new THREE.TorusGeometry(lensRadius, frameThickness / 2, 8, 16).translate(
    rightCenter.x,
    rightCenter.y,
    rightCenter.z,
  );

  const bridgeStart = new THREE.Vector3(lensSpacing - lensRadius, 0, FORWARD_DEPTH);
  const bridgeEnd = new THREE.Vector3(-(lensSpacing - lensRadius), 0, FORWARD_DEPTH);
  const bridge = buildAlignedBox(bridgeThickness, bridgeThickness, bridgeStart, bridgeEnd);

  const leftTempleStart = new THREE.Vector3(lensSpacing + lensRadius, 0, FORWARD_DEPTH);
  const leftTempleEnd = new THREE.Vector3(lensSpacing + lensRadius, 0, TEMPLE_BACK_DEPTH - templeLength);
  const leftTemple = buildAlignedBox(templeThickness, templeThickness, leftTempleStart, leftTempleEnd);

  const rightTempleStart = new THREE.Vector3(-(lensSpacing + lensRadius), 0, FORWARD_DEPTH);
  const rightTempleEnd = new THREE.Vector3(-(lensSpacing + lensRadius), 0, TEMPLE_BACK_DEPTH - templeLength);
  const rightTemple = buildAlignedBox(templeThickness, templeThickness, rightTempleStart, rightTempleEnd);

  const merged = mergeGeometries([leftLens, rightLens, bridge, leftTemple, rightTemple])!;
  merged.computeVertexNormals();
  return merged;
}
