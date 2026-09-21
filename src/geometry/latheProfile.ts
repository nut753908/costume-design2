import * as THREE from 'three';

export type ProfileDirection = 'up' | 'down';

/**
 * アンカー側(radius=startRadius)から反対側の端(radius=endRadius)まで、半径を smoothstep で
 * イージングしながら結ぶ、LatheGeometry 用のプロファイルの曲線。`getPoint(t)` は `(半径, 高さ)`。
 * direction='down' はアンカーから -Y へ(スカート/パンツの脚/手袋のように垂れ下がる)、
 * 'up' はアンカーから +Y へ(靴/帽子のように上に伸びる)。LatheGeometry は外向きの巻き順/法線を
 * 得るために下→上の順のプロファイルを期待するため、どちらの向きも `t` が増えるほど(小さい y から
 * 大きい y へ)上へ進むように作る('down' は反対側の端が `t=0`、アンカーが `t=1`)。
 * 点列は `getPoints(steps)`(`t=i/steps`)で取り出す。
 */
export class EasedLatheCurve extends THREE.Curve<THREE.Vector2> {
  private readonly startRadius: number;
  private readonly endRadius: number;
  private readonly distance: number;
  private readonly direction: ProfileDirection;

  constructor(startRadius: number, endRadius: number, distance: number, direction: ProfileDirection) {
    super();
    this.startRadius = startRadius;
    this.endRadius = endRadius;
    this.distance = distance;
    this.direction = direction;
  }

  override getPoint(t: number, optionalTarget: THREE.Vector2 = new THREE.Vector2()): THREE.Vector2 {
    // アンカー側からの進み具合 s(0=アンカー、1=反対側の端)
    const s = this.direction === 'down' ? 1 - t : t;
    const eased = s * s * (3 - 2 * s);
    const radius = this.startRadius + (this.endRadius - this.startRadius) * eased;
    return optionalTarget.set(radius, this.direction === 'down' ? -s * this.distance : s * this.distance);
  }
}
