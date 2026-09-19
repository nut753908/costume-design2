import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** necktie の結び目・ブレードの大きさはスタイル寄りの独立した寸法だが、前面の深さ
 * (`frontDepthIn`)だけは、胴体の壁(Body Build でスケールされる)より前に出す必要があるため、
 * 他のガーメントの「体に触れる半径」と同じく Body Build を掛けてから生成ノードへ渡す
 * (`scale`)。necktieGen(necktieGenerator)+necktieMaterial(toonMaterial)+
 * offsetYIn(numberInput)+placement(garmentPlacement)+sceneOut(sceneOutput) を1枚にまとめる。
 * 全パラメータが他のガーメントと共有されない単独パラメータのため、外側の numberInput/
 * colorInput ノードではなくグループ内部の同型ノードとして保持する。Body Build と Anchor Y
 * (取り付け位置、ルートの `bodyLayout` 共有ノードから配線される shoulderY)は外部ソケット。 */
const output = garmentOutput({ color: { hex: '#7a1f2b', label: 'Necktie Color' }, offsetY: 0, geometry: 'gen' });

const scale = bodyBuildScale('frontDepthIn');

defineGroupNode({
  type: 'necktieGroup',
  label: 'Necktie',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          anchorYSocket,
        ],
      },
    },
    { id: 'knotWidthIn', type: 'numberInput', data: { value: 0.05, min: 0.03, max: 0.08, step: 0.005, label: 'Knot Width' } },
    { id: 'knotHeightIn', type: 'numberInput', data: { value: 0.04, min: 0.02, max: 0.07, step: 0.005, label: 'Knot Height' } },
    { id: 'knotThicknessIn', type: 'numberInput', data: { value: 0.025, min: 0.01, max: 0.05, step: 0.005, label: 'Knot Thickness' } },
    { id: 'bladeTopWidthIn', type: 'numberInput', data: { value: 0.035, min: 0.015, max: 0.06, step: 0.005, label: 'Blade Top Width' } },
    { id: 'bladeBottomWidthIn', type: 'numberInput', data: { value: 0.06, min: 0.03, max: 0.12, step: 0.005, label: 'Blade Bottom Width' } },
    { id: 'bladeThicknessIn', type: 'numberInput', data: { value: 0.008, min: 0.003, max: 0.02, step: 0.001, label: 'Blade Thickness' } },
    { id: 'bladeLengthIn', type: 'numberInput', data: { value: 0.4, min: 0.2, max: 0.7, step: 0.01, label: 'Blade Length' } },
    { id: 'frontDepthIn', type: 'numberInput', data: { value: 0.3, min: 0.2, max: 0.5, step: 0.01, label: 'Front Depth' } },
    ...scale.nodes,
    { id: 'gen', type: 'necktieGenerator', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'frontDepth' },
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
