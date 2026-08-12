import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface BagParams {
  strapWidth: number;
  strapThickness: number;
  /** 肩の付け根(アンカー付近)でのストラップの横方向オフセット。 */
  shoulderOffset: number;
  /** 反対の腰側でのストラップの横方向オフセット。shoulderOffset と逆側に置くことで
   * 斜めがけの角度をつける。 */
  hipOffset: number;
  /** アンカーからバッグ本体までの垂れ下がり量。 */
  drop: number;
  bagWidth: number;
  bagHeight: number;
  bagDepth: number;
}

/** ストラップの開始点(肩付近)は体の前面にごく近い深さ、終端(反対の腰)は体の輪郭より
 * 前に出す深さ。torso の壁(半径 0.26〜0.34 程度)の内側に埋もれて見えなくならないよう、
 * hipOffset とあわせて胴体の外側にはっきり出るようにするための固定値。 */
const STRAP_START_DEPTH = 0.05;
const BAG_FRONT_DEPTH = 0.18;

/** 斜めがけのバッグ。これまでのガーメント(Lathe の回転体、または top/dress の手組みリンググリッド)
 * とは異なり、body.ts と同じ THREE.js 標準プリミティブ(BoxGeometry)を使う。ストラップは
 * 肩付近から反対の腰側までを結ぶ2点間に箱を整列させて作り(回転・平行移動のみの剛体変換なので
 * 標準プリミティブの正しい巻き順はそのまま保たれる)、バッグ本体はストラップの終端に置いた
 * もう1つの箱。mirrorPair.ts と同じ mergeGeometries で1つの BufferGeometry にまとめる。 */
export function buildBagGeometry(params: BagParams): THREE.BufferGeometry {
  const { strapWidth, strapThickness, shoulderOffset, hipOffset, drop, bagWidth, bagHeight, bagDepth } = params;

  const strapStart = new THREE.Vector3(shoulderOffset, 0, STRAP_START_DEPTH);
  const strapEnd = new THREE.Vector3(-hipOffset, -drop, BAG_FRONT_DEPTH);
  const strap = buildAlignedBox(strapWidth, strapThickness, strapStart, strapEnd);

  const bagCenter = strapEnd.clone().add(new THREE.Vector3(0, -bagHeight / 2, 0));
  const bag = new THREE.BoxGeometry(bagWidth, bagHeight, bagDepth).translate(bagCenter.x, bagCenter.y, bagCenter.z);

  const merged = mergeGeometries([strap, bag])!;
  merged.computeVertexNormals();
  return merged;
}

/** start から end まで(その方向を「高さ」として)伸びる、幅 width・厚み thickness の箱を作る。
 * BoxGeometry を中点に平行移動し、+Y 軸が start→end 方向を向くよう回転させるだけなので、
 * 反転(負のスケール)を伴わない剛体変換であり、元の巻き順が壊れない。 */
function buildAlignedBox(
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
