import * as THREE from 'three';
import { buildEasedLatheProfile } from './latheProfile';

export interface JacketParams {
  /** 肩(アンカー側)の半径。top を重ね着できるよう torsoRadius よりやや大きめが自然。 */
  shoulderRadius: number;
  length: number;
  /** 0 = ストレート、値が大きいほど裾がボックスシルエットに広がる。 */
  hemFlare: number;
  segments: number;
}

const PROFILE_STEPS = 10;

/** 肩から裾までのプロファイルを回転体(Lathe)で構築する、top を上から重ね着する上着。
 * skirt/belt と同じ latheProfile.ts のイージング済みプロファイルを再利用しており、
 * ネックラインの切り欠きなどは持たない単純な筒状シルエット(top.ts のような放射非対称の
 * 彫り込みは行わない、単純な重ね着レイヤーとしての MVP)。 */
export function buildJacketGeometry(params: JacketParams): THREE.BufferGeometry {
  const { shoulderRadius, length, hemFlare, segments } = params;
  const hemRadius = shoulderRadius * (1 + Math.max(0, hemFlare));
  const points = buildEasedLatheProfile(shoulderRadius, hemRadius, length, 'down', PROFILE_STEPS);
  return new THREE.LatheGeometry(points, segments);
}
