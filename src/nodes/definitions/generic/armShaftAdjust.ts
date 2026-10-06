import { defineGroupNode } from '../groupNodeFactory';

/** `bodyGroupNode.ts` 用。腕の付け根を胴体へ寄せるための、長さ・中心の高さ・左右の間隔の補正。
 * - `drop`: 付け根(軸の上端)を下げる量。付け根の丸みを胴体の中へ埋め、肩の上に盛り上がって見えないようにする。
 *   上端だけが `drop` 動くよう、`length` は `drop` 短く、`centerY` は `drop / 2` 下がる。
 * - `inset`: 付け根を首側(内側)へ寄せる量(`spacing` が `inset` 狭くなる)。手の位置は `limbPair` の `swingAngle` で保つ。 */
defineGroupNode({
  type: 'armShaftAdjust',
  label: 'Arm Shaft Adjust',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'length', label: 'Length', type: 'number', default: 0 },
          { id: 'centerY', label: 'Center Y', type: 'number', default: 0 },
          { id: 'spacing', label: 'Spacing', type: 'number', default: 0 },
          { id: 'drop', label: 'Drop', type: 'number', default: 0.0293 },
          { id: 'inset', label: 'Inset', type: 'number', default: 0.01843 },
        ],
      },
    },
    { id: 'dropHalf', type: 'numberHalf', data: {} },
    { id: 'lengthAdjusted', type: 'numberSubtract', data: {} },
    { id: 'centerYAdjusted', type: 'numberSubtract', data: {} },
    { id: 'spacingAdjusted', type: 'numberSubtract', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'length', label: 'Length', type: 'number' },
          { id: 'centerY', label: 'Center Y', type: 'number' },
          { id: 'spacing', label: 'Spacing', type: 'number' },
        ],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'length', target: 'lengthAdjusted', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'drop', target: 'lengthAdjusted', targetHandle: 'b' },
    { source: 'lengthAdjusted', sourceHandle: 'value', target: 'output', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'drop', target: 'dropHalf', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'centerY', target: 'centerYAdjusted', targetHandle: 'a' },
    { source: 'dropHalf', sourceHandle: 'value', target: 'centerYAdjusted', targetHandle: 'b' },
    { source: 'centerYAdjusted', sourceHandle: 'value', target: 'output', targetHandle: 'centerY' },
    { source: 'input', sourceHandle: 'spacing', target: 'spacingAdjusted', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'inset', target: 'spacingAdjusted', targetHandle: 'b' },
    { source: 'spacingAdjusted', sourceHandle: 'value', target: 'output', targetHandle: 'spacing' },
  ],
});
