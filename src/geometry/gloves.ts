import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';
import { buildMirroredPairGeometry } from './mirrorPair';

export interface GlovesParams {
  wristRadius: number;
  handRadius: number;
  length: number;
  armSpacing: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 1つの手袋を、手首(アンカー、上)から指先(下)までのプロファイルを回転体(Lathe)で構築する。 */
function buildGloveGeometry(
  wristRadius: number,
  handRadius: number,
  length: number,
  segments: number,
): THREE.BufferGeometry {
  const points = buildEasedLatheProfile(wristRadius, handRadius, length, 'down', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments);
}

/** 左右2つの手袋のジオメトリを1つの BufferGeometry にまとめる。wrist アンカーは中心線(x=0)の
 * 1点のみのため、肩幅ぶんの左右オフセットはこの関数が自分で行う(sleeve.ts が肩の左右チューブを
 * 単一の shoulder アンカーに対して自分で行っているのと同じ)。 */
export function buildGlovesGeometry(params: GlovesParams): THREE.BufferGeometry {
  const { wristRadius, handRadius, length, armSpacing, segments } = params;
  return buildMirroredPairGeometry(
    () => buildGloveGeometry(wristRadius, handRadius, length, segments),
    armSpacing,
  );
}
