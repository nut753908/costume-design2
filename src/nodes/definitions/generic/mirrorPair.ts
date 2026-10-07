import { defineGroupNode } from '../groupNodeFactory';

/** 受け取った1つの geometry を、±offset だけ X方向に離した左右対称なペアへまとめる
 * グループノード。`limbPair.ts`(腕/脚1組、`bodyGroupNode.ts` が使う)や `earPair.ts` が使う、
 * 共通の左右対称ペア化ノード。
 *
 * `translate`(X だけを配線)で +offset へ平行移動した geometry を、そのまま +側とし、`mirrorX`(X=0 について
 * 鏡像反転)した geometry を -側として `mergeGeometry` で結合する(`nodes/CLAUDE.md` の
 * 「グループノード」節参照)。入力は X=0 について対称な形状を想定しており、その場合 -側は
 * -offset へ平行移動したコピーと同じ形になる。 */
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
    { id: 'translatePos', type: 'translate', data: {} },
    { id: 'mirror', type: 'mirrorX', data: {} },
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
    { source: 'input', sourceHandle: 'geometry', target: 'translatePos', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'offset', target: 'translatePos', targetHandle: 'x' },
    { source: 'translatePos', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'translatePos', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'merge', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
