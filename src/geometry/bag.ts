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

/** 斜めがけのストラップだけを構築する。これまでのガーメント(Lathe の回転体、または
 * top/dress の手組みリンググリッド)とは異なり、body.ts と同じ THREE.js 標準プリミティブ
 * (BoxGeometry)を、肩付近から反対の腰側までを結ぶ2点間に整列させて作る(回転・平行移動
 * のみの剛体変換なので標準プリミティブの正しい巻き順はそのまま保たれる)。
 *
 * バッグ本体(直方体)は以前この関数の中で組み立てていたが、`.translate(x,y,z)` だけの
 * 単純な配置だったため `bagGroupNode.ts` 側で `boxGenerator`→`translateX`/`translateY`/
 * `translateZ` というノードグラフへ切り出した(`pantsLegGenerator` 等と同じ「単体パーツの
 * 生成とノードグラフ側の配置を分離する」考え方)。ストラップは `alignedBox.ts`(2点間に
 * 整列させる回転+平行移動)を使っており、こちらをノード化する汎用の「2点間整列」ノードは
 * まだ無いため、この関数にコードとして残っている(`geometry/CLAUDE.md` 参照)。 */
export function buildBagStrapGeometry(params: BagStrapParams): THREE.BufferGeometry {
  const { strapWidth, strapThickness, shoulderOffset, hipOffset, drop } = params;
  const strapStart = new THREE.Vector3(shoulderOffset, 0, STRAP_START_DEPTH);
  const strapEnd = new THREE.Vector3(-hipOffset, -drop, BAG_FRONT_DEPTH);
  return buildAlignedBox(strapWidth, strapThickness, strapStart, strapEnd);
}
