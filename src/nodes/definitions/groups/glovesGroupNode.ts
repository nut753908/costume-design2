import { defineGroupNode } from '../groupNodeFactory';
import { garmentOutput } from '../garmentOutput';

/** glovesWristScale(numberMultiply)+profile(easedLatheProfile)+gloveGen(latheGenerator)+
 * mirror(mirrorPair)+glovesMaterial(toonMaterial)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Wrist Radius/Hand Radius/Length/Arm Spacing/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの
 * `bodyLayout` 共有ノードから配線される wristY)は外部ソケットのまま。
 *
 * 手袋1つぶんのジオメトリ(`profile`→`gloveGen`)と、それを ±armSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `bodyGroupNode.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。専用の `segmentsIn`
 * (`numberInput`)を置いているのは、未接続ソケットが型の既定値へフォールバックすると
 * その値がカード上のどこにも見えなくなるため。 */
const output = garmentOutput({ color: { hex: '#b0413e', label: 'Gloves Color' }, offsetY: 0, geometry: 'mirror' });

defineGroupNode({
  type: 'glovesGroup',
  label: 'Gloves',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'wristRadiusIn', type: 'numberInput', data: { value: 0.08, min: 0.05, max: 0.12, step: 0.005, label: 'Wrist Radius' } },
    { id: 'handRadiusIn', type: 'numberInput', data: { value: 0.09, min: 0.05, max: 0.16, step: 0.005, label: 'Hand Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.14, min: 0.05, max: 0.25, step: 0.005, label: 'Length' } },
    { id: 'armSpacingIn', type: 'numberInput', data: { value: 0.34, min: 0.2, max: 0.5, step: 0.01, label: 'Arm Spacing' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 12, min: 8, max: 32, step: 1, label: 'Segments' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'profile', type: 'easedLatheProfile', data: { direction: 'down', steps: 10 } },
    { id: 'gloveGen', type: 'latheGenerator', data: {} },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    { source: 'wristRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'handRadiusIn', sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'profile', targetHandle: 'distance' },
    { source: 'profile', sourceHandle: 'points', target: 'gloveGen', targetHandle: 'points' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gloveGen', targetHandle: 'segments' },
    { source: 'gloveGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'armSpacingIn', sourceHandle: 'value', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
