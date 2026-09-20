import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** beltRadiusScale(numberMultiply)+material(toonMaterial)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)に加え、山なりのバックル部分の帯を作る
 * `band`(`bulgedBand`、`nodes/definitions/generic/bulgedBand.ts`、scarf と共有)を1枚に
 * まとめたグループノード。
 * Radius/Thickness/Bulge/Segments/Color は他のガーメントと共有されない単独パラメータのため、
 * 外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 * Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される waistY)は外部ソケットのまま(`nodes/CLAUDE.md` の「グループノード」節参照)。 */
const output = garmentOutput({ color: '#3a2e26', offsetY: 0, geometry: 'band' });

const scale = bodyBuildScale('radiusIn');

defineGroupNode({
  type: 'beltGroup',
  label: 'Belt',
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
    { id: 'radiusIn', type: 'numberInput', data: { value: 0.32} },
    { id: 'thicknessIn', type: 'numberInput', data: { value: 0.05} },
    { id: 'bulgeIn', type: 'numberInput', data: { value: 1.15} },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 24} },
    ...scale.nodes,
    { id: 'band', type: 'bulgedBand', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'band', targetHandle: 'radius' },
    { source: 'thicknessIn', sourceHandle: 'value', target: 'band', targetHandle: 'thickness' },
    { source: 'bulgeIn', sourceHandle: 'value', target: 'band', targetHandle: 'bulge' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'band', targetHandle: 'segments' },

    ...output.edges,
  ],
});
