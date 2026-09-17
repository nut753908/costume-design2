import { defineGroupNode } from '../groupNodeFactory';

/** `bodyGroup` にネストされる、胴体1パーツぶんの `gen(capsuleGenerator)→translate
 * (translateY)→sceneOut(sceneOutput)` チェーンだけを内包するグループノード。肌色
 * (Material)は4パーツ間で共有される値のため、このグループの内部に `colorInput`/
 * `toonMaterial` を持たず、`bodyGroup` 側の共有 `toonMaterial` から外部ソケットとして
 * 受け取るだけ(nodes/CLAUDE.md の「値が複数グループで共有される場合」参照)。
 *
 * ジェネレーターは Body 専用の `bodyTorsoGenerator` ではなく、汎用プリミティブノード
 * `capsuleGenerator`(`nodes/definitions/capsuleGenerator.ts`、`geometry/primitives.ts` の
 * `buildCapsuleGeometry()` をそのまま THREE.CapsuleGeometry でラップしただけ)を使う —
 * 「胴体」という意味付けはこのグループの配線(半径・長さをどう解決するか)側にのみあり、
 * ジェネレーター自体はカプセルなら何にでも使える。 */
defineGroupNode({
  type: 'bodyTorsoGroup',
  label: 'Body Torso',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'length', label: 'Length', type: 'number', default: 0 },
          { id: 'centerY', label: 'Center Y', type: 'number', default: 0 },
          { id: 'material', label: 'Material', type: 'material' },
        ],
      },
    },
    { id: 'gen', type: 'capsuleGenerator', data: {} },
    { id: 'translate', type: 'translateY', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'radius', target: 'gen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'length', target: 'gen', targetHandle: 'length' },
    { source: 'gen', sourceHandle: 'geometry', target: 'translate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'centerY', target: 'translate', targetHandle: 'y' },
    { source: 'translate', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
  ],
});
