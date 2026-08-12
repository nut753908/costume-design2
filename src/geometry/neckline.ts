export type NecklineType = 'round' | 'v' | 'square';

const NECKLINE_HALF_WIDTH = Math.PI / 3; // 落ち込みは正面から左右60度でゼロまでテーパーする

/** 0(正面、angle=0)が落ち込みの最深点で、NECKLINE_HALF_WIDTH で0までテーパーする。
 * top.ts と dress.ts で共有する — どちらも最上段のリングの頂点だけを角度ごとに
 * 引き下げてネックラインを彫り込む、放射非対称なリンググリッド構築を使うため。 */
export function necklineWeight(type: NecklineType, angle: number): number {
  let a = angle;
  if (a > Math.PI) a -= Math.PI * 2;
  if (Math.abs(a) > NECKLINE_HALF_WIDTH) return 0;
  const t = Math.abs(a) / NECKLINE_HALF_WIDTH;

  switch (type) {
    case 'square':
      return 1;
    case 'v':
      return 1 - t;
    case 'round':
    default:
      return 1 - t * t;
  }
}
