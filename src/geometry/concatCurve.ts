import * as THREE from 'three';

/** 2つの曲線を、`t` の前半(0〜0.5)を `a`、後半(0.5〜1)を `b` として、つないだ1本の曲線。
 * `t=0.5` は `b` の始点になる(`a` の終点とは重ねない)ため、`getPoints(2 * n)` で `a` と `b` を
 * それぞれ `n` 分割して並べても、つなぎ目の点が重複しない。 */
export class ConcatCurve extends THREE.Curve<THREE.Vector2> {
  private readonly a: THREE.Curve<THREE.Vector2>;
  private readonly b: THREE.Curve<THREE.Vector2>;

  constructor(a: THREE.Curve<THREE.Vector2>, b: THREE.Curve<THREE.Vector2>) {
    super();
    this.a = a;
    this.b = b;
  }

  override getPoint(t: number, optionalTarget: THREE.Vector2 = new THREE.Vector2()): THREE.Vector2 {
    return t < 0.5 ? this.a.getPoint(t * 2, optionalTarget) : this.b.getPoint(t * 2 - 1, optionalTarget);
  }
}
