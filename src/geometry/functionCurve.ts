import * as THREE from 'three';

/** `t`(0〜1)から `y` を求める関数 `f` を、`(t, f(t))` を返す平面の曲線(`THREE.Curve<Vector2>`)として
 * 包む。x が常に `t` と一致するため、x 軸方向に単調で、`t` がそのまま x の位置になる。
 * `nodes/definitions/generic/` の `Ramp Curve`/`Scale Curve Y`/`Translate Curve Y`/`Multiply Curve Y` が、
 * 入力の曲線を包んだ新しい曲線をこのクラスで作る(点列に分割せず、必要な位置でだけ評価する)。 */
export class FunctionCurve extends THREE.Curve<THREE.Vector2> {
  private readonly f: (t: number) => number;

  constructor(f: (t: number) => number) {
    super();
    this.f = f;
  }

  override getPoint(t: number, optionalTarget: THREE.Vector2 = new THREE.Vector2()): THREE.Vector2 {
    return optionalTarget.set(t, this.f(t));
  }
}

/** 入力の曲線 `source` の x は変えず、y だけを `mapY(y, t)` で変えた曲線。`source` が `(t, f(t))` の
 * 曲線でも、`(半径, 高さ)` の経路(`latheProfile.ts` の `EasedLatheCurve`)でも、x を保ったまま使える。 */
export class MapYCurve extends THREE.Curve<THREE.Vector2> {
  private readonly source: THREE.Curve<THREE.Vector2>;
  private readonly mapY: (y: number, t: number) => number;

  constructor(source: THREE.Curve<THREE.Vector2>, mapY: (y: number, t: number) => number) {
    super();
    this.source = source;
    this.mapY = mapY;
  }

  override getPoint(t: number, optionalTarget: THREE.Vector2 = new THREE.Vector2()): THREE.Vector2 {
    const p = this.source.getPoint(t, optionalTarget);
    return p.setY(this.mapY(p.y, t));
  }
}
