import type { GraphEdge, GraphNode } from '../types';

/** 「体に触れる半径」を Body Build でスケールする定型: 生パラメータ(`rawId`、`value` 出力を持つ
 * ノードの id)× 外部ソケット `input.bodyBuild` を `scale`(`numberMultiply`)で掛ける。
 * 出力は `scale.value`。1つのグループで複数の半径をスケールする場合は、`scaleId` で
 * 別々の id を付ける。`input`(groupInput、`bodyBuild` ソケットを持つ)が別途
 * `internalNodes` に存在することを前提にする(`nodes/CLAUDE.md` の「グループノード」節参照)。 */
export function bodyBuildScale(rawId: string, scaleId = 'scale'): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [{ id: scaleId, type: 'numberMultiply', data: {} }],
    edges: [
      { source: rawId, sourceHandle: 'value', target: scaleId, targetHandle: 'value' },
      { source: 'input', sourceHandle: 'bodyBuild', target: scaleId, targetHandle: 'factor' },
    ],
  };
}

/** 半径がイージングで変化する回転体の定型: `profile`(`easedLatheProfile`)→ `genId`
 * (`latheGenerator`)。`startRadius`/`endRadius`/`distance` は `value` 出力を持つノードの id で、
 * 分割数は `segmentsIn`(numberInput)を配線する(グループ内に別途存在することが前提)。
 * skirt/jacket/hat/gloves/pants/shoes/socks が使う。 */
export function latheBody(config: {
  genId: string;
  direction: 'up' | 'down';
  steps: number;
  startRadius: string;
  endRadius: string;
  distance: string;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [
      { id: 'profile', type: 'easedLatheProfile', data: { direction: config.direction, steps: config.steps } },
      { id: config.genId, type: 'latheGenerator', data: {} },
    ],
    edges: [
      { source: config.startRadius, sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
      { source: config.endRadius, sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
      { source: config.distance, sourceHandle: 'value', target: 'profile', targetHandle: 'distance' },
      { source: 'profile', sourceHandle: 'points', target: config.genId, targetHandle: 'points' },
      { source: 'segmentsIn', sourceHandle: 'value', target: config.genId, targetHandle: 'segments' },
    ],
  };
}
