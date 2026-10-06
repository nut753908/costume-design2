import { BODY_DIMENSIONS } from './bodyDimensionDefaults';
import type { GraphEdge, GraphNode } from '../types';

export type BodyRadius = 'torsoRadius' | 'legRadius' | 'armRadius' | 'neckRadius' | 'headRadius';

/** ガーメントの「体に触れる半径」の固定値のノード: ボディの基準寸法(`bodyDimensionDefaults.ts`)× `ratio` を
 * `id`(`numberInput`)の入力欄の値として持つ(体の寸法を変えても追従しない)。出力は `<id>.value`。 */
export function fixedBodyRadius(radius: BodyRadius, ratio: number, id = 'scale'): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [{ id, type: 'numberInput', data: { value: BODY_DIMENSIONS[radius] * ratio } }],
    edges: [],
  };
}

/** 肩の丸みで首まわりまで閉じた上衣のプロファイルの定型: `profile`(`shoulderedProfile`、
 * `generic/shoulderedProfile.ts`)と、体の胴体半径 `bodyTorsoRadius`・首まわりの開口の半径 `neckOpening`
 * (体の首の半径 × `neckOpeningRatio`、どちらも固定値)。胸の半径は `scale`(`fixedBodyRadius('torsoRadius', …)` の出力)、
 * 裾の半径は `hemRadius` のノードの `value` 出力を配線する。出力の曲線は `profile.curve`。top/dress/jacket が使う。 */
export function shoulderedBody(config: {
  length: number;
  hemRadius: string;
  neckOpeningRatio: number;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [
      { id: 'bodyTorsoRadius', type: 'numberInput', data: { value: BODY_DIMENSIONS.torsoRadius } },
      { id: 'neckOpening', type: 'numberInput', data: { value: BODY_DIMENSIONS.neckRadius * config.neckOpeningRatio } },
      { id: 'profile', type: 'shoulderedProfile', data: { length: config.length } },
    ],
    edges: [
      { source: 'bodyTorsoRadius', sourceHandle: 'value', target: 'profile', targetHandle: 'torsoRadius' },
      { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'chestRadius' },
      { source: config.hemRadius, sourceHandle: 'value', target: 'profile', targetHandle: 'hemRadius' },
      { source: 'neckOpening', sourceHandle: 'value', target: 'profile', targetHandle: 'neckOpening' },
    ],
  };
}

/** 半径がイージングで変化する回転体の定型: `profile`(`easedLatheCurve`)→ `genId`
 * (`latheGenerator`)。`startRadius`/`endRadius`/`distance` は、他のノードの `value` 出力を配線する
 * 場合はそのノードの id、単独の値ならリテラルの数値(`profile` の入力欄の値になる)を渡す。
 * `direction` は `profile` の出力のどちらを `genId` へ配線するか(`'down'` なら `Curve Down`、`'up'` なら
 * `Curve Up`)。輪郭の分割数 `steps` と回転方向の分割数 `segments` は `genId` の入力欄の値。skirt/hat/gloves/pants/shoes/socks が使う。 */
export function latheBody(config: {
  genId: string;
  direction: 'up' | 'down';
  steps: number;
  startRadius: string | number;
  endRadius: string | number;
  distance: string | number;
  segments: number;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const profileData: Record<string, unknown> = {};
  const edges: GraphEdge[] = [
    { source: 'profile', sourceHandle: config.direction, target: config.genId, targetHandle: 'profile' },
  ];
  for (const key of ['startRadius', 'endRadius', 'distance'] as const) {
    const value = config[key];
    if (typeof value === 'number') profileData[key] = value;
    else edges.push({ source: value, sourceHandle: 'value', target: 'profile', targetHandle: key });
  }
  return {
    nodes: [
      { id: 'profile', type: 'easedLatheCurve', data: profileData },
      { id: config.genId, type: 'latheGenerator', data: { segments: config.segments, steps: config.steps } },
    ],
    edges,
  };
}
