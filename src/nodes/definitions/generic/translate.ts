import { defineGroupNode } from '../groupNodeFactory';

/** geometry を X/Y/Z の3軸方向へ平行移動するグループノード。`translateX`/`translateY`/
 * `translateZ` を直列に並べただけで、`bagGroupNode.ts`/`scarfGroupNode.ts` が複数軸へ
 * 移動する箇所で使う。動かさない軸は未接続のままにする(既定値 0)。 */
defineGroupNode({
  type: 'translate',
  label: 'Translate',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'geometry', label: 'Geometry', type: 'geometry' },
          { id: 'x', label: 'X', type: 'number', default: 0 },
          { id: 'y', label: 'Y', type: 'number', default: 0 },
          { id: 'z', label: 'Z', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'translateX', type: 'translateX', data: {} },
    { id: 'translateY', type: 'translateY', data: {} },
    { id: 'translateZ', type: 'translateZ', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'geometry', target: 'translateX', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'x', target: 'translateX', targetHandle: 'x' },
    { source: 'translateX', sourceHandle: 'geometry', target: 'translateY', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'y', target: 'translateY', targetHandle: 'y' },
    { source: 'translateY', sourceHandle: 'geometry', target: 'translateZ', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'z', target: 'translateZ', targetHandle: 'z' },
    { source: 'translateZ', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
