import type { GraphEdge, GraphNode } from '../types';

/** 全ガーメントの `groupInput` が持つ取り付け位置用の外部ソケット `anchorY`
 * (`garmentPlacement` が `offsetY` と足して geometry を平行移動する)。 */
export const anchorYSocket = { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 } as const;

/** ガーメントの `<name>GroupNode.ts` が共通して持つ「末端」のノードと配線を生成する:
 * `colorIn`(colorInput)→`material`(toonMaterial)→`sceneOut`(sceneOutput)、および
 * `offsetYIn`(numberInput)+外部ソケット `input.anchorY`→`placement`(garmentPlacement)→
 * `sceneOut`。`geometry` にはこのガーメントの最終的な geometry を出力するノードの id を渡す。
 * `color` を省略した場合(top/sleeve のように Material を共有ノードから受け取るグループ)は
 * `colorIn`/`material` を作らず、外部ソケット `input.material` を `sceneOut` へ直接配線する。
 * 生成されるノードは `input`(groupInput、`anchorY`(と `color` 省略時は `material`)ソケットを
 * 持つ)が別途 `internalNodes` に存在することを前提にする(`nodes/CLAUDE.md` の
 * 「グループノード」節参照)。 */
export function garmentOutput(config: {
  color?: { hex: string; label: string };
  offsetY: number;
  geometry: string;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [
      ...(config.color
        ? [
            { id: 'colorIn', type: 'colorInput', data: { hex: config.color.hex, label: config.color.label } },
            { id: 'material', type: 'toonMaterial', data: {} },
          ]
        : []),
      { id: 'offsetYIn', type: 'numberInput', data: { value: config.offsetY, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
      { id: 'placement', type: 'garmentPlacement', data: {} },
      { id: 'sceneOut', type: 'sceneOutput', data: {} },
    ],
    edges: [
      { source: config.geometry, sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
      ...(config.color
        ? [
            { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
            { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
          ]
        : [{ source: 'input', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' }]),
      { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
      { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
      { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    ],
  };
}
