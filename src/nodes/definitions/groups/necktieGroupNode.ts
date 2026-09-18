import { defineGroupNode } from '../groupNodeFactory';
import { garmentOutput } from '../garmentOutput';

/** necktie は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * necktieGen(necktieGenerator)+necktieMaterial(toonMaterial)+
 * offsetYIn(numberInput)+placement(garmentPlacement)+sceneOut(sceneOutput) の5ノードを1枚にまとめる。全パラメータが他の
 * ガーメントと共有されない単独パラメータのため、外側の numberInput/colorInput ノードでは
 * なくグループ内部の同型ノードとして保持する。Anchor Y(取り付け位置、ルートの `bodyLayout`
 * 共有ノードから配線される shoulderY)だけが唯一の外部ソケット。 */
const output = garmentOutput({ color: { hex: '#7a1f2b', label: 'Necktie Color' }, offsetY: 0, geometry: 'gen' });

defineGroupNode({
  type: 'necktieGroup',
  label: 'Necktie',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 }],
      },
    },
    { id: 'knotWidthIn', type: 'numberInput', data: { value: 0.05, min: 0.03, max: 0.08, step: 0.005, label: 'Knot Width' } },
    { id: 'knotHeightIn', type: 'numberInput', data: { value: 0.04, min: 0.02, max: 0.07, step: 0.005, label: 'Knot Height' } },
    { id: 'knotThicknessIn', type: 'numberInput', data: { value: 0.025, min: 0.01, max: 0.05, step: 0.005, label: 'Knot Thickness' } },
    { id: 'bladeTopWidthIn', type: 'numberInput', data: { value: 0.035, min: 0.015, max: 0.06, step: 0.005, label: 'Blade Top Width' } },
    { id: 'bladeBottomWidthIn', type: 'numberInput', data: { value: 0.06, min: 0.03, max: 0.12, step: 0.005, label: 'Blade Bottom Width' } },
    { id: 'bladeThicknessIn', type: 'numberInput', data: { value: 0.008, min: 0.003, max: 0.02, step: 0.001, label: 'Blade Thickness' } },
    { id: 'bladeLengthIn', type: 'numberInput', data: { value: 0.4, min: 0.2, max: 0.7, step: 0.01, label: 'Blade Length' } },
    { id: 'gen', type: 'necktieGenerator', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    { source: 'knotWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'knotWidth' },
    { source: 'knotHeightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'knotHeight' },
    { source: 'knotThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'knotThickness' },
    { source: 'bladeTopWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeTopWidth' },
    { source: 'bladeBottomWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeBottomWidth' },
    { source: 'bladeThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeThickness' },
    { source: 'bladeLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeLength' },
    ...output.edges,
  ],
});
