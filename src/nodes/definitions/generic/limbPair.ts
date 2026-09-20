import { defineGroupNode } from '../groupNodeFactory';

/** 手首/足首側を根元よりわずかに細くしたテーパー円柱1本を、±spacing だけ X方向に離した左右
 * 対称ペアにして Y方向へ配置するグループノード。`bodyGroupNode.ts` が腕1組・脚1組の
 * 2箇所で使う(同じ4段の構成が2回並ぶ重複をまとめたもの)。
 *
 * 根元の半径 `radius` はそのまま `cylinderGenerator.radiusTop` へ、`taperRatio` を掛けた値を
 * `radiusBottom` へ渡す(`taper`、`numberMultiply`)。`taperRatio` は腕と脚で別々の値を
 * 持てるよう、このグループの内部ではなく呼び出し側(`bodyGroup`)の `numberInput` から外部
 * ソケットとして受け取る。 */
defineGroupNode({
  type: 'limbPair',
  label: 'Limb Pair',
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
          { id: 'taperRatio', label: 'Taper Ratio', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'taper', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'cylinderGenerator', data: {} },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    { id: 'translate', type: 'translateY', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'radius', target: 'gen', targetHandle: 'radiusTop' },
    { source: 'input', sourceHandle: 'radius', target: 'taper', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'taperRatio', target: 'taper', targetHandle: 'factor' },
    { source: 'taper', sourceHandle: 'value', target: 'gen', targetHandle: 'radiusBottom' },
    { source: 'input', sourceHandle: 'length', target: 'gen', targetHandle: 'height' },
    { source: 'gen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'spacing', target: 'mirror', targetHandle: 'offset' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'translate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'centerY', target: 'translate', targetHandle: 'y' },
    { source: 'translate', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
