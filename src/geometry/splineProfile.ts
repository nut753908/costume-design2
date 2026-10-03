import * as THREE from 'three';

/**
 * 等間隔の高さに置いた制御半径 `radii` を、なめらかにつなぐ LatheGeometry 用のプロファイルの曲線。
 * `getPoint(t)` は `(半径, 高さ)` で、高さは `t × length`(0 が下端、`t` が増えるほど上へ進む)。
 *
 * 補間は半径そのものではなく半径の2乗に対して、曲率まで連続な3次スプライン(C2)で行う。
 * 半径が 0 の端(球の極)では、2乗が高さに対してほぼ線形に増えるので、半径は高さの平方根で増え、
 * 端が球のようにまるく閉じる(半径をそのまま補間すると、端が円錐のようにとがる)。両端は
 * 「端の区間が2次式で終わる」条件(放物線での打ち切り)にしてあるので、球の輪郭(半径の2乗が
 * 高さの2次式)は制御点が球の上にあればちょうど再現される。曲率が連続なので、少ない制御点でも
 * 輪郭に角(制御点ごとの多角形のような折れ)が出ない。制御点の値が急に変わると制御点の間で
 * 多少膨らむことがあるが、半径は 0 未満にならない。
 */
export class SplineProfileCurve extends THREE.Curve<THREE.Vector2> {
  private readonly squares: number[];
  private readonly secondDerivatives: number[];
  private readonly length: number;

  constructor(radii: number[], length: number) {
    super();
    this.length = length;
    this.squares = radii.map((r) => Math.max(0, r) ** 2);
    this.secondDerivatives = splineSecondDerivatives(this.squares);
  }

  override getPoint(t: number, optionalTarget: THREE.Vector2 = new THREE.Vector2()): THREE.Vector2 {
    const n = this.squares.length;
    const clamped = Math.min(1, Math.max(0, t));
    if (n === 0) return optionalTarget.set(0, clamped * this.length);
    if (n === 1) return optionalTarget.set(Math.sqrt(this.squares[0]), clamped * this.length);
    const position = clamped * (n - 1);
    const i = Math.min(n - 2, Math.floor(position));
    const u = position - i;
    const [y0, y1] = [this.squares[i], this.squares[i + 1]];
    const [m0, m1] = [this.secondDerivatives[i], this.secondDerivatives[i + 1]];
    // 区間 [i, i+1](幅 1)の3次スプライン
    const value = y0 * (1 - u) + y1 * u + (m0 * ((1 - u) ** 3 - (1 - u)) + m1 * (u ** 3 - u)) / 6;
    return optionalTarget.set(Math.sqrt(Math.max(0, value)), clamped * this.length);
  }
}

/**
 * 等間隔の高さに置いた制御値 `values`(正負どちらでも可)を、値そのものに対する曲率連続の3次スプライン
 * (両端は2次式で打ち切る)でなめらかにつなぐ曲線。`getPoint(t)` は `(値, 高さ)` で、高さは `t × length`。
 * `SplineProfileCurve` は半径の2乗を補間するので 0 未満を表せないが、これは輪の前後のずらし量のような
 * 符号付きの量を表すために使う。全制御値が 0 なら曲線は常に値 0。
 */
export class SignedSplineCurve extends THREE.Curve<THREE.Vector2> {
  private readonly values: number[];
  private readonly secondDerivatives: number[];
  private readonly length: number;

  constructor(values: number[], length: number) {
    super();
    this.length = length;
    this.values = values.slice();
    this.secondDerivatives = splineSecondDerivatives(this.values);
  }

  override getPoint(t: number, optionalTarget: THREE.Vector2 = new THREE.Vector2()): THREE.Vector2 {
    const n = this.values.length;
    const clamped = Math.min(1, Math.max(0, t));
    if (n === 0) return optionalTarget.set(0, clamped * this.length);
    if (n === 1) return optionalTarget.set(this.values[0], clamped * this.length);
    const position = clamped * (n - 1);
    const i = Math.min(n - 2, Math.floor(position));
    const u = position - i;
    const [y0, y1] = [this.values[i], this.values[i + 1]];
    const [m0, m1] = [this.secondDerivatives[i], this.secondDerivatives[i + 1]];
    const value = y0 * (1 - u) + y1 * u + (m0 * ((1 - u) ** 3 - (1 - u)) + m1 * (u ** 3 - u)) / 6;
    return optionalTarget.set(value, clamped * this.length);
  }
}

/** 等間隔(間隔 1)の値列 `y` の3次スプラインの各点の2階微分。両端は隣の点と同じ2階微分(端の区間が2次式)。 */
function splineSecondDerivatives(y: number[]): number[] {
  const n = y.length;
  if (n < 3) return new Array<number>(n).fill(0);
  // 未知数 M_0..M_{n-1}。内部の点: M_{i-1} + 4 M_i + M_{i+1} = 6 (y_{i-1} - 2 y_i + y_{i+1})、
  // 端: M_0 - M_1 = 0、M_{n-1} - M_{n-2} = 0(3重対角の連立方程式をトーマス法で解く)。
  const lower = new Array<number>(n).fill(0);
  const diag = new Array<number>(n).fill(0);
  const upper = new Array<number>(n).fill(0);
  const rhs = new Array<number>(n).fill(0);
  diag[0] = 1;
  upper[0] = -1;
  for (let i = 1; i < n - 1; i++) {
    lower[i] = 1;
    diag[i] = 4;
    upper[i] = 1;
    rhs[i] = 6 * (y[i - 1] - 2 * y[i] + y[i + 1]);
  }
  lower[n - 1] = -1;
  diag[n - 1] = 1;
  for (let i = 1; i < n; i++) {
    const factor = lower[i] / diag[i - 1];
    diag[i] -= factor * upper[i - 1];
    rhs[i] -= factor * rhs[i - 1];
  }
  const m = new Array<number>(n).fill(0);
  m[n - 1] = rhs[n - 1] / diag[n - 1];
  for (let i = n - 2; i >= 0; i--) m[i] = (rhs[i] - upper[i] * m[i + 1]) / diag[i];
  return m;
}
