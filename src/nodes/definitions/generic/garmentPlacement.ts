import { defineGroupNode } from '../groupNodeFactory';

/** geometry を、あらかじめ計算済みのアンカーY(`anchorY`)+`offsetY` が指す実座標へ
 * 平行移動するグループノード。Blender の Geometry Nodes で「別オブジェクトの位置を
 * サンプリングして Translate Geometry に渡す」のと同じ考え方 — 取り付け位置をメタデータ
 * として運ぶのではなく、ジオメトリの頂点座標そのものに焼き込む。これにより `groupOutput`
 * (そして `Garments.tsx`)は anchorY/offsetY を一切知る必要がなく、常に「原点に置けば
 * 正しい位置になる」geometry+material の2つだけを扱えばよい。
 *
 * 内部は `numberAdd`(anchorY + offsetY)→`translate`(Y だけを配線)の2ノードだけ。どのアンカーを
 * 使うかは呼び出し側が `bodyLayout` の5つの候補のどれを `anchorY` へ配線するかで決まり、
 * このノード自身はアンカー種を選ぶ仕組みを持たない(`nodes/CLAUDE.md` の
 * 「グループノード」節参照)。 */
defineGroupNode({
  type: 'garmentPlacement',
  label: 'Garment Placement',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'geometry', label: 'Geometry', type: 'geometry' },
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
          { id: 'offsetY', label: 'Offset Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'offsetAdd', type: 'numberAdd', data: {} },
    { id: 'translate', type: 'translate', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'anchorY', target: 'offsetAdd', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'offsetY', target: 'offsetAdd', targetHandle: 'b' },

    { source: 'input', sourceHandle: 'geometry', target: 'translate', targetHandle: 'geometry' },
    { source: 'offsetAdd', sourceHandle: 'value', target: 'translate', targetHandle: 'y' },
    { source: 'translate', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
