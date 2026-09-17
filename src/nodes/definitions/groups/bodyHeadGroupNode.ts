import { defineGroupNode } from '../groupNodeFactory';

/** `bodyGroup` にネストされる、頭1パーツぶんの `gen(sphereGenerator)→translate
 * (translateY)→sceneOut(sceneOutput)` チェーンだけを内包するグループノード。
 * `bodyTorsoGroupNode.ts` と同じ理由・同じ形(Material は共有ノードから外部ソケットで
 * 受け取るだけ)で分割した。ジェネレーターは Body 専用の `bodyHeadGenerator` ではなく、
 * 汎用プリミティブノード `sphereGenerator`(`nodes/definitions/sphereGenerator.ts`)を使う
 * (`bodyTorsoGroupNode.ts` の `capsuleGenerator` と同じ理由)。 */
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
    { id: 'gen', type: 'sphereGenerator', data: {} },
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
