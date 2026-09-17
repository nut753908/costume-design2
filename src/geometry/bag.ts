import * as THREE from 'three';
import { buildAlignedBox } from './alignedBox';

export interface BagStrapParams {
  strapWidth: number;
  strapThickness: number;
  shoulderOffset: number;
  hipOffset: number;
  drop: number;
}

/** ストラップの開始点(肩付近)は体の前面にごく近い深さ。torso の壁(半径 0.26〜0.34 程度)の
 * 内側に埋もれて見えなくならないようにするための固定値。 */
const STRAP_START_DEPTH = 0.05;
/** ストラップの終端(反対の腰)・バッグ本体を置く深さ。胴体の輪郭より前に出すことで、
 * hipOffset とあわせて胴体の外側にはっきり出るようにする。バッグ本体の配置は
 * `bagGroupNode.ts` 側の `bagFrontDepthIn`(ノードグラフ上の固定 `numberInput`)がこの値と
 * 同じ数値を持つ形で再現している — この定数を変えたら `bagFrontDepthIn` の値も合わせて
 * 変えること。 */
export const BAG_FRONT_DEPTH = 0.18;

/** 斜めがけのストラップだけを構築する。`THREE.js` 標準プリミティブ(BoxGeometry)を、
 * 肩付近から反対の腰側までを結ぶ2点間に整列させて作る(回転・平行移動のみの剛体変換
 * なので標準プリミティブの正しい巻き順はそのまま保たれる)。バッグ本体は単純な軸並行移動
 * だけで配置できるため `bagGroupNode.ts` 側のノードグラフで組み立てるが、ストラップは
 * `alignedBox.ts` による2点間整列が必要で、それをノード化する汎用ノードがまだ無いため
 * この関数にコードとして残っている(`geometry/CLAUDE.md` 参照)。 */
export function buildBagStrapGeometry(params: BagStrapParams): THREE.BufferGeometry {
  const { strapWidth, strapThickness, shoulderOffset, hipOffset, drop } = params;
  const strapStart = new THREE.Vector3(shoulderOffset, 0, STRAP_START_DEPTH);
  const strapEnd = new THREE.Vector3(-hipOffset, -drop, BAG_FRONT_DEPTH);
  return buildAlignedBox(strapWidth, strapThickness, strapStart, strapEnd);
}
