import * as THREE from 'three';

/**
 * 等間隔の高さに置いた制御半径 `radii` を、なめらかに補間する LatheGeometry 用のプロファイルの曲線。
 * `getPoint(t)` は `(半径, 高さ)` で、高さは `t × length`(0 が下端、`t` が増えるほど上へ進む)。
 *
 * 補間は半径そのものではなく半径の2乗に対して、単調性を保つ3次エルミート補間(PCHIP)で行う。
 * 半径が 0 の端(球の極)では、2乗が高さに対してほぼ線形に増えるので、半径は高さの平方根で増え、
 * 端が球のようにまるく閉じる(半径をそのまま補間すると、端が円錐のようにとがる)。
 * 補間の途中で制御点を超えて膨らまない(オーバーシュートしない)ので、少ない制御点でくびれや肩の
 * 形を素直に表せる。
 */
export class PchipProfileCurve extends THREE.Curve<THREE.Vector2> {
  private readonly squares: number[];
  private readonly slopes: number[];
  private readonly length: number;

  constructor(radii: number[], length: number) {
    super();
    this.length = length;
    this.squares = radii.map((r) => Math.max(0, r) ** 2);
    this.slopes = pchipSlopes(this.squares);
  }

  override getPoint(t: number, optionalTarget: THREE.Vector2 = new THREE.Vector2()): THREE.Vector2 {
    const n = this.squares.length;
    const clamped = Math.min(1, Math.max(0, t));
    if (n === 0) return optionalTarget.set(0, clamped * this.length);
    if (n === 1) return optionalTarget.set(Math.sqrt(this.squares[0]), clamped * this.length);
    const position = clamped * (n - 1);
    const i = Math.min(n - 2, Math.floor(position));
    const u = position - i;
    // 区間 [i, i+1] の3次エルミート補間(区間の幅は 1 に正規化してあるので、傾きもその単位)
    const u2 = u * u;
    const u3 = u2 * u;
    const value =
      (2 * u3 - 3 * u2 + 1) * this.squares[i] +
      (u3 - 2 * u2 + u) * this.slopes[i] +
      (-2 * u3 + 3 * u2) * this.squares[i + 1] +
      (u3 - u2) * this.slopes[i + 1];
    return optionalTarget.set(Math.sqrt(Math.max(0, value)), clamped * this.length);
  }
}

/** 等間隔(間隔 1)の値列 `y` の、単調性を保つ各点の傾き(Fritsch–Carlson 法)。 */
function pchipSlopes(y: number[]): number[] {
  const n = y.length;
  if (n < 2) return y.map(() => 0);
  const delta = Array.from({ length: n - 1 }, (_, i) => y[i + 1] - y[i]);
  const slopes = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    // 隣り合う区間の傾きの符号が違う/どちらかが 0 なら極値なので、傾きは 0。
    slopes[i] = delta[i - 1] * delta[i] > 0 ? (2 * delta[i - 1] * delta[i]) / (delta[i - 1] + delta[i]) : 0;
  }
  slopes[0] = endSlope(delta[0], delta[1] ?? delta[0]);
  slopes[n - 1] = endSlope(delta[n - 2], delta[n - 3] ?? delta[n - 2]);
  return slopes;
}

/** 端の傾き(3点の片側差分を、隣の区間の傾きと符号がそろい、かつ過大にならないように補正したもの)。 */
function endSlope(d0: number, d1: number): number {
  const slope = (3 * d0 - d1) / 2;
  if (slope * d0 <= 0) return 0;
  if (d0 * d1 <= 0 && Math.abs(slope) > 3 * Math.abs(d0)) return 3 * d0;
  return slope;
}
