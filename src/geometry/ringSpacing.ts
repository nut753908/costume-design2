import * as THREE from 'three';

/**
 * `loftGenerator` の輪(断面)を置く高さの割合を決める曲線。`getPoint(u)` は `(s, u)` で、`u`(0〜1)が輪の通し番号の割合、
 * `s`(0〜1)が曲線全体の高さに対する輪の高さの割合。等間隔の制御値 `values`(`u = k / (n - 1)` での `s`)を、
 * 単調な3次エルミート補間(Fritsch–Carlson)でなめらかにつなぐので、`s` は `u` に対して単調に増え、輪の順番が入れ替わらない。
 * 制御値を等間隔(`k / (n - 1)`)にすると `s = u` で、これまでと同じ等間隔の輪になる。
 * 輪を、球の極のように曲線が急に曲がる所へ密に置くための指定。
 */
export class RingSpacingCurve extends THREE.Curve<THREE.Vector2> {
  private readonly values: number[];
  private readonly slopes: number[];

  constructor(values: number[]) {
    super();
    // 単調性を保証するため、0〜1 に収めて、下がる値は直前の値へそろえる
    const v: number[] = [];
    for (const x of values) v.push(Math.min(1, Math.max(v.length ? v[v.length - 1] : 0, x)));
    this.values = v;
    this.slopes = monotoneSlopes(v);
  }

  override getPoint(u: number, optionalTarget: THREE.Vector2 = new THREE.Vector2()): THREE.Vector2 {
    const n = this.values.length;
    const clamped = Math.min(1, Math.max(0, u));
    if (n === 0) return optionalTarget.set(clamped, clamped);
    if (n === 1) return optionalTarget.set(this.values[0], clamped);
    const position = clamped * (n - 1);
    const i = Math.min(n - 2, Math.floor(position));
    const t = position - i;
    const h = 1 / (n - 1);
    const [y0, y1] = [this.values[i], this.values[i + 1]];
    const [m0, m1] = [this.slopes[i], this.slopes[i + 1]];
    const t2 = t * t;
    const t3 = t2 * t;
    // エルミート基底。傾き m は u に対する s の傾きなので、区間の幅 h を掛ける。
    const s = (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1;
    return optionalTarget.set(Math.min(1, Math.max(0, s)), clamped);
  }
}

/** 等間隔の点(間隔 1/(n-1))の単調な3次エルミート補間の、各点での傾き(Fritsch–Carlson)。 */
function monotoneSlopes(y: number[]): number[] {
  const n = y.length;
  if (n < 2) return new Array<number>(n).fill(0);
  const h = 1 / (n - 1);
  const delta = Array.from({ length: n - 1 }, (_, i) => (y[i + 1] - y[i]) / h);
  const m = new Array<number>(n).fill(0);
  m[0] = delta[0];
  m[n - 1] = delta[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = delta[i - 1] * delta[i] <= 0 ? 0 : (delta[i - 1] + delta[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (delta[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / delta[i];
    const b = m[i + 1] / delta[i];
    const r = a * a + b * b;
    if (r > 9) {
      const tau = 3 / Math.sqrt(r);
      m[i] = tau * a * delta[i];
      m[i + 1] = tau * b * delta[i];
    }
  }
  return m;
}
