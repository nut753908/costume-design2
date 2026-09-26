import type * as THREE from 'three';

// 落ち込みは正面から左右90度(真横)でゼロまでテーパーする。狭いと、肩の丸みで立ち上がった襟の
// 両脇で深さが急に変わり、首の横にツノのような角が立つ。
const NECKLINE_HALF_WIDTH = Math.PI / 2;

/** 正面(angle=0)からの角度を正規化した `t`(0〜1、`NECKLINE_HALF_WIDTH` で1)に対する落ち込み量の
 * 曲線 `weights`(x が t、y が重み)を、`angle` の位置で評価して返す。曲線は `t` で評価するため、
 * 曲線の x が `t` と一致している前提(`FunctionCurve` の曲線はそうなる)。
 * 曲線の形(round/v/square)はノードグラフ側で作る(`generic/necklineShapes.ts` の `necklineShapes` グループ)。
 * `NECKLINE_HALF_WIDTH` を超えた角度、および曲線が未接続(`undefined`)のときは常に0。
 * top/dress が共有する `ringGrid.ts` が、角度ごとの彫り込みの深さ(`necklineDepth` × 重み)を
 * 求めてネックラインを彫り込むのに使う。 */
export function necklineWeight(weights: THREE.Curve<THREE.Vector2> | undefined, angle: number): number {
  if (!weights) return 0;
  let a = angle;
  if (a > Math.PI) a -= Math.PI * 2;
  if (Math.abs(a) > NECKLINE_HALF_WIDTH) return 0;
  return weights.getPoint(Math.abs(a) / NECKLINE_HALF_WIDTH).y;
}
