import type * as THREE from 'three';

const NECKLINE_HALF_WIDTH = Math.PI / 3; // 落ち込みは正面から左右60度でゼロまでテーパーする

/** 正面(angle=0)からの角度を正規化した `t`(0〜1、`NECKLINE_HALF_WIDTH` で1)に対する落ち込み量の
 * 曲線 `weights`(x が t、y が重み。x の昇順の点列)を、`angle` の位置で線形補間して返す。
 * 曲線の形(round/v/square)はノードグラフ側で作る(`generic/necklineShapes.ts` の `necklineShapes` グループ)。
 * `NECKLINE_HALF_WIDTH` を超えた角度は常に0、曲線の範囲外は端の値で頭打ちにする。
 * top/dress が共有する `ringGrid.ts` が、最上段のリングの頂点だけを角度ごとに引き下げて
 * ネックラインを彫り込むのに使う。 */
export function necklineWeight(weights: THREE.Vector2[], angle: number): number {
  if (weights.length === 0) return 0;
  let a = angle;
  if (a > Math.PI) a -= Math.PI * 2;
  if (Math.abs(a) > NECKLINE_HALF_WIDTH) return 0;
  const t = Math.abs(a) / NECKLINE_HALF_WIDTH;

  if (t <= weights[0].x) return weights[0].y;
  for (let i = 1; i < weights.length; i++) {
    const next = weights[i];
    if (t <= next.x) {
      const prev = weights[i - 1];
      const span = next.x - prev.x;
      return span === 0 ? next.y : prev.y + ((next.y - prev.y) * (t - prev.x)) / span;
    }
  }
  return weights[weights.length - 1].y;
}
