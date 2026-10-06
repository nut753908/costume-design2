import type { GraphEdge, GraphNode } from '../types';

/** 全ガーメントの `groupInput` が持つ取り付け位置用の外部ソケット `anchorY`
 * (`garmentPlacement` が `offsetY` と足して geometry を平行移動する)。 */
export const anchorYSocket = { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 } as const;

/** 全ガーメントの `groupInput` が持つ色の外部ソケット `color`(`material` の色へ配線される)。
 * `hex` はそのガーメントの既定の色。 */
export const colorSocket = (hex: string) => ({ id: 'color', label: 'Color', type: 'color', default: hex }) as const;

/** 肌・服共通の塗り: `material`(toonShadowMaterial、色は外部ソケット `input.color`、影の色は `shade`(shadeColor)で `input.color` から作る)。
 * `material` の出力(`material`)を `sceneOutput` へ配線するのは呼び出し側。`input`(groupInput、`colorSocket()` を持つ)が別途存在する前提。 */
export function shadowMaterialParts(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [
      { id: 'shade', type: 'shadeColor', data: {} },
      { id: 'material', type: 'toonShadowMaterial', data: {} },
    ],
    edges: [
      { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
      { source: 'input', sourceHandle: 'color', target: 'shade', targetHandle: 'color' },
      { source: 'shade', sourceHandle: 'color', target: 'material', targetHandle: 'shadowColor' },
    ],
  };
}

/** ガーメントの `<name>GroupNode.ts` が共通して持つ「末端」のノードと配線を生成する:
 * `material`(toonShadowMaterial、色は外部ソケット `input.color`、影の色は `shade`(shadeColor)で `input.color` から作る)→`sceneOut`(sceneOutput)、および
 * `placement`(garmentPlacement、`offsetY` は入力欄の値)+外部ソケット `input.anchorY`→
 * `sceneOut`。`geometry` にはこのガーメントの最終的な geometry を出力するノードの id を渡す。
 * 生成されるノードは `input`(groupInput、`anchorY`/`color`(`colorSocket()`)ソケットを持つ)が別途 `internalNodes` に存在することを前提にする(`nodes/CLAUDE.md` の
 * 「グループノード」節参照)。 */
export function garmentOutput(config: {
  offsetY: number;
  geometry: string;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const skin = shadowMaterialParts();
  return {
    nodes: [
      ...skin.nodes,
      { id: 'placement', type: 'garmentPlacement', data: { offsetY: config.offsetY } },
      { id: 'sceneOut', type: 'sceneOutput', data: {} },
    ],
    edges: [
      { source: config.geometry, sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
      { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
      ...skin.edges,
      { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
      { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    ],
  };
}
