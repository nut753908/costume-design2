import { defineGroupNode } from '../groupNodeFactory';
import { latheBody } from '../garmentParts';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** 頭に被さるつばの半径(`brimRadiusCalc`)は、ボディの頭半径(`bodyDimensions.headRadius` の基準値)× 1.25 の固定値。
 * profile(easedLatheCurve)+hatGen(latheGenerator)+hatMaterial(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput) を1枚に
 * まとめる。Crown Radius/Height は他のガーメントと共有されない単独
 * パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される headCenterY)は外部ソケット。
 *
 * head は左右対称な単一パーツなので `mirrorPair` は挟まない。hat は shoes/socks と同じ
 * `direction: 'up'`(つばから上=クラウン側へ伸びる)。 */
const output = garmentOutput({ offsetY: 0.1, geometry: 'gen' });

const lathe = latheBody({ genId: 'gen', direction: 'up', steps: 10, startRadius: 'brimRadiusCalc', endRadius: 0.02, distance: 0.35, segments: 20 });

defineGroupNode({
  type: 'hatGroup',
  label: 'Hat',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          anchorYSocket,
          colorSocket('#4a3b6b'),
        ],
      },
    },
    { id: 'brimRadiusCalc', type: 'numberInput', data: { value: BODY_DIMENSIONS.headRadius * 1.25 } },
    ...lathe.nodes,
    ...output.nodes,
  ],
  internalEdges: [
    ...lathe.edges,
    ...output.edges,
  ],
});
