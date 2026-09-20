import type { GraphEdge, GraphNode } from '../types';

/** 全ガーメントの `groupInput` が持つ取り付け位置用の外部ソケット `anchorY`
 * (`garmentPlacement` が `offsetY` と足して geometry を平行移動する)。 */
export const anchorYSocket = { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 } as const;

/** ガーメントの `<name>GroupNode.ts` が共通して持つ「末端」のノードと配線を生成する:
 * `material`(toonMaterial、`color` は入力欄の値)→`sceneOut`(sceneOutput)、および
 * `placement`(garmentPlacement、`offsetY` は入力欄の値)+外部ソケット `input.anchorY`→
 * `sceneOut`。`geometry` にはこのガーメントの最終的な geometry を出力するノードの id を渡す。
 * 生成されるノードは `input`(groupInput、`anchorY` ソケットを持つ)が別途 `internalNodes` に存在することを前提にする(`nodes/CLAUDE.md` の
 * 「グループノード」節参照)。 */
export function garmentOutput(config: {
  color: string;
  offsetY: number;
  geometry: string;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [
      { id: 'material', type: 'toonMaterial', data: { color: config.color } },
      { id: 'placement', type: 'garmentPlacement', data: { offsetY: config.offsetY } },
      { id: 'sceneOut', type: 'sceneOutput', data: {} },
    ],
    edges: [
      { source: config.geometry, sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
      { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
      { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
      { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    ],
  };
}
