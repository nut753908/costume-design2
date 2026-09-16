import * as THREE from 'three';

/** THREE.js 標準プリミティブをそのまま返すだけの、特定のガーメント/パーツに紐付かない
 * 汎用のジオメトリ生成関数群。巻き順は最初から正しい(geometry/CLAUDE.md の bag.ts/glasses.ts
 * と同じ理由)。以前は `bodyParts.ts` が「胴体(カプセル)」「頭部(球)」のようにBody専用の
 * 意味を持つ名前でこれらを直接ラップしていたが、Bodyの4パーツをガーメントと同じ
 * 「1グループ=1つの描画対象パーツ」の粒度でネストしたグループへ切り出した際
 * (`bodyTorsoGroupNode.ts`/`bodyHeadGroupNode.ts`/`bodyLimbGroupNode.ts`)、中身の
 * ジェネレーターノード自体もBody専用の型(`bodyTorsoGenerator`等)ではなく、他の用途にも
 * 転用できる汎用プリミティブノード(`capsuleGenerator`/`sphereGenerator`/`cylinderGenerator`)
 * へ置き換えた。`bodyParts.ts`(と単体テスト `bodyParts.test.ts`)は呼び出し元が無くなった
 * ため削除した。 */

export function buildCapsuleGeometry({
  radius,
  length,
  capSegments,
  radialSegments,
}: {
  radius: number;
  length: number;
  capSegments: number;
  radialSegments: number;
}): THREE.BufferGeometry {
  return new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments);
}

export function buildSphereGeometry({
  radius,
  widthSegments,
  heightSegments,
}: {
  radius: number;
  widthSegments: number;
  heightSegments: number;
}): THREE.BufferGeometry {
  return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
}

export function buildCylinderGeometry({
  radiusTop,
  radiusBottom,
  height,
  radialSegments,
}: {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  radialSegments: number;
}): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
}

export function buildTorusGeometry({
  radius,
  tube,
  radialSegments,
  tubularSegments,
}: {
  radius: number;
  tube: number;
  radialSegments: number;
  tubularSegments: number;
}): THREE.BufferGeometry {
  return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
}

export function buildBoxGeometry({
  width,
  height,
  depth,
}: {
  width: number;
  height: number;
  depth: number;
}): THREE.BufferGeometry {
  return new THREE.BoxGeometry(width, height, depth);
}
