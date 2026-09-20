import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** beltRadiusScale(numberMultiply)+material(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)に加え、山なりのバックル部分の帯を作る
 * `band`(`bulgedBand`、`nodes/definitions/generic/bulgedBand.ts`、scarf と共有)を1枚に
 * まとめたグループノード。
 * Radius/Thickness/Bulge/Segments/Color は他のガーメントと共有されない単独パラメータのため、
 * numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される waistY)は外部ソケットのまま(`nodes/CLAUDE.md` の「グループノード」節参照)。 */
const output = garmentOutput({ color: '#3a2e26', offsetY: 0, geometry: 'band' });

const scale = bodyBuildScale(0.32);

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
    ...scale.nodes,
    { id: 'band', type: 'bulgedBand', data: { thickness: 0.05, bulge: 1.15, segments: 24 } },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'band', targetHandle: 'radius' },
    ...output.edges,
  ],
});
