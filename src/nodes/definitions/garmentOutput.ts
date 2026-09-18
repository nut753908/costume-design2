import type { GraphEdge, GraphNode } from '../types';

/** ガーメントの `<name>GroupNode.ts` が共通して持つ「末端」のノードと配線を生成する:
 * `colorIn`(colorInput)→`material`(toonMaterial)→`sceneOut`(sceneOutput)、および
 * `offsetYIn`(numberInput)+外部ソケット `input.anchorY`→`placement`(garmentPlacement)→
 * `sceneOut`。`geometry` にはこのガーメントの最終的な geometry を出力するノードの id を渡す。
 * 生成されるノードは `input`(groupInput、`anchorY` ソケットを持つ)が別途 `internalNodes` に
 * 存在することを前提にする(`nodes/CLAUDE.md` の「グループノード」節参照)。 */
export function garmentOutput(config: {
  color: { hex: string; label: string };
  offsetY: number;
  geometry: string;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [
      { id: 'colorIn', type: 'colorInput', data: { hex: config.color.hex, label: config.color.label } },
      { id: 'material', type: 'toonMaterial', data: {} },
      { id: 'offsetYIn', type: 'numberInput', data: { value: config.offsetY, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
      { id: 'placement', type: 'garmentPlacement', data: {} },
      { id: 'sceneOut', type: 'sceneOutput', data: {} },
    ],
    edges: [
      { source: config.geometry, sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
      { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
      { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
      { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
      { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
      { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    ],
  };
}
