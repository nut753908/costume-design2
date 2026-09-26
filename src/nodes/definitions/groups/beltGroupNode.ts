import { defineGroupNode } from '../groupNodeFactory';
import { bodyRadiusScale, bodyRadiusSockets } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** beltRadiusScale(numberMultiply)+material(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)に加え、山なりのバックル部分の帯を作る
 * `band`(`bulgedBand`、`nodes/definitions/generic/bulgedBand.ts`、scarf と共有)を1枚に
 * まとめたグループノード。
 * Radius/Thickness/Bulge/Segments は他のガーメントと共有されない単独パラメータのため、
 * numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Torso Radius(体の胴体半径、`scale` が倍率を掛ける)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される waistY)は外部ソケットのまま(`nodes/CLAUDE.md` の「グループノード」節参照)。 */
const output = garmentOutput({ offsetY: 0, geometry: 'band' });

const scale = bodyRadiusScale('torsoRadius', 1.23);

defineGroupNode({
  type: 'beltGroup',
  label: 'Belt',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          bodyRadiusSockets.torsoRadius,
          anchorYSocket,
          colorSocket('#3a2e26'),
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
