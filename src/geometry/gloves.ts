import * as THREE from 'three';

export interface GlovesParams {
  wristRadius: number;
  handRadius: number;
  length: number;
  armSpacing: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 1つの手袋を、手首(アンカー、上)から指先(下)までのプロファイルを回転体(Lathe)で
 * 構築する。skirt.ts / pants.ts と同じ smoothstep イージング/反転の手法(wrist アンカーが
 * 手袋の上端にあるため、腕は下に垂れ下がる skirt/pants と同じ向き)。 */
function buildGloveGeometry(
  wristRadius: number,
  handRadius: number,
  length: number,
  segments: number,
): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= PROFILE_STEPS; i++) {
    const t = i / PROFILE_STEPS; // 手首で0、指先で1
    const eased = t * t * (3 - 2 * t);
    const radius = wristRadius + (handRadius - wristRadius) * eased;
    const y = -t * length;
    points.push(new THREE.Vector2(radius, y));
  }
  points.reverse(); // skirt.ts と同じ理由(Lathe が下→上のプロファイルを期待する)で反転
  return new THREE.LatheGeometry(points, segments);
}

/** 左右2つの手袋のジオメトリを1つの BufferGeometry にまとめる。pants.ts / shoes.ts と同じ
 * アプローチ(独立した Lathe ジオメトリを平行移動して連結)。wrist アンカーは中心線(x=0)の
 * 1点のみのため、肩幅ぶんの左右オフセットはこの関数が自分で行う(sleeve.ts が肩の左右チューブを
 * 単一の shoulder アンカーに対して自分で行っているのと同じ)。 */
export function buildGlovesGeometry(params: GlovesParams): THREE.BufferGeometry {
  const { wristRadius, handRadius, length, armSpacing, segments } = params;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const side of [-1, 1]) {
    const glove = buildGloveGeometry(wristRadius, handRadius, length, segments);
    glove.translate(side * armSpacing, 0, 0);

    const glovePositions = glove.getAttribute('position').array as Float32Array;
    const gloveIndex = glove.getIndex()!;
    const baseIndex = positions.length / 3;

    for (let i = 0; i < glovePositions.length; i++) positions.push(glovePositions[i]);
    for (let i = 0; i < gloveIndex.count; i++) indices.push(baseIndex + gloveIndex.getX(i));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
