import { defineGroupNode } from './groupNodeFactory';

/** `bodyGroup` にネストされる、頭1パーツぶんの `gen(bodyHeadGenerator)→translate
 * (translateY)→sceneOut(sceneOutput)` チェーンだけを内包するグループノード。
 * `bodyTorsoGroupNode.ts` と同じ理由・同じ形(Material は共有ノードから外部ソケットで
 * 受け取るだけ)で分割した。 */
defineGroupNode({
  type: 'bodyHeadGroup',
  label: 'Body Head',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'centerY', label: 'Center Y', type: 'number', default: 0 },
          { id: 'material', label: 'Material', type: 'material' },
        ],
      },
    },
    { id: 'gen', type: 'bodyHeadGenerator', data: {} },
    { id: 'translate', type: 'translateY', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'radius', target: 'gen', targetHandle: 'radius' },
    { source: 'gen', sourceHandle: 'geometry', target: 'translate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'centerY', target: 'translate', targetHandle: 'y' },
    { source: 'translate', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
  ],
});
