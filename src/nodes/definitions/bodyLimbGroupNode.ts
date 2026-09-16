import { defineGroupNode } from './groupNodeFactory';

/** `bodyGroup` にネストされる、左右対称な腕1組・脚1組のどちらにも使う共通のグループノード
 * (`bodyLimbGenerator` 自身が腕/脚で共用されるのと同じ考え方で、`bodyGroup` 内に2インスタンス
 * 置く)。`gen(bodyLimbGenerator)→translate(translateY)→sceneOut(sceneOutput)` チェーンだけを
 * 内包する。`bodyTorsoGroupNode.ts`/`bodyHeadGroupNode.ts` と同じ理由・同じ形(Material は
 * 共有ノードから外部ソケットで受け取るだけ)で分割した。 */
defineGroupNode({
  type: 'bodyLimbGroup',
  label: 'Body Limb Pair',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'length', label: 'Length', type: 'number', default: 0 },
          { id: 'spacing', label: 'Spacing', type: 'number', default: 0 },
          { id: 'centerY', label: 'Center Y', type: 'number', default: 0 },
          { id: 'material', label: 'Material', type: 'material' },
        ],
      },
    },
    { id: 'gen', type: 'bodyLimbGenerator', data: {} },
    { id: 'translate', type: 'translateY', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'radius', target: 'gen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'length', target: 'gen', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'spacing', target: 'gen', targetHandle: 'spacing' },
    { source: 'gen', sourceHandle: 'geometry', target: 'translate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'centerY', target: 'translate', targetHandle: 'y' },
    { source: 'translate', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
  ],
});
