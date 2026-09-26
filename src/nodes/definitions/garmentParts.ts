import type { GraphEdge, GraphNode } from '../types';

/** ガーメントの「体に触れる半径」が追従する体の半径の外部ソケット(id は `bodyDimensions` の出力と
 * 同じ)。既定値は `bodyDimensions` の基準値と同じなので、未接続でも既定の体型に合った大きさになる。 */
export const bodyRadiusSockets = {
  torsoRadius: { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0.14 },
  legRadius: { id: 'legRadius', label: 'Leg Radius', type: 'number', default: 0.06 },
  armRadius: { id: 'armRadius', label: 'Arm Radius', type: 'number', default: 0.04 },
  neckRadius: { id: 'neckRadius', label: 'Neck Radius', type: 'number', default: 0.045 },
} as const;

export type BodyRadius = keyof typeof bodyRadiusSockets;

/** 「体に触れる半径」を体の半径に追従させる定型: 体の半径(外部ソケット `input.<radius>`)×
 * 倍率(`scale` の `Value` 入力欄)を `scale`(`numberMultiply`)で求める。出力は `scale.value`。
 * 1つのグループで複数の半径を求める場合は、`scaleId` で別々の id を付ける。`input`(groupInput、
 * `bodyRadiusSockets[radius]` を持つ)が別途 `internalNodes` に存在することを前提にする。 */
export function bodyRadiusScale(
  radius: BodyRadius,
  ratio: number,
  scaleId = 'scale',
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [{ id: scaleId, type: 'numberMultiply', data: { value: ratio } }],
    edges: [{ source: 'input', sourceHandle: radius, target: scaleId, targetHandle: 'factor' }],
  };
}

/** 半径がイージングで変化する回転体の定型: `profile`(`easedLatheCurve`)→ `genId`
 * (`latheGenerator`)。`startRadius`/`endRadius`/`distance` は、他のノードの `value` 出力を配線する
 * 場合はそのノードの id、単独の値ならリテラルの数値(`profile` の入力欄の値になる)を渡す。
 * `direction` は `profile` の出力のどちらを `genId` へ配線するか(`'down'` なら `Curve Down`、`'up'` なら
 * `Curve Up`)。輪郭の分割数 `steps` と回転方向の分割数 `segments` は `genId` の入力欄の値。skirt/jacket/hat/gloves/pants/shoes/socks が使う。 */
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
