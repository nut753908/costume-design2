import * as THREE from 'three';

/** start から end まで(その方向を「高さ」として)伸びる、幅 width・厚み thickness の箱を作る。
 * `alignedBoxGenerator` が使う。BoxGeometry を
 * 中点に平行移動し、+Y 軸が start→end 方向を向くよう回転させるだけなので、反転(負のスケール)
 * を伴わない剛体変換であり、標準プリミティブの正しい巻き順がそのまま保たれる。 */
export function buildAlignedBox(
  width: number,
  thickness: number,
  start: THREE.Vector3,
  end: THREE.Vector3,
): THREE.BufferGeometry {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );

  const box = new THREE.BoxGeometry(width, length, thickness);
  box.applyQuaternion(rotation);
  box.translate(midpoint.x, midpoint.y, midpoint.z);
  return box;
}
