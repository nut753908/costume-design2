import { defineGroupNode } from './groupNodeFactory';

/** topGen(topGenerator)+mesh(garmentMesh)+anchor(garmentAnchor)+outputIO(groupOutput) を
 * 1枚にまとめたグループノード。Length/Neckline/Neckline Depth は他のガーメントと共有され
 * ない単独パラメータのため、外側の numberInput/enumInput ノードではなくグループ内部の同型
 * ノードとして保持する。
 *
 * Torso Radius(Body Build 適用後のスケール済みの値)と Material は、sleeve の描画にも
 * そのまま必要な値のため、`bodyBuild` のように他ガーメントと共有される値と同じ扱いで
 * 外部ソケット(`torsoRadius`/`material`)として受け取る — かつてはこの2つを topGroup
 * 内部の `numberMultiply`/`toonMaterial` として計算し、`groupOutput` 経由で sleeve に
 * 再公開していたが、「本来共有すべき値がグループの中に閉じ込められている」という設計上の
 * 問題があったため、計算自体を `src/state/initialGraph.ts` 側の共有ノード(`topRadiusScale`/
 * `topMaterial`)へ引き上げ、topGroup/sleeveGroup の両方へ普通の外部ソケットとして
 * ファンアウトする形に改めた(`src/geometry/CLAUDE.md` の sleeve の節が元々説明していた
 * 「1つの Color/Material ノードから2つの Garment Output へのファンアウト」を文字通り実現)。
 * `outputIO`(`groupOutput`)は、その「他ガーメントへの再公開」という以前の役割ではなく、
 * `defineGroupNode()` が全グループに必須とする geometry/material/anchor/offsetY の
 * 通常の出力経路として使っている(`groupNodeFactory.ts` 参照)。 */
defineGroupNode({
  type: 'topGroup',
  label: 'Top',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0.29 },
          { id: 'material', label: 'Material', type: 'material' },
          { id: 'bodyHeight', label: 'Body Height', type: 'number', default: 1 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'bodyShoulder', label: 'Body Shoulder', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.5, min: 0.2, max: 0.9, step: 0.01, label: 'Length' } },
    { id: 'necklineIn', type: 'enumInput', data: { value: 'round', options: ['round', 'v', 'square'], label: 'Neckline' } },
    { id: 'necklineDepthIn', type: 'numberInput', data: { value: 0.12, min: 0, max: 0.3, step: 0.01, label: 'Neckline Depth' } },
    { id: 'gen', type: 'topGenerator', data: {} },
    { id: 'mesh', type: 'garmentMesh', data: {} },
    { id: 'anchor', type: 'garmentAnchor', data: { anchor: 'shoulder', offsetY: 0 } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    {
      id: 'outputIO',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'geometry', label: 'Geometry', type: 'geometry' },
          { id: 'material', label: 'Material', type: 'material' },
        ],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'torsoRadius', target: 'gen', targetHandle: 'torsoRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'necklineIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineType' },
    { source: 'necklineDepthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineDepth' },
    { source: 'gen', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'material', target: 'mesh', targetHandle: 'material' },
    { source: 'mesh', sourceHandle: 'geometry', target: 'outputIO', targetHandle: 'geometry' },
    { source: 'mesh', sourceHandle: 'material', target: 'outputIO', targetHandle: 'material' },
    { source: 'anchor', sourceHandle: 'anchor', target: 'placement', targetHandle: 'anchor' },
    { source: 'anchor', sourceHandle: 'offsetY', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'bodyHeight', target: 'placement', targetHandle: 'bodyHeight' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'placement', targetHandle: 'bodyBuild' },
    { source: 'input', sourceHandle: 'bodyShoulder', target: 'placement', targetHandle: 'bodyShoulder' },
    { source: 'placement', sourceHandle: 'geometry', target: 'mesh', targetHandle: 'geometry' },
  ],
});
