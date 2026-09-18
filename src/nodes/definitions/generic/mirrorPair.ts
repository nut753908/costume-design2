import { defineGroupNode } from '../groupNodeFactory';

/** 受け取った1つの geometry を、±offset だけ X方向に離した左右対称なペアへまとめる
 * グループノード。`bodyGroupNode.ts`(腕/脚1組)/`pantsGroupNode.ts`(左右2脚)/
 * `shoesGroupNode.ts`(左右2本)/`glovesGroupNode.ts`(左右2つ)/`socksGroupNode.ts`
 * (左右2本)が使う、全ガーメント共通の左右対称ペア化ノード。
 *
 * `offset` は片方の `translateX` へはそのまま、もう片方へは `negate`(`numberNegate`)を
 * 経由して符号反転してから渡すことで、+offset/-offset それぞれへ平行移動した2つの
 * コピーを作る(`nodes/CLAUDE.md` の「グループノード」節参照)。 */
defineGroupNode({
  type: 'mirrorPair',
  label: 'Mirror Pair',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'geometry', label: 'Geometry', type: 'geometry' },
          { id: 'offset', label: 'Offset', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'negate', type: 'numberNegate', data: { label: 'Negate Offset' } },
    { id: 'translateNeg', type: 'translateX', data: {} },
    { id: 'translatePos', type: 'translateX', data: {} },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'offset', target: 'negate', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'geometry', target: 'translateNeg', targetHandle: 'geometry' },
    { source: 'negate', sourceHandle: 'value', target: 'translateNeg', targetHandle: 'x' },
    { source: 'input', sourceHandle: 'geometry', target: 'translatePos', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'offset', target: 'translatePos', targetHandle: 'x' },
    { source: 'translateNeg', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometryA' },
    { source: 'translatePos', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometryB' },
    { source: 'merge', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
