import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildAlignedBox } from './alignedBox';

export interface GlassesFrameParams {
  lensRadius: number;
  bridgeThickness: number;
  lensSpacing: number;
  templeLength: number;
  templeThickness: number;
}

/** head の輪郭(半径0.16程度)より前に出す深さ。bag.ts/necktie.ts の *_DEPTH と同じ理由 —
 * z=0(頭の中心)付近に置くと頭部の球に埋もれて見えなくなる。レンズ(TorusGeometry)の配置は
 * `glassesGroupNode.ts` 側の `forwardDepthIn`(ノードグラフ上の固定 `numberInput`)がこの値と
 * 同じ数値を持つ形で再現している — この定数を変えたら `forwardDepthIn` の値も合わせて
 * 変えること。 */
export const FORWARD_DEPTH = 0.14;
const TEMPLE_BACK_DEPTH = FORWARD_DEPTH - 0.02;

/** 丸メガネのフレーム(ブリッジ+左右テンプル)だけを構築する。左右のレンズ(TorusGeometry)は
 * 単純な軸並行移動で配置できるため `glassesGroupNode.ts` 側のノードグラフで組み立てるが、
 * ブリッジ/テンプルは `alignedBox.ts` による2点間整列が必要で、それをノード化する汎用ノードが
 * まだ無いためこの関数にコードとして残っている(`geometry/CLAUDE.md` 参照)。 */
export function buildGlassesFrameGeometry(params: GlassesFrameParams): THREE.BufferGeometry {
  const { lensRadius, bridgeThickness, lensSpacing, templeLength, templeThickness } = params;

  const bridgeStart = new THREE.Vector3(lensSpacing - lensRadius, 0, FORWARD_DEPTH);
  const bridgeEnd = new THREE.Vector3(-(lensSpacing - lensRadius), 0, FORWARD_DEPTH);
  const bridge = buildAlignedBox(bridgeThickness, bridgeThickness, bridgeStart, bridgeEnd);

  const leftTempleStart = new THREE.Vector3(lensSpacing + lensRadius, 0, FORWARD_DEPTH);
  const leftTempleEnd = new THREE.Vector3(lensSpacing + lensRadius, 0, TEMPLE_BACK_DEPTH - templeLength);
  const leftTemple = buildAlignedBox(templeThickness, templeThickness, leftTempleStart, leftTempleEnd);

  const rightTempleStart = new THREE.Vector3(-(lensSpacing + lensRadius), 0, FORWARD_DEPTH);
  const rightTempleEnd = new THREE.Vector3(-(lensSpacing + lensRadius), 0, TEMPLE_BACK_DEPTH - templeLength);
  const rightTemple = buildAlignedBox(templeThickness, templeThickness, rightTempleStart, rightTempleEnd);

  const merged = mergeGeometries([bridge, leftTemple, rightTemple])!;
  merged.computeVertexNormals();
  return merged;
}
